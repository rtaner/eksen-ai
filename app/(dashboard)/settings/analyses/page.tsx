import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AnalysesPageClient from '@/components/analyses/AnalysesPageClient';

export default async function AnalysesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check permissions
  const isOwner = profile.role === 'owner';
  let canView = isOwner;

  // If manager, check if they have view permission for analyses
  if (profile.role === 'manager') {
    const { data: permission } = await supabase
      .from('permissions')
      .select('can_view')
      .eq('organization_id', profile.organization_id)
      .eq('role', 'manager')
      .eq('resource_type', 'analyses')
      .single();

    canView = permission?.can_view || false;
  }

  // If not owner and no view permission, redirect
  if (!canView) {
    redirect('/personnel');
  }

  // Fetch personnel list for filter
  const { data: personnel } = await supabase
    .from('personnel')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .order('name');

  // Fetch analyses
  const { data: analyses } = await supabase
    .from('ai_analyses')
    .select(`
      id,
      analysis_type,
      date_range_start,
      date_range_end,
      created_at,
      personnel:personnel_id (
        id,
        name
      ),
      creator:created_by (
        id,
        name,
        surname
      )
    `)
    .in(
      'personnel_id',
      (personnel || []).map((p) => p.id)
    )
    .order('created_at', { ascending: false });

  return (
    <AnalysesPageClient
      analyses={analyses || []}
      personnel={personnel || []}
      isOwner={isOwner}
      userId={user.id}
    />
  );
}

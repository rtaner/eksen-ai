import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AnalysisDetailClient from '@/components/analyses/AnalysisDetailClient';

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch analysis
  const { data: analysis, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !analysis) {
    redirect('/settings/analyses');
  }

  // Fetch personnel separately
  const { data: personnel } = await supabase
    .from('personnel')
    .select('id, name, organization_id')
    .eq('id', analysis.personnel_id)
    .single();

  if (!personnel || personnel.organization_id !== profile.organization_id) {
    redirect('/settings/analyses');
  }

  // Fetch creator separately
  const { data: creator } = await supabase
    .from('profiles')
    .select('id, name, surname')
    .eq('id', analysis.created_by)
    .single();

  // Attach personnel and creator to analysis
  const analysisWithRelations = {
    ...analysis,
    personnel,
    creator,
  };

  return <AnalysisDetailClient analysis={analysisWithRelations} isOwner={isOwner} />;
}

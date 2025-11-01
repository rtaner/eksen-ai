import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PersonnelDetailClient from '@/components/personnel/PersonnelDetailClient';

interface PersonnelDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PersonnelDetailPage({
  params,
}: PersonnelDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile to get organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Fetch personnel details
  const { data: personnel, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (error || !personnel) {
    redirect('/personnel');
  }

  return (
    <div>
      <PersonnelDetailClient personnel={personnel} />
    </div>
  );
}

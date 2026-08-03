import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PersonnelDirectoryClient from '@/components/personnel/PersonnelDirectoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PersonnelListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, name, surname, username, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const { data: permissions } = await supabase
    .from('permissions')
    .select('can_view')
    .eq('organization_id', profile.organization_id)
    .eq('role', profile.role)
    .eq('resource_type', 'personnel')
    .single();

  const canViewPersonnel = profile.role === 'owner' || permissions?.can_view === true;

  if (!canViewPersonnel) {
    const selfPersonnel = [{
      id: user.id,
      organization_id: profile.organization_id,
      name: `${profile.name || ''} ${profile.surname || ''}`.trim() || 'Ben',
      metadata: {
        username: profile.username,
        role: profile.role,
        from_user: true,
      },
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }];

    return <PersonnelDirectoryClient initialPersonnel={selfPersonnel} />;
  }

  const { data: personnel, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personnel:', error);
  }

  let profilesQuery = supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false });

  if (profile.role !== 'owner') {
    profilesQuery = profilesQuery.neq('role', 'owner');
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  const personnelFromProfiles = (profiles || []).map((p) => ({
    id: p.id,
    organization_id: p.organization_id,
    name: `${p.name} ${p.surname}`,
    metadata: {
      username: p.username,
      role: p.role,
      from_user: true,
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const existingUserIds = new Set(
    (personnel || [])
      .filter((p) => p.metadata?.user_id)
      .map((p) => p.metadata.user_id)
  );

  const uniquePersonnelFromProfiles = personnelFromProfiles.filter(
    (p) => !existingUserIds.has(p.id)
  );

  const allPersonnel = [...(personnel || []), ...uniquePersonnelFromProfiles];

  return <PersonnelDirectoryClient initialPersonnel={allPersonnel} />;
}

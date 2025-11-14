import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PersonnelPageClient from '@/components/personnel/PersonnelPageClient';

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PersonnelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile to get organization_id, role, name, surname
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, name, surname, username, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check personnel view permission
  const { data: permissions } = await supabase
    .from('permissions')
    .select('can_view')
    .eq('organization_id', profile.organization_id)
    .eq('role', profile.role)
    .eq('resource_type', 'personnel')
    .single();

  const canViewPersonnel = profile.role === 'owner' || permissions?.can_view === true;

  // If user cannot view personnel list, only show themselves
  if (!canViewPersonnel) {
    // Only show current user
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

    return <PersonnelPageClient initialPersonnel={selfPersonnel} />;
  }

  // Fetch all personnel for the organization
  const { data: personnel, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching personnel:', error);
  }

  // Fetch all users (profiles) in the organization
  // If current user is not owner, exclude owner role from results
  let profilesQuery = supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false });

  // Filter out owner role if current user is not owner
  if (profile.role !== 'owner') {
    profilesQuery = profilesQuery.neq('role', 'owner');
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  // Combine personnel and profiles
  // Convert profiles to personnel format
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

  // Filter out profiles that already exist in personnel (by checking metadata.user_id)
  const existingUserIds = new Set(
    (personnel || [])
      .filter((p) => p.metadata?.user_id)
      .map((p) => p.metadata.user_id)
  );

  const uniquePersonnelFromProfiles = personnelFromProfiles.filter(
    (p) => !existingUserIds.has(p.id)
  );

  // Combine both lists
  const allPersonnel = [...(personnel || []), ...uniquePersonnelFromProfiles];

  return <PersonnelPageClient initialPersonnel={allPersonnel} />;
}

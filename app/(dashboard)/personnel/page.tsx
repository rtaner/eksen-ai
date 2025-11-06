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

  // Fetch profile to get organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
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

  // Fetch all users (profiles) in the organization except owner
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .neq('role', 'owner')
    .order('created_at', { ascending: false });

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

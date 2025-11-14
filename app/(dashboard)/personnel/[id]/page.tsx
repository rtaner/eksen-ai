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

  // Fetch profile to get organization_id and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
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

  // If user cannot view personnel, only allow viewing themselves
  if (!canViewPersonnel && id !== user.id) {
    redirect('/personnel');
  }

  // Fetch personnel details
  let personnel = null;
  const { data: personnelData, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single();

  if (personnelData) {
    personnel = personnelData;
  } else {
    // If not found in personnel table, try to get from profiles (profile-based personnel)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (profileData) {
      // Convert profile to personnel format
      personnel = {
        id: profileData.id,
        organization_id: profileData.organization_id,
        name: `${profileData.name} ${profileData.surname}`,
        metadata: {
          username: profileData.username,
          role: profileData.role,
          from_user: true,
        },
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      };
    }
  }

  if (!personnel) {
    redirect('/personnel');
  }

  return (
    <div>
      <PersonnelDetailClient personnel={personnel} />
    </div>
  );
}

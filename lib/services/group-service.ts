import { createClient } from '@/lib/supabase/client';
import { Group, GroupWithMembers, Personnel } from '@/lib/types';

export async function getGroups(): Promise<GroupWithMembers[]> {
  const supabase = createClient();
  
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        personnel (
          id,
          name,
          organization_id,
          metadata,
          created_at,
          updated_at
        )
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return (groups || []).map((g: any) => {
    const members: Personnel[] = (g.group_members || [])
      .map((gm: any) => gm.personnel)
      .filter(Boolean);

    return {
      id: g.id,
      organization_id: g.organization_id,
      name: g.name,
      description: g.description,
      created_at: g.created_at,
      updated_at: g.updated_at,
      members,
      member_count: members.length,
    };
  });
}

export async function createGroup(
  name: string,
  description: string | null,
  personnelIds: string[]
): Promise<{ success: boolean; group?: Group; error?: string }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Oturum açmanız gerekiyor' };

  // Get user profile for organization_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return { success: false, error: 'Organizasyon bulunamadı' };

  const { data: group, error: createError } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      organization_id: profile.organization_id,
    })
    .select()
    .single();

  if (createError || !group) {
    console.error('Error creating group:', createError);
    return { success: false, error: createError?.message || 'Grup oluşturulamadı' };
  }

  if (personnelIds.length > 0) {
    const memberRows = personnelIds.map((pId) => ({
      group_id: group.id,
      personnel_id: pId,
    }));

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberRows);

    if (membersError) {
      console.error('Error adding group members:', membersError);
    }
  }

  return { success: true, group };
}

export async function updateGroup(
  groupId: string,
  name: string,
  description: string | null,
  personnelIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from('groups')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', groupId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Sync members
  await supabase.from('group_members').delete().eq('group_id', groupId);

  if (personnelIds.length > 0) {
    const memberRows = personnelIds.map((pId) => ({
      group_id: groupId,
      personnel_id: pId,
    }));

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberRows);

    if (membersError) {
      console.error('Error updating group members:', membersError);
    }
  }

  return { success: true };
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

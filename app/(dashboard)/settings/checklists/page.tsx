import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChecklistManagement from '@/components/checklists/ChecklistManagement';

export default async function ChecklistsSettingsPage() {
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
    .select('role')
    .eq('id', user.id)
    .single();

  // Only owners can access this page
  if (profile?.role !== 'owner') {
    redirect('/settings');
  }

  return (
    <div>
      <ChecklistManagement />
    </div>
  );
}

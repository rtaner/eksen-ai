import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MyTasksClient from '@/components/tasks/MyTasksClient';

export default async function MyTasksPage() {
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
    .select('role, organization_id, name, surname, username')
    .eq('id', user.id)
    .single();

  // Only personnel and manager can access this page
  if (!profile || profile.role === 'owner') {
    redirect('/personnel');
  }

  // Find personnel record for this user
  // Check by metadata.user_id
  const { data: personnelRecords } = await supabase
    .from('personnel')
    .select('*')
    .eq('organization_id', profile.organization_id);

  let myPersonnelRecord = personnelRecords?.find(
    (p) => p.metadata?.user_id === user.id
  );

  // If no personnel record exists in personnel table, use user.id directly
  // This handles the case where user is registered but not yet added to personnel table
  const personnelId = myPersonnelRecord?.id || user.id;

  // Fetch open tasks for this personnel
  // Tasks can be assigned to either personnel.id or user.id (for backward compatibility)
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('personnel_id', personnelId)
    .eq('status', 'open')
    .order('deadline', { ascending: true });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }

  const tasks = tasksData || [];

  return (
    <MyTasksClient
      initialTasks={tasks}
      personnelId={personnelId}
      userId={user.id}
    />
  );
}

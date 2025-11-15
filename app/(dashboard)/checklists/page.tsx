import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChecklistsClient from '@/components/checklists/ChecklistsClient';

export default async function ChecklistsPage() {
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
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div>
      <ChecklistsClient />
    </div>
  );
}

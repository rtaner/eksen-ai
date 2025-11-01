import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TestNotificationsClient from './TestNotificationsClient';

export default async function TestNotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  // Only owner can access test page
  if (profile?.role !== 'owner') {
    redirect('/personnel');
  }

  return (
    <TestNotificationsClient 
      userId={user.id} 
      organizationId={profile.organization_id} 
    />
  );
}

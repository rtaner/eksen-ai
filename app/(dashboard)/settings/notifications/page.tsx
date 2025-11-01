import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PushNotificationSettings from '@/components/settings/PushNotificationSettings';

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bildirim Ayarları</h1>
        <p className="text-gray-600">
          Push bildirimlerini yönetin ve tercihlerinizi ayarlayın
        </p>
      </div>

      <div className="max-w-2xl">
        <PushNotificationSettings />
      </div>
    </div>
  );
}

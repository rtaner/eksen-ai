import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PermissionMatrix from '@/components/permissions/PermissionMatrix';
import Link from 'next/link';

export default async function PermissionsPage() {
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

  // Only owner can access this page
  if (profile?.role !== 'owner') {
    redirect('/personnel');
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Ayarlara Dön
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Yetki Yönetimi
        </h1>
        <p className="text-gray-600">
          Yönetici ve personel rollerinin yetkilerini düzenleyin
        </p>
      </div>
      
      <PermissionMatrix />
    </div>
  );
}

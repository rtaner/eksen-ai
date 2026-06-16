import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StoreAnalysisDatabaseClient from '@/components/store-analysis/StoreAnalysisDatabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoreAnalysisDatabasePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch recent completed analyses for this organization
  const { data: analyses } = await supabase
    .from('store_analyses')
    .select('id, dashboard_data, created_at')
    .eq('organization_id', profile.organization_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Mağaza Analizi Veritabanı Kayıtları
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Yüklediğiniz belgelerden veritabanına işlenen ham satır ve sütun verilerini detaylıca sorgulayın ve doğrulayın
        </p>
      </div>

      <StoreAnalysisDatabaseClient 
        initialAnalyses={analyses || []} 
      />
    </div>
  );
}

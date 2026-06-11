import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StoreAnalysisClient from '@/components/store-analysis/StoreAnalysisClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoreAnalysisPage() {
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

  // Fetch the latest 3 completed store analyses for this organization
  const { data: latestAnalyses } = await supabase
    .from('store_analyses')
    .select('dashboard_data, created_at')
    .eq('organization_id', profile.organization_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mağaza Analizi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Yapay zeka destekli ticari performans ve stok analizi
          </p>
        </div>
      </div>

      <StoreAnalysisClient 
        historyAnalyses={latestAnalyses || []} 
        isOwner={profile.role === 'owner'}
      />
    </div>
  );
}

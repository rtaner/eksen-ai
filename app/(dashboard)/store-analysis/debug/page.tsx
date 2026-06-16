import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StoreAnalysisDebugClient from '@/components/store-analysis/StoreAnalysisDebugClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoreAnalysisDebugPage() {
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

  // Fetch recent jobs
  const { data: jobs } = await supabase
    .from('ai_analysis_jobs')
    .select('id, status, error_message, created_at, updated_at, raw_text, extracted_data')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent analyses
  const { data: analyses } = await supabase
    .from('store_analyses')
    .select('id, dashboard_data, created_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Veritabanı Diagnostik Paneli
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Supabase üzerindeki ham analiz işlerini (ai_analysis_jobs) ve işlenmiş sonuçları (store_analyses) izleyin
        </p>
      </div>

      <StoreAnalysisDebugClient 
        initialJobs={jobs || []} 
        initialAnalyses={analyses || []} 
      />
    </div>
  );
}

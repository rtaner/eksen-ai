'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Job {
  id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  raw_text: string | null;
  extracted_data: any;
}

interface Analysis {
  id: string;
  dashboard_data: any;
  created_at: string;
}

interface StoreAnalysisDebugClientProps {
  initialJobs: Job[];
  initialAnalyses: Analysis[];
}

export default function StoreAnalysisDebugClient({
  initialJobs,
  initialAnalyses,
}: StoreAnalysisDebugClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [analyses, setAnalyses] = useState<Analysis[]>(initialAnalyses);
  const [activeTab, setActiveTab] = useState<'jobs' | 'analyses'>('jobs');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inspectContent, setInspectContent] = useState<{
    title: string;
    type: 'json' | 'text';
    data: any;
  } | null>(null);

  const supabase = createClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh jobs
      const { data: refreshedJobs, error: jobsError } = await supabase
        .from('ai_analysis_jobs')
        .select('id, status, error_message, created_at, updated_at, raw_text, extracted_data')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;
      if (refreshedJobs) setJobs(refreshedJobs);

      // Refresh analyses
      const { data: refreshedAnalyses, error: analysesError } = await supabase
        .from('store_analyses')
        .select('id, dashboard_data, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (analysesError) throw analysesError;
      if (refreshedAnalyses) setAnalyses(refreshedAnalyses);
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Veriler güncellenirken bir hata oluştu.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'extracting':
      case 'analyzing':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopyalandı!');
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Analiz İşleri (ai_analysis_jobs)
          </button>
          <button
            onClick={() => setActiveTab('analyses')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'analyses'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            İşlenmiş Analizler (store_analyses)
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? (
            <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🔄</span>
          )}
          Yenile
        </button>
      </div>

      {/* Main Lists */}
      {activeTab === 'jobs' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">İş ID</th>
                  <th className="px-6 py-3">Durum</th>
                  <th className="px-6 py-3">Ham Metin</th>
                  <th className="px-6 py-3">Gemini Çıktısı (JSON)</th>
                  <th className="px-6 py-3">Hata Mesajı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-600">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Hiç analiz işi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                        {job.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(job.status)}`}>
                          {job.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {job.raw_text ? (
                          <button
                            onClick={() =>
                              setInspectContent({
                                title: `Ham Metin (İş ID: ${job.id})`,
                                type: 'text',
                                data: job.raw_text,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            İncele ({Math.round(job.raw_text.length / 1024)} KB)
                          </button>
                        ) : (
                          <span className="text-gray-400">Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {job.extracted_data ? (
                          <button
                            onClick={() =>
                              setInspectContent({
                                title: `Gemini Extracted Data JSON (İş ID: ${job.id})`,
                                type: 'json',
                                data: job.extracted_data,
                              })
                            }
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                          >
                            JSON Göster ({job.extracted_data.rows?.length || 0} satır)
                          </button>
                        ) : (
                          <span className="text-gray-400">Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-rose-600 font-mono text-xs">
                        {job.error_message || <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Analiz ID</th>
                  <th className="px-6 py-3">Toplam Ciro</th>
                  <th className="px-6 py-3">Departman Dağılımları</th>
                  <th className="px-6 py-3">İncele</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-600">
                {analyses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Hiç tamamlanmış analiz kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  analyses.map((analysis) => {
                    const dbData = analysis.dashboard_data || {};
                    const totalSales = dbData.totalSales || 0;
                    const depts = dbData.departments || [];

                    return (
                      <tr key={analysis.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatDate(analysis.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                          {analysis.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                          {totalSales.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {depts.map((d: any) => (
                              <span
                                key={d.name}
                                className="px-2 py-0.5 bg-gray-100 border rounded text-xs text-gray-600 font-semibold"
                              >
                                {d.name}: {d.TotalSalesAmount?.toLocaleString('tr-TR')} ₺ ({d.lifestyles?.length || 0} L, {d.classes?.length || 0} C, {d.buyers?.length || 0} B)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setInspectContent({
                                title: `İşlenmiş Dashboard Data JSON (Analiz ID: ${analysis.id})`,
                                type: 'json',
                                data: dbData,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            Dashboard JSON Göster
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspector Panel Modal */}
      {inspectContent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">{inspectContent.title}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    copyToClipboard(
                      inspectContent.type === 'json'
                        ? JSON.stringify(inspectContent.data, null, 2)
                        : inspectContent.data
                    )
                  }
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Panoya Kopyala
                </button>
                <button
                  onClick={() => setInspectContent(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-gray-900 text-green-400 font-mono text-xs leading-relaxed">
              {inspectContent.type === 'json' ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(inspectContent.data, null, 2)}</pre>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm leading-relaxed">
                  {inspectContent.data}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

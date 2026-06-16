'use client';

import { useState, useRef, useEffect } from 'react';
import { ProcessedStoreDashboard, DepartmentNode } from '@/lib/services/store-analysis-engine';
import LifestyleAccordion from './LifestyleAccordion';
import { createClient } from '@/lib/supabase/client';

type TabType = 'lifestyles' | 'classes' | 'buyers';

interface AnalysisRecord {
  id?: string;
  dashboard_data: ProcessedStoreDashboard;
  created_at: string;
}

interface StoreAnalysisClientProps {
  historyAnalyses: AnalysisRecord[];
  isOwner: boolean;
}

export default function StoreAnalysisClient({ historyAnalyses, isOwner }: StoreAnalysisClientProps) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(historyAnalyses);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const currentAnalysis = analyses[selectedIndex];
  const data = currentAnalysis?.dashboard_data || null;
  const lastUpdate = currentAnalysis?.created_at || null;
  
  const [isUploading, setIsUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string | null>(data?.departments[0]?.name || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasAIAnalysis = data && data.departments && data.departments.some((dept: any) => 
    (dept.lifestyles || []).some((ls: any) => ls.deepInsight) || 
    (dept.classes || []).some((cls: any) => cls.deepInsight) ||
    (dept.buyers || []).some((buyer: any) => buyer.deepInsight)
  );

  const handleRunAIAnalysis = async () => {
    if (!currentAnalysis || !currentAnalysis.id || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/store-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: currentAnalysis.id }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Analiz başarısız oldu');
      
      alert('Yapay zeka analizi başarıyla tamamlandı!');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Analiz sırasında hata: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsAnalyzing(false);
    }
  };
  const [activeTab, setActiveTab] = useState<TabType>('lifestyles');
  const [openLifestyleIdx, setOpenLifestyleIdx] = useState<number | null>(null);
  const [openClassIdx, setOpenClassIdx] = useState<number | null>(null);
  const [openBuyerIdx, setOpenBuyerIdx] = useState<number | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);

  // Reset opened accordion and scroll to details when changing department
  const handleDeptChange = (deptName: string) => {
    setSelectedDept(deptName);
    setActiveTab('lifestyles');
    setOpenLifestyleIdx(null);
    setOpenClassIdx(null);
    setOpenBuyerIdx(null);
    
    // Auto-scroll to details section on mobile
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgressMsg('Arka plan işi başlatılıyor...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const startRes = await fetch('/api/store-analysis/start-job', {
        method: 'POST',
        body: formData,
      });
      if (!startRes.ok) throw new Error('Arka plan işi başlatılamadı');
      const startData = await startRes.json();
      if (!startData.success) throw new Error(startData.error);
      
      const jobId = startData.jobId;
      const supabase = createClient();

      setProgressMsg('Bekleniyor: Kuyruğa alındı...');

      // Subscribe to changes on this specific job
      const channel = supabase.channel(`job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ai_analysis_jobs',
            filter: `id=eq.${jobId}`
          },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'extracting') setProgressMsg('Adım 1/3: Yapay Zeka tabloyu okuyor (Bu 2-3 dakika sürebilir)...');
            else if (newStatus === 'analyzing') setProgressMsg('Adım 2/3: Deep Insight analizleri yapılıyor...');
            else if (newStatus === 'completed') {
              setProgressMsg('Adım 3/3: Tamamlandı! Ekran yenileniyor...');
              supabase.removeChannel(channel);
              setTimeout(() => window.location.reload(), 1500);
            }
            else if (newStatus === 'error') {
              alert('İşlem sırasında hata: ' + payload.new.error_message);
              setIsUploading(false);
              setProgressMsg('');
              supabase.removeChannel(channel);
            }
          }
        )
        .subscribe();

      // Trigger the Edge Function to start processing
      supabase.functions.invoke('parse-store-pdf', {
        body: { jobId }
      }).catch(err => console.error('Edge function trigger error:', err));

    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Dosya yüklenirken bir hata oluştu: ' + error.message);
      setIsUploading(false);
      setProgressMsg('');
      if (e.target) e.target.value = '';
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">Henüz Analiz Bulunmuyor</h3>
        <p className="text-gray-500 mt-2 text-center max-w-md">
          {isOwner 
            ? "Mağazanızın güncel verilerini (Excel, JSON veya PDF) yükleyerek yapay zeka destekli ticari analizi başlatabilirsiniz."
            : "Mağaza sahibi tarafından henüz bir veri yüklenmemiş."}
        </p>
        
        {isOwner && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isUploading ? (progressMsg || 'Analiz Ediliyor...') : 'Yeni Veri Yükle ve Analiz Et'}
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".json,.xlsx,.xls,.pdf" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <a 
              href="/store-analysis/database"
              className="inline-flex justify-center items-center px-6 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium rounded-xl transition-colors shadow-sm"
            >
              🗄️ Veritabanı Kayıtları
            </a>
            <a 
              href="/store-analysis/debug"
              className="inline-flex justify-center items-center px-6 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              🛠️ Diagnostik Paneli
            </a>
          </div>
        )}
      </div>
    );
  }

  const currentDept = data.departments.find(d => d.name === selectedDept);

  return (
    <div className="space-y-6">
      {/* Top Header & Upload Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Analiz Geçmişi:</span>
            <select 
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="border border-gray-200 rounded-lg p-2 text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {analyses.map((a, idx) => (
                <option key={idx} value={idx}>
                  {new Date(a.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>

          {data && !hasAIAnalysis && (
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Yapay Zeka Analiz Ediyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  🤖 Yapay Zeka Teşhisi Yap
                </>
              )}
            </button>
          )}

          {data && hasAIAnalysis && (
            <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Yapay Zeka Analizi Tamamlandı
            </span>
          )}
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isUploading ? (progressMsg || 'Analiz Ediliyor...') : 'Yeni Yükle'}
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".json,.xlsx,.xls,.pdf" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <a 
              href="/store-analysis/database"
              className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium shadow-sm"
            >
              🗄️ Veritabanı Kayıtları
            </a>
            <a 
              href="/store-analysis/debug"
              className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium shadow-sm"
            >
              🛠️ Diagnostik
            </a>
          </div>
        )}
      </div>

      {/* Store Global Metrics */}
      {data.storeMetrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Mağaza Genel Performansı
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Ciro</p>
              <p className="text-xl font-black text-gray-900">{data.storeMetrics.SalesAmount.toLocaleString('tr-TR')} ₺</p>
              <p className={`text-xs font-bold mt-1 ${data.storeMetrics.SalesAmountLYPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.storeMetrics.SalesAmountLYPct > 0 ? '▲ +' : '▼ '}%{data.storeMetrics.SalesAmountLYPct.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Adet</p>
              <p className="text-xl font-black text-gray-900">{data.storeMetrics.SalesQuantity.toLocaleString('tr-TR')}</p>
              <p className={`text-xs font-bold mt-1 ${data.storeMetrics.SalesQuantityLYPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.storeMetrics.SalesQuantityLYPct > 0 ? '▲ +' : '▼ '}%{data.storeMetrics.SalesQuantityLYPct.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Cover</p>
              <p className="text-xl font-black text-gray-900">{data.storeMetrics.Cover.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Dönüşüm (Conv)</p>
              <p className="text-xl font-black text-gray-900">%{(data.storeMetrics.ConversionPct || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Sepet (IPT / ATV)</p>
              <p className="text-xl font-black text-gray-900">{data.storeMetrics.IPT.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">{data.storeMetrics.ATV.toLocaleString('tr-TR')} ₺ | Footfall: {data.storeMetrics.Footfall || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Merch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.departments.map(dept => (
          <div 
            key={dept.name}
            onClick={() => handleDeptChange(dept.name)}
            className={`
              p-6 rounded-xl cursor-pointer transition-all duration-200 border-2
              ${selectedDept === dept.name 
                ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' 
                : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}
            `}
          >
            <h3 className={`text-xl font-bold ${selectedDept === dept.name ? 'text-blue-900' : 'text-gray-900'}`}>
              {dept.name}
            </h3>
            <div className="mt-4 flex flex-wrap gap-4 items-end">
              <div>
                <p className="text-xs text-gray-500 mb-1">Ciro Payı</p>
                <p className={`text-2xl font-black ${selectedDept === dept.name ? 'text-blue-600' : 'text-gray-900'}`}>
                  %{dept.StoreSalesPct.toFixed(1)}
                </p>
              </div>
              
              {dept.SalesAmountLFLPct !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Büyüme (LFL)</p>
                  <p className={`text-sm font-bold ${dept.SalesAmountLFLPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dept.SalesAmountLFLPct > 0 ? '+' : ''}%{dept.SalesAmountLFLPct.toFixed(1)}
                  </p>
                </div>
              )}
              
              {dept.Cover !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cover</p>
                  <p className="text-sm font-bold text-gray-700">
                    {dept.Cover.toFixed(1)}
                  </p>
                </div>
              )}

              {dept.NetFinalOccupancyPct !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Doluluk</p>
                  <p className="text-sm font-bold text-gray-700">
                    %{dept.NetFinalOccupancyPct.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Data Section */}
      {currentDept && (
        <div ref={detailsRef} className="pt-4">
          
          {/* Mobile-friendly Tabs */}
          <div className="flex w-full gap-1 md:gap-2 pb-4 mb-2">
            <button
              onClick={() => setActiveTab('lifestyles')}
              className={`flex-1 flex items-center justify-center whitespace-nowrap px-2 md:px-6 py-2 md:py-3 rounded-lg md:rounded-full text-[11px] md:text-sm font-medium transition-colors ${
                activeTab === 'lifestyles' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Lifestyles <span className="ml-1 opacity-75">({currentDept.lifestyles?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('buyers')}
              className={`flex-1 flex items-center justify-center whitespace-nowrap px-2 md:px-6 py-2 md:py-3 rounded-lg md:rounded-full text-[11px] md:text-sm font-medium transition-colors ${
                activeTab === 'buyers' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Buyers <span className="ml-1 opacity-75">({currentDept.buyers?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex-1 flex items-center justify-center whitespace-nowrap px-2 md:px-6 py-2 md:py-3 rounded-lg md:rounded-full text-[11px] md:text-sm font-medium transition-colors ${
                activeTab === 'classes' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Classes <span className="ml-1 opacity-75">({currentDept.classes?.length || 0})</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {currentDept.name}{' '}
                {activeTab === 'lifestyles' ? 'Lifestyles' : activeTab === 'buyers' ? 'Buyers' : 'Classes'}
              </h2>
              <div className="hidden sm:flex gap-4 text-xs font-medium text-gray-500">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Pazar Payı Yüksek</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Pazar Payı Düşük</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-2 md:p-4 bg-gray-50/50">
              {/* Render Lifestyles */}
              {activeTab === 'lifestyles' && (
                (currentDept.lifestyles || []).length > 0 ? (
                  (currentDept.lifestyles || []).map((lifestyle, idx) => (
                    <LifestyleAccordion 
                      key={idx} 
                      node={lifestyle} 
                      isClass={false} 
                      isOpen={openLifestyleIdx === idx}
                      onToggle={() => setOpenLifestyleIdx(openLifestyleIdx === idx ? null : idx)}
                      storeAverageCover={data.storeAverageCover || 0}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">Bu departmana ait lifestyle bulunamadı.</div>
                )
              )}

              {/* Render Buyers */}
              {activeTab === 'buyers' && (
                (currentDept.buyers || []).length > 0 ? (
                  (currentDept.buyers || []).map((buyer, idx) => (
                    <LifestyleAccordion 
                      key={idx} 
                      node={buyer} 
                      isClass={true} 
                      isOpen={openBuyerIdx === idx}
                      onToggle={() => setOpenBuyerIdx(openBuyerIdx === idx ? null : idx)}
                      storeAverageCover={data.storeAverageCover || 0}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">Bu departmana ait buyer bulunamadı.</div>
                )
              )}

              {/* Render Classes */}
              {activeTab === 'classes' && (
                (currentDept.classes || []).length > 0 ? (
                  (currentDept.classes || []).map((cls, idx) => (
                    <LifestyleAccordion 
                      key={idx} 
                      node={cls} 
                      isClass={true} 
                      isOpen={openClassIdx === idx}
                      onToggle={() => setOpenClassIdx(openClassIdx === idx ? null : idx)}
                      storeAverageCover={data.storeAverageCover || 0}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">Bu departmana ait class bulunamadı.</div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

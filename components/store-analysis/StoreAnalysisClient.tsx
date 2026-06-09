'use client';

import { useState, useRef } from 'react';
import { ProcessedStoreDashboard, DepartmentNode } from '@/lib/services/store-analysis-engine';
import LifestyleAccordion from './LifestyleAccordion';

type TabType = 'lifestyles' | 'classes' | 'buyers';

interface StoreAnalysisClientProps {
  initialData: ProcessedStoreDashboard | null;
  isOwner: boolean;
  lastUpdate?: string;
}

export default function StoreAnalysisClient({ initialData, isOwner, lastUpdate }: StoreAnalysisClientProps) {
  const [data, setData] = useState<ProcessedStoreDashboard | null>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(data?.departments[0]?.name || null);
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/store-analysis/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data.dashboard_data);
        if (!selectedDept && result.data.dashboard_data.departments.length > 0) {
          setSelectedDept(result.data.dashboard_data.departments[0].name);
        }
        alert('🎉 Rapor başarıyla yapay zeka tarafından analiz edildi ve veriler güncellendi!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Dosya yüklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
      // Reset input
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
          <div className="mt-6">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yükleniyor ve Analiz Ediliyor...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Yeni Rapor Yükle
                </span>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept=".json,.xlsx,.xls,.pdf" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>
    );
  }

  const currentDept = data.departments.find(d => d.name === selectedDept);

  return (
    <div className="space-y-6">
      {/* Top Header & Upload Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Son Güncelleme: {lastUpdate ? new Date(lastUpdate).toLocaleString('tr-TR') : 'Bilinmiyor'}
        </div>
        
        {isOwner && (
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Veri Güncelle
              </span>
            )}
            <input 
              type="file" 
              className="hidden" 
              accept=".json,.xlsx,.xls,.pdf" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
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

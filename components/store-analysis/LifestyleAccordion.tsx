'use client';

import { useState } from 'react';
import { LifestyleNode, ClassNode, getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';
import AssignStoreTaskModal from './AssignStoreTaskModal';

interface LifestyleAccordionProps {
  node: LifestyleNode | ClassNode;
  isClass?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  storeAverageCover?: number;
  hasAIAnalysis?: boolean;
}

export default function LifestyleAccordion({ 
  node, 
  isClass = false, 
  isOpen: controlledIsOpen, 
  onToggle, 
  storeAverageCover = 0,
  hasAIAnalysis = false
}: LifestyleAccordionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const delta = getPreProcessedDeltas(node, isClass ? 'Class' : 'Lifestyle', storeAverageCover);

  // Type guard and safe property access
  const isLifestyle = !isClass;
  
  // Status colors
  const statusColor = node.insight.status === 'green' ? 'text-green-600 bg-green-50' : 
                      node.insight.status === 'red' ? 'text-red-600 bg-red-50' : 
                      'text-gray-600 bg-gray-50';
                      
  const badgeColor = node.insight.status === 'green' ? 'bg-green-100 text-green-800' : 
                     node.insight.status === 'red' ? 'bg-red-100 text-red-800' : 
                     'bg-gray-100 text-gray-800';

  const nodeName = node.name || (isClass ? 'Bilinmeyen Sınıf' : 'Belirtilmemiş Yaşam Tarzı');
  
  const mainFinding = node.deepInsight?.main_finding || node.insight.diagnosis;
  const validationTask = node.deepInsight?.validation_task || node.insight.action;
  const defaultTaskDescription = `${nodeName} (${node.insight.warning}): ${mainFinding} -> Saha Görevi: ${validationTask}`;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${isOpen && !isClass ? 'ring-2 ring-blue-500/50' : ''}`}>
      {/* Header */}
      <div 
        onClick={handleToggle}
        className={`px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-blue-50/50 transition-colors
          ${isClass ? 'pl-8 md:pl-10' : ''}
        `}
      >
        {/* Top row on mobile: Name + Badge + Chevron */}
        <div className="flex items-center justify-between w-full md:w-auto mb-2 md:mb-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`shrink-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${node.insight.status === 'green' ? 'bg-green-500' : node.insight.status === 'red' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            <span className={`font-semibold truncate max-w-[150px] md:max-w-none ${isClass ? 'text-gray-700 text-sm' : 'text-gray-900'}`}>
              {nodeName}
            </span>
            {!isOpen && (
              <span className={`px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full ${badgeColor} ml-1 md:ml-2 hidden sm:inline-block truncate max-w-[100px] md:max-w-none`}>
                {node.insight.warning}
              </span>
            )}
          </div>
          
          {/* Mobile Chevron */}
          <svg 
            className={`md:hidden w-5 h-5 text-gray-400 transform transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {/* Metrics Row */}
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="flex justify-between md:justify-end w-full gap-2 md:gap-4 text-left md:text-right">
            <div>
              <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 mb-0.5 md:mb-1">Ciro</p>
              <p className="text-sm md:text-base font-bold text-gray-900">%{(node.StoreSalesPct || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 mb-0.5 md:mb-1">Büyüme</p>
              <p className={`text-sm md:text-base font-bold ${(node.SalesAmountLFLPct || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(node.SalesAmountLFLPct || 0) > 0 ? '+' : ''}%{(node.SalesAmountLFLPct || 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 mb-0.5 md:mb-1">Cover</p>
              <p className="text-sm md:text-base font-bold text-gray-900">{(node.Cover || 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 mb-0.5 md:mb-1">Doluluk</p>
              <p className="text-sm md:text-base font-bold text-gray-900">%{(node.NetFinalOccupancyPct || 0).toFixed(1)}</p>
            </div>
          </div>
          
          {/* Desktop Chevron */}
          <svg 
            className={`hidden md:block w-5 h-5 text-gray-400 transform transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className={`px-6 pb-6 pt-2 flex flex-col gap-4 ${isClass ? 'pl-10' : ''}`}>
          {/* Matematiksel Deltalar Grid */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60">
            <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Matematiksel Göstergeler (Hesaplanan Deltalar)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alan Verimliliği (Space Score)</span>
                <p className="text-base font-extrabold text-gray-900 mt-1">
                  {Number(delta.context.space_opportunity.score) > 0 ? '+' : ''}{delta.context.space_opportunity.score}
                </p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${
                  delta.context.space_opportunity.label.includes('KAHRAMAN') ? 'bg-green-50 text-green-700 border border-green-200' :
                  delta.context.space_opportunity.label.includes('ASALAĞI') || delta.context.space_opportunity.label.includes('VERİMSİZ') ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {delta.context.space_opportunity.label}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bölgesel Pazar Payı Farkı</span>
                <p className={`text-base font-extrabold mt-1 ${Number(delta.context.market_power_gap) > 0 ? 'text-green-600' : Number(delta.context.market_power_gap) < 0 ? 'text-gray-900' : 'text-gray-900'}`}>
                  {Number(delta.context.market_power_gap) > 0 ? '+' : ''}{delta.context.market_power_gap}%
                </p>
                <span className="text-[9px] text-gray-400 mt-2 block">Bölge ortalaması ile farkı</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stok Devir Sapması (Velocity)</span>
                <p className="text-base font-extrabold text-gray-900 mt-1">{delta.context.velocity_deviation}x</p>
                <span className="text-[9px] text-gray-400 mt-2 block">Mağaza geneline göre devir oranı</span>
              </div>
            </div>
          </div>

          {/* AI Teşhis ve Aksiyon Kutusu */}
          {node.deepInsight ? (
            <div className={`p-5 rounded-xl border ${statusColor.replace('text', 'border').replace('bg', 'bg').replace('-600', '-200')} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
              <div className="w-full">
                <h4 className="font-bold flex items-center gap-2 mb-4">
                  {node.insight.status === 'red' ? '⚠️' : node.insight.status === 'green' ? '🌟' : 'ℹ️'}
                  {node.insight.warning}
                </h4>
                <div className="flex flex-col gap-4 w-full">
                  <div className="bg-white/60 p-4 rounded-lg border border-gray-100">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">📊 Ana Tespit</span>
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">{node.deepInsight.main_finding}</p>
                  </div>
                  
                  {node.deepInsight.scenarios && node.deepInsight.scenarios.length > 0 && (
                    <div className="bg-white/60 p-4 rounded-lg border border-gray-100">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 block">🔍 Muhtemel Senaryolar</span>
                      <div className="flex flex-col gap-3">
                        {node.deepInsight.scenarios.map((scenario: any, idx: number) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="shrink-0 w-12 h-12 flex flex-col items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                              <span className="text-sm font-bold text-blue-700">%{scenario.probability}</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-sm text-gray-900">{scenario.title}</h5>
                              <p className="text-xs text-gray-600 mt-0.5">{scenario.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-700 mb-2 block">🎯 Saha Doğrulama Görevi</span>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{node.deepInsight.validation_task}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="shrink-0 flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap mt-4 md:mt-0"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Görev Ata
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖</span> Yapay Zeka Teşhisi Bekleniyor
              </h5>
              <p className="text-xs text-gray-400 mt-1">Bu kategori için otomatik yapay zeka teşhisleri üretilmedi. Sayfanın en üstünde yer alan <b>"Yapay Zeka Teşhisi Yap"</b> butonuna basarak analizi başlatabilirsiniz.</p>
            </div>
          )}
        </div>
      )}

      {/* Task Assignment Modal */}
      {isTaskModalOpen && (
        <AssignStoreTaskModal 
          initialDescription={defaultTaskDescription}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { LifestyleNode, ClassNode } from '@/lib/services/store-analysis-engine';
import AssignStoreTaskModal from './AssignStoreTaskModal';

interface LifestyleAccordionProps {
  node: LifestyleNode | ClassNode;
  isClass?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function LifestyleAccordion({ node, isClass = false, isOpen: controlledIsOpen, onToggle }: LifestyleAccordionProps) {
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
  
  const diagnosisText = node.deepInsight?.diagnosis || node.insight.diagnosis;
  const actionText = node.deepInsight?.action || node.insight.action;
  const defaultTaskDescription = `${nodeName} (${node.insight.warning}): ${diagnosisText} ${actionText}`;

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
        <div className={`px-6 pb-6 pt-2 ${isClass ? 'pl-10' : ''}`}>
          {/* AI Insight Box */}
          <div className={`p-5 rounded-xl border ${statusColor.replace('text', 'border').replace('bg', 'bg').replace('-600', '-200')} mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                {node.insight.status === 'red' ? '⚠️' : node.insight.status === 'green' ? '🌟' : 'ℹ️'}
                {node.insight.warning}
              </h4>
              {node.deepInsight ? (
                <>
                  <div className="mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-1 block">🔍 Teşhis</span>
                    <p className="text-sm text-gray-800 leading-relaxed">{node.deepInsight.diagnosis}</p>
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-1 block">🎯 Aksiyon Önerisi</span>
                    <p className="text-sm text-gray-800 leading-relaxed">{node.deepInsight.action}</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mt-2"><strong>Teşhis:</strong> {node.insight.diagnosis}</p>
                  <p className="text-sm mt-1"><strong>Aksiyon:</strong> {node.insight.action}</p>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="shrink-0 flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Görev Ata
            </button>
          </div>

          {/* Render children classes if it's a lifestyle (REMOVED: classes are now decoupled) */}
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

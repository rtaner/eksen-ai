'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIAnalysisWithPersonnel, AnalysisType } from '@/lib/types/analyses';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AnalysisCard from './AnalysisCard';
import AnalysisFilters from './AnalysisFilters';
import NewAnalysisModal from './NewAnalysisModal';

interface AnalysesPageClientProps {
  analyses: any[];
  personnel: { id: string; name: string }[];
  isOwner: boolean;
  userId: string;
}

export default function AnalysesPageClient({
  analyses: initialAnalyses,
  personnel,
  isOwner,
  userId,
}: AnalysesPageClientProps) {
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    personnelId: '',
    analysisType: '' as AnalysisType | '',
  });

  // Filter by personnel only (for stats calculation)
  const personnelFilteredAnalyses = analyses.filter((analysis) => {
    if (filters.personnelId && analysis.personnel?.id !== filters.personnelId) {
      return false;
    }
    return true;
  });

  // Calculate stats based on personnel filter only (not analysis type filter)
  const stats = {
    total: personnelFilteredAnalyses.length,
    yetkinlik: personnelFilteredAnalyses.filter((a) => a.analysis_type === 'yetkinlik').length,
    egilim: personnelFilteredAnalyses.filter((a) => a.analysis_type === 'egilim').length,
    butunlesik: personnelFilteredAnalyses.filter((a) => a.analysis_type === 'butunlesik').length,
  };

  // Filter analyses by both personnel and analysis type (for display)
  const filteredAnalyses = personnelFilteredAnalyses.filter((analysis) => {
    if (filters.analysisType && analysis.analysis_type !== filters.analysisType) {
      return false;
    }
    return true;
  });

  const handleAnalysisCreated = (newAnalysis: any) => {
    setAnalyses([newAnalysis, ...analyses]);
    setIsNewAnalysisModalOpen(false);
  };

  const handleAnalysisDeleted = (analysisId: string) => {
    setAnalyses(analyses.filter((a) => a.id !== analysisId));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/settings"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Ayarlara Dön
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analizleri</h1>
          <p className="text-gray-600">
            Personel performans analizlerini görüntüleyin ve yönetin
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => setIsNewAnalysisModalOpen(true)}
            className="whitespace-nowrap"
          >
            🆕 Yeni Analiz
          </Button>
        )}
      </div>

      {/* Filters */}
      <AnalysisFilters
        filters={filters}
        onFiltersChange={setFilters}
        personnel={personnel}
        stats={stats}
      />

      {/* Analyses List */}
      {filteredAnalyses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="mt-4 text-gray-500">
              {filters.personnelId || filters.analysisType
                ? 'Filtreye uygun analiz bulunamadı'
                : 'Henüz analiz oluşturulmamış'}
            </p>
            {isOwner && !filters.personnelId && !filters.analysisType && (
              <Button
                onClick={() => setIsNewAnalysisModalOpen(true)}
                className="mt-4"
              >
                İlk Analizi Oluştur
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              isOwner={isOwner}
              onDelete={handleAnalysisDeleted}
            />
          ))}
        </div>
      )}

      {/* New Analysis Modal */}
      {isOwner && (
        <NewAnalysisModal
          isOpen={isNewAnalysisModalOpen}
          onClose={() => setIsNewAnalysisModalOpen(false)}
          personnel={personnel}
          onSuccess={handleAnalysisCreated}
        />
      )}
    </div>
  );
}

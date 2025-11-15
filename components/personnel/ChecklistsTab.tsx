'use client';

import { useChecklistResults } from '@/lib/hooks/useChecklistResults';
import ChecklistResultCard from './ChecklistResultCard';

interface ChecklistsTabProps {
  personnelId: string;
}

export default function ChecklistsTab({ personnelId }: ChecklistsTabProps) {
  const { results, isLoading, hasMore, loadMore } = useChecklistResults(personnelId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Checklist Sonuçları
        </h2>
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
          Canlı
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      ) : results.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Henüz checklist sonucu yok
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Bu personele henüz checklist atanmamış
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {results.map((result) => (
              <ChecklistResultCard key={result.id} result={result} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

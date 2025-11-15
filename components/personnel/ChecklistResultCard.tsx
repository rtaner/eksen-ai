'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import type { ChecklistResultWithDetails } from '@/lib/types';

import { getColorForScore } from '@/lib/utils/checklist';

interface ChecklistResultCardProps {
  result: ChecklistResultWithDetails;
}

export default function ChecklistResultCard({ result }: ChecklistResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = result.completed_items.length;
  const totalCount = result.total_items;
  const { text: scoreTextColor, bg: scoreBgColor } = getColorForScore(result.score);
  const scoreColor = `${scoreTextColor} ${scoreBgColor}`;

  return (
    <Card>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              {result.checklist_snapshot.title}
            </h3>
            {result.checklist_snapshot.description && (
              <p className="text-sm text-gray-600 mt-1">
                {result.checklist_snapshot.description}
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-lg font-bold text-lg ${scoreColor}`}>
            {result.score.toFixed(2)}/5.00
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {completedCount}/{totalCount} madde tamamlandı
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>{result.completed_by_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{new Date(result.completed_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {isExpanded ? 'Detayları Gizle' : 'Detayları Gör'}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t space-y-2">
            <h4 className="font-medium text-gray-900 text-sm">Maddeler:</h4>
            <div className="space-y-1">
              {result.checklist_snapshot.items
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const isCompleted = result.completed_items.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-2 text-sm p-2 rounded ${
                        isCompleted ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-500">{item.order}.</span>
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span className={isCompleted ? 'text-gray-900' : 'text-gray-500'}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

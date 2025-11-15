'use client';

import Card from '@/components/ui/Card';
import type { Checklist } from '@/lib/types';

interface ChecklistTemplateCardProps {
  checklist: Checklist;
  onStart: (checklist: Checklist) => void;
}

export default function ChecklistTemplateCard({
  checklist,
  onStart,
}: ChecklistTemplateCardProps) {
  return (
    <Card hover>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-gray-900 text-xl mb-2">
            {checklist.title}
          </h3>
          {checklist.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {checklist.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="font-medium">{checklist.items.length} madde</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onStart(checklist)}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Başla
        </button>
      </div>
    </Card>
  );
}

'use client';

import Card from '@/components/ui/Card';
import type { Checklist } from '@/lib/types';

interface ChecklistCardProps {
  checklist: Checklist;
  onEdit: (checklist: Checklist) => void;
  onDelete: (checklist: Checklist) => void;
}

export default function ChecklistCard({
  checklist,
  onEdit,
  onDelete,
}: ChecklistCardProps) {
  return (
    <Card>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              {checklist.title}
            </h3>
            {checklist.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {checklist.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{checklist.items.length} madde</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {new Date(checklist.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={() => onEdit(checklist)}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Düzenle
          </button>
          <button
            onClick={() => onDelete(checklist)}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </Card>
  );
}

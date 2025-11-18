'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Button from '@/components/ui/Button';

interface TaskItemProps {
  task: Task;
  authorName?: string;
  canEdit: boolean;
  canDelete: boolean;
  onClose?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  
  return date.toLocaleDateString('tr-TR');
}

function isOverdue(deadline: string): boolean {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

export default function TaskItem({
  task,
  authorName,
  canEdit,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const isOpen = task.status === 'open';
  const overdue = isOpen && isOverdue(task.deadline);
  const hasComment = !isOpen && task.closing_note && task.closing_note.trim().length > 0;

  // Get icon based on performance rating (aligned with note sentiment icons)
  const getTaskIcon = () => {
    if (isOpen) return '📋';
    
    const rating = task.star_rating || 0;
    if (rating >= 4) return '✅'; // Olumlu (4-5 yıldız)
    if (rating === 3) return '📝'; // Nötr (3 yıldız)
    return '⚠️'; // Olumsuz (1-2 yıldız)
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg ${
        isOpen
          ? overdue
            ? 'border-red-200 bg-red-50'
            : 'border-blue-200 bg-blue-50'
          : 'border-purple-200 bg-purple-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{getTaskIcon()}</span>
          <span
            className={`text-sm font-medium ${
              isOpen
                ? overdue
                  ? 'text-red-700'
                  : 'text-blue-700'
                : 'text-purple-700'
            }`}
          >
            Görev: {isOpen ? (overdue ? 'Gecikmiş' : 'Açık') : 'Tamamlandı'}
          </span>
          {authorName && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 font-medium">
                {capitalizeFirst(authorName)}
              </span>
            </>
          )}
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            {getRelativeTime(task.created_at)}
          </span>
        </div>

        {/* Three dots menu */}
        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Menü"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  {isOpen && canEdit && onClose && (
                    <button
                      onClick={() => {
                        onClose(task);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Görevi Kapat
                    </button>
                  )}
                  {isOpen && canEdit && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(task);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Düzenle
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(task);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Sil
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-900 font-medium mb-2 whitespace-pre-wrap">
        {capitalizeFirst(task.description)}
      </p>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <span className={overdue ? 'text-red-600 font-medium' : ''}>
            Termin: {new Date(task.deadline).toLocaleDateString('tr-TR')}
          </span>
          {!isOpen && task.star_rating && (
            <span className="text-yellow-600 font-medium">
              {'⭐'.repeat(task.star_rating)} ({task.star_rating}/5)
            </span>
          )}
          {!isOpen && task.completed_at && (
            <>
              <span className="text-gray-400">•</span>
              <span>
                Tamamlandı: {new Date(task.completed_at).toLocaleDateString('tr-TR')}
              </span>
            </>
          )}
        </div>

        {/* Complete button for open tasks */}
        {isOpen && canEdit && onClose && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onClose(task)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✓ Tamamla
          </Button>
        )}
      </div>

      {/* Show comment button for closed tasks with comments */}
      {hasComment && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <button
            onClick={() => setShowComment(!showComment)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {showComment ? '▼' : '▶'} Yorumu Gör
          </button>
          {showComment && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {task.closing_note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

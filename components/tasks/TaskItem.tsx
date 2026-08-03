'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Button from '@/components/ui/Button';

interface TaskItemProps {
  task: Task;
  authorName?: string;
  targetName?: string;
  groupName?: string;
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
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
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
  targetName,
  groupName,
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

  const getTaskIcon = () => {
    if (isOpen) return '📋';
    
    const rating = task.star_rating || 0;
    if (rating >= 4) return '✅';
    if (rating === 3) return '📝';
    return '⚠️';
  };

  return (
    <div
      className={`p-4 border-2 rounded-xl ${
        isOpen
          ? overdue
            ? 'border-red-200 bg-red-50'
            : 'border-blue-200 bg-blue-50'
          : 'border-purple-200 bg-purple-50'
      } transition-all duration-150`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
          <span className="text-base">{getTaskIcon()}</span>
          <span
            className={`font-semibold ${
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
              <span className="font-semibold text-gray-800" title="Görevi Atayan">
                ✍️ Atayan: {capitalizeFirst(authorName)}
              </span>
            </>
          )}

          {/* TARGET BADGE */}
          <span className="text-gray-400">•</span>
          {task.is_store_level ? (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg flex items-center gap-1 border border-blue-200">
              🏬 Hedef: Mağaza Genel
            </span>
          ) : groupName || task.group_id ? (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg flex items-center gap-1 border border-purple-200">
              👥 Hedef: {groupName || 'Ekip Grubu'}
            </span>
          ) : targetName || task.personnel_id ? (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg flex items-center gap-1 border border-indigo-200">
              👤 Atanan: {targetName || 'Personel'}
            </span>
          ) : null}

          <span className="text-gray-400">•</span>
          <span className="text-xs text-gray-500 font-medium">
            {getRelativeTime(task.created_at)}
          </span>
        </div>

        {/* Three dots menu */}
        {(canEdit || canDelete) && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 hover:bg-gray-200/70 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                  {isOpen && canEdit && onClose && (
                    <button
                      onClick={() => {
                        onClose(task);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-green-600 hover:bg-green-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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

      <p className="text-gray-900 text-sm font-medium mb-2.5 whitespace-pre-wrap leading-relaxed">
        {capitalizeFirst(task.description)}
      </p>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
            📅 Termin: {new Date(task.deadline).toLocaleDateString('tr-TR')}
          </span>
          {!isOpen && task.star_rating && (
            <span className="text-yellow-600 font-bold">
              {'⭐'.repeat(task.star_rating)} ({task.star_rating}/5)
            </span>
          )}
          {!isOpen && task.completed_at && (
            <>
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-500">
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
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5"
          >
            ✓ Tamamla
          </Button>
        )}
      </div>

      {/* Show comment button for closed tasks with comments */}
      {hasComment && (
        <div className="mt-3 pt-3 border-t border-purple-200/60">
          <button
            onClick={() => setShowComment(!showComment)}
            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
          >
            {showComment ? '▼' : '▶'} Kapanış Yorumunu Gör
          </button>
          {showComment && (
            <div className="mt-2 p-3 bg-white rounded-xl border border-purple-200/80 shadow-2xs">
              <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">
                {task.closing_note}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

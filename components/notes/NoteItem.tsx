'use client';

import { useState } from 'react';
import type { Note, NoteSentiment } from '@/lib/types';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Button from '@/components/ui/Button';

interface NoteItemProps {
  note: Note;
  authorName: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

const sentimentConfig = {
  positive: {
    icon: '✅',
    label: 'Olumlu',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  negative: {
    icon: '⚠️',
    label: 'Olumsuz',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  neutral: {
    icon: '📝',
    label: 'Nötr',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

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

export default function NoteItem({
  note,
  authorName,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: NoteItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const config = sentimentConfig[note.sentiment];

  return (
    <div
      className={`p-4 border-2 ${config.borderColor} ${config.bgColor} rounded-lg relative`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{config.icon}</span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-sm font-medium text-gray-900">
            {capitalizeFirst(authorName)}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            {getRelativeTime(note.created_at)}
          </span>
          {note.is_voice_note && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">🎤 Sesli not</span>
            </>
          )}
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
                  {canEdit && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(note);
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
                        onDelete(note);
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

      <p className="text-gray-900 whitespace-pre-wrap">
        {capitalizeFirst(note.content)}
      </p>
    </div>
  );
}

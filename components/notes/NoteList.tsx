'use client';

import { useState, useMemo } from 'react';
import type { Note, Task, NoteSentiment } from '@/lib/types';
import NoteItem from './NoteItem';

interface NoteListProps {
  notes: Note[];
  tasks: Task[];
  authorNames: Record<string, string>;
  currentUserId: string;
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isFilterOpen?: boolean;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (note: Note) => void;
}

type FilterType = 'all' | NoteSentiment;

export default function NoteList({
  notes,
  tasks,
  authorNames,
  currentUserId,
  isOwner,
  canEdit,
  canDelete,
  isFilterOpen = false,
  onEditNote,
  onDeleteNote,
}: NoteListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Combine and sort notes and tasks
  const items = useMemo(() => {
    const noteItems = notes.map((note) => ({
      type: 'note' as const,
      data: note,
      timestamp: new Date(note.created_at).getTime(),
    }));

    const taskItems = tasks.map((task) => ({
      type: 'task' as const,
      data: task,
      timestamp: new Date(task.created_at).getTime(),
    }));

    return [...noteItems, ...taskItems].sort((a, b) => b.timestamp - a.timestamp);
  }, [notes, tasks]);

  // Filter notes
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(
      (item) => item.type === 'note' && item.data.sentiment === filter
    );
  }, [items, filter]);

  const filterButtons: Array<{ value: FilterType; label: string; icon: string }> = [
    { value: 'all', label: 'Tümü', icon: '📋' },
    { value: 'positive', label: 'Olumlu', icon: '✅' },
    { value: 'negative', label: 'Olumsuz', icon: '⚠️' },
    { value: 'neutral', label: 'Nötr', icon: '📝' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter buttons - collapsible */}
      {isFilterOpen && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                filter === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="text-sm text-gray-600">
        {filteredItems.length} kayıt
        {filter !== 'all' && ` (${items.length} toplam)`}
      </div>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {filter === 'all'
              ? 'Henüz not veya görev bulunmuyor.'
              : 'Bu filtreye uygun kayıt bulunamadı.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            if (item.type === 'note') {
              const note = item.data as Note;
              const authorName = authorNames[note.author_id] || 'Bilinmeyen';
              const isOwnNote = note.author_id === currentUserId;

              return (
                <NoteItem
                  key={note.id}
                  note={note}
                  authorName={authorName}
                  canEdit={isOwner || (canEdit && isOwnNote)}
                  canDelete={isOwner || (canDelete && isOwnNote)}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                />
              );
            } else {
              const task = item.data as Task;
              const isOpen = task.status === 'open';

              return (
                <div
                  key={task.id}
                  className={`p-4 border-2 rounded-lg ${
                    isOpen
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{isOpen ? '📋' : '✅'}</span>
                      <span
                        className={`text-sm font-medium ${
                          isOpen ? 'text-blue-700' : 'text-green-700'
                        }`}
                      >
                        Görev: {isOpen ? 'Açık' : 'Tamamlandı'}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-900 font-medium mb-2">{task.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Termin: {new Date(task.deadline).toLocaleDateString('tr-TR')}</span>
                    {!isOpen && task.star_rating && (
                      <span className="text-yellow-600">
                        {'⭐'.repeat(task.star_rating)} ({task.star_rating}/5)
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

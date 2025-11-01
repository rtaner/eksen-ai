'use client';

import { useState, useMemo } from 'react';
import type { Note, Task, NoteSentiment } from '@/lib/types';
import NoteItem from '@/components/notes/NoteItem';
import TaskItem from './TaskItem';

interface ActivityFeedProps {
  notes: Note[];
  tasks: Task[];
  authorNames: Record<string, string>;
  currentUserId: string;
  isOwner: boolean;
  canEditNotes: boolean;
  canDeleteNotes: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  isFilterOpen?: boolean;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (note: Note) => void;
  onCloseTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

type FilterType = 'all' | NoteSentiment;

export default function ActivityFeed({
  notes,
  tasks,
  authorNames,
  currentUserId,
  isOwner,
  canEditNotes,
  canDeleteNotes,
  canEditTasks,
  canDeleteTasks,
  isFilterOpen = false,
  onEditNote,
  onDeleteNote,
  onCloseTask,
  onEditTask,
  onDeleteTask,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Combine and sort notes and tasks chronologically
  const items = useMemo(() => {
    const noteItems = notes.map((note) => ({
      type: 'note' as const,
      data: note,
      timestamp: new Date(note.created_at).getTime(),
    }));

    const taskItems = tasks.map((task) => ({
      type: 'task' as const,
      data: task,
      // Use completed_at for closed tasks, created_at for open tasks
      timestamp: task.status === 'closed' && task.completed_at
        ? new Date(task.completed_at).getTime()
        : new Date(task.created_at).getTime(),
    }));

    return [...noteItems, ...taskItems].sort((a, b) => b.timestamp - a.timestamp);
  }, [notes, tasks]);

  // Filter items
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
                  canEdit={isOwner || (canEditNotes && isOwnNote)}
                  canDelete={isOwner || (canDeleteNotes && isOwnNote)}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                />
              );
            } else {
              const task = item.data as Task;
              const taskAuthorName = task.author_id ? authorNames[task.author_id] : undefined;

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  authorName={taskAuthorName}
                  canEdit={canEditTasks}
                  canDelete={canDeleteTasks}
                  onClose={onCloseTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useScheduledTasks } from '@/lib/hooks/useScheduledTasks';
import type { ScheduledTask } from '@/lib/types/scheduled-tasks';
import {
  getRecurrenceDescription,
  getAssignmentDescription,
  formatTime,
} from '@/lib/types/scheduled-tasks';

interface ScheduledTaskCardProps {
  task: ScheduledTask;
  onEdit: (task: ScheduledTask) => void;
}

export default function ScheduledTaskCard({ task, onEdit }: ScheduledTaskCardProps) {
  const { toggleActive, deleteTask } = useScheduledTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  // Optimistic update için local state
  const [localIsActive, setLocalIsActive] = useState(task.is_active);

  const handleToggle = async () => {
    if (isToggling) return;
    
    // Optimistic update - UI'ı hemen güncelle
    setLocalIsActive(!localIsActive);
    setIsToggling(true);
    
    const success = await toggleActive(task.id);
    
    // Eğer başarısız olursa geri al
    if (!success) {
      setLocalIsActive(localIsActive);
    }
    
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!confirm('Bu zamanlanmış görevi silmek istediğinizden emin misiniz?')) {
      return;
    }
    setIsDeleting(true);
    const success = await deleteTask(task.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg border p-4 transition-all
        ${localIsActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50 opacity-75'}
        hover:shadow-md
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`
              text-lg font-semibold truncate
              ${localIsActive ? 'text-gray-900' : 'text-gray-500'}
            `}
          >
            {task.name}
          </h3>
          <p
            className={`
              text-sm mt-1 line-clamp-2
              ${localIsActive ? 'text-gray-600' : 'text-gray-400'}
            `}
          >
            {task.description}
          </p>
        </div>

        {/* Active/Inactive Toggle - Minimal */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          type="button"
          className={`
            ml-3 flex-shrink-0 relative inline-flex items-center rounded-full
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${localIsActive ? 'bg-blue-600' : 'bg-gray-300'}
            ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
            w-11 h-6
          `}
          aria-label={localIsActive ? 'Durakla' : 'Etkinleştir'}
          title={localIsActive ? 'Durakla' : 'Etkinleştir'}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow
              ${localIsActive ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Recurrence */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">📅</span>
          <span>{getRecurrenceDescription(task)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">🕐</span>
          <span>{formatTime(task.scheduled_time)}</span>
        </div>

        {/* Assignment */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">👥</span>
          <span>{getAssignmentDescription(task)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors
            ${
              localIsActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }
          `}
        >
          {localIsActive ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="
            flex-1 flex items-center justify-center gap-2 px-4 py-2
            bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100
            transition-colors font-medium text-sm
            min-h-[44px]
          "
        >
          <span>✏️</span>
          <span>Düzenle</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="
            flex-1 flex items-center justify-center gap-2 px-4 py-2
            bg-red-50 text-red-700 rounded-lg hover:bg-red-100
            transition-colors font-medium text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[44px]
          "
        >
          <span>🗑️</span>
          <span>{isDeleting ? 'Siliniyor...' : 'Sil'}</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useScheduledTasks } from '@/lib/hooks/useScheduledTasks';
import ScheduledTasksList from '@/components/scheduled-tasks/ScheduledTasksList';
import ScheduledTaskModal from '@/components/scheduled-tasks/ScheduledTaskModal';
import BulkActionsBar from '@/components/scheduled-tasks/BulkActionsBar';
import Button from '@/components/ui/Button';

export default function ScheduledTasksPage() {
  const { canCreate, isOwner, isLoading: permissionsLoading } = usePermissions();
  const { tasks, loading, fetchTasks, createTask, updateTask } = useScheduledTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Only Owner can access this page
  if (!permissionsLoading && !isOwner) {
    if (typeof window !== 'undefined') {
      window.location.href = '/personnel';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/settings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ayarlara Dön
          </a>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Zamanlanmış Görevler
            </h1>
            {isOwner && (
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="min-h-[44px] min-w-[44px]"
              >
                <span className="hidden sm:inline">Yeni Görev</span>
                <span className="sm:hidden">+</span>
              </Button>
            )}
          </div>
          <p className="text-gray-600">
            Tekrarlayan görevleri oluşturun ve yönetin
          </p>
        </div>

        {/* Bulk Actions */}
        {tasks.length > 0 && <BulkActionsBar />}

        {/* Tasks List */}
        <ScheduledTasksList
          tasks={tasks}
          loading={loading}
          onEdit={(task) => {
            setEditingTask(task);
            setIsModalOpen(true);
          }}
        />

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <ScheduledTaskModal
            task={editingTask}
            createTask={createTask}
            updateTask={updateTask}
            onSuccess={() => {
              fetchTasks();
            }}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

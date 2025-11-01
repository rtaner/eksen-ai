'use client';

import { useState } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useScheduledTasks } from '@/lib/hooks/useScheduledTasks';
import ScheduledTasksList from '@/components/scheduled-tasks/ScheduledTasksList';
import ScheduledTaskModal from '@/components/scheduled-tasks/ScheduledTaskModal';
import BulkActionsBar from '@/components/scheduled-tasks/BulkActionsBar';
import Button from '@/components/ui/Button';

export default function ScheduledTasksPage() {
  const { canCreate, isLoading: permissionsLoading } = usePermissions();
  const { tasks, loading, fetchTasks, createTask, updateTask } = useScheduledTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Zamanlanmış Görevler
            </h1>
            {canCreate('tasks') && (
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

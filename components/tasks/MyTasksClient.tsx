'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';

interface MyTasksClientProps {
  initialTasks: Task[];
  personnelId: string;
  userId: string;
}

export default function MyTasksClient({
  initialTasks,
  personnelId,
  userId,
}: MyTasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const supabase = createClient();

  // Real-time subscription for tasks assigned to this user
  useRealtime({
    table: 'tasks',
    filter: `personnel_id=eq.${personnelId}`,
    onInsert: (newTask: Task) => {
      // Only add if it's an open task
      if (newTask.status === 'open') {
        setTasks((prev) => {
          // Check if task already exists
          if (prev.some((t) => t.id === newTask.id)) {
            return prev;
          }
          // Add and re-sort by deadline
          return [...prev, newTask].sort((a, b) => {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          });
        });
      }
    },
    onUpdate: (updatedTask: Task) => {
      setTasks((prev) => {
        // If task is closed, remove it from the list
        if (updatedTask.status === 'closed') {
          return prev.filter((task) => task.id !== updatedTask.id);
        }
        // Otherwise update it
        return prev
          .map((task) => (task.id === updatedTask.id ? updatedTask : task))
          .sort((a, b) => {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          });
      });
    },
    onDelete: (deletedTask: Task) => {
      setTasks((prev) => prev.filter((task) => task.id !== deletedTask.id));
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">İşlerim</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          Canlı
        </span>
      </div>

      <Card>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="mt-4 text-gray-500">Henüz size atanmış görev bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const deadline = new Date(task.deadline);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isOverdue = deadline < today;

              return (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    isOverdue
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 break-words">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <svg
                          className={`w-4 h-4 flex-shrink-0 ${
                            isOverdue ? 'text-red-600' : 'text-gray-500'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p
                          className={`text-sm ${
                            isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                          }`}
                        >
                          Termin: {deadline.toLocaleDateString('tr-TR')}
                          {isOverdue && ' (Gecikmiş)'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      Açık
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

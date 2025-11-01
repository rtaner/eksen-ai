'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { isToday, isPast, formatDate } from '@/lib/utils/date';

interface Task {
  id: string;
  description: string;
  deadline: string;
  star_rating: number | null;
  personnel: {
    id: string;
    name: string;
  };
}

interface UncompletedTasksCardProps {
  tasks: Task[];
}

type TabType = 'today' | 'overdue';

export default function UncompletedTasksCard({ tasks }: UncompletedTasksCardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Filter tasks by deadline using utility functions
  const todayTasks = tasks.filter((task) => isToday(task.deadline));
  const overdueTasks = tasks.filter((task) => isPast(task.deadline) && !isToday(task.deadline));

  const displayTasks = activeTab === 'today' ? todayTasks : overdueTasks;

  const handleTaskClick = (taskId: string, personnelId: string) => {
    router.push(`/personnel/${personnelId}?tab=tasks`);
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          📋 <span className="hidden sm:inline">Tamamlanmamış Görevler</span><span className="sm:hidden">Görevler</span>
        </h2>

        {/* Tabs - Touch-friendly */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-3 font-medium text-sm sm:text-base transition-colors min-h-[44px] ${
              activeTab === 'today'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="hidden sm:inline">Bugün Biten</span>
            <span className="sm:hidden">Bugün</span> ({todayTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-4 py-3 font-medium text-sm sm:text-base transition-colors min-h-[44px] ${
              activeTab === 'overdue'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gecikmiş ({overdueTasks.length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeTab === 'today'
                ? 'Bugün biten görev yok 👍'
                : 'Gecikmiş görev yok! 🎉'}
            </p>
          </div>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task.id, task.personnel.id)}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all active:scale-98 min-h-[44px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      👤 {task.personnel.name}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {formatDate(task.deadline)}
                    </span>
                    {task.star_rating && (
                      <span className="flex items-center gap-1">
                        ⭐ {task.star_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

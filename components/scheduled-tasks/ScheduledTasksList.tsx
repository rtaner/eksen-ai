'use client';

import type { ScheduledTask } from '@/lib/types/scheduled-tasks';
import ScheduledTaskCard from './ScheduledTaskCard';

interface ScheduledTasksListProps {
  tasks: ScheduledTask[];
  loading: boolean;
  onEdit: (task: any) => void;
}

export default function ScheduledTasksList({ tasks, loading, onEdit }: ScheduledTasksListProps) {
  if (loading) return <div className="text-center py-8">Yükleniyor...</div>;
  if (tasks.length === 0) return <div className="text-center py-8 text-gray-500">Henüz zamanlanmış görev yok</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <ScheduledTaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  );
}

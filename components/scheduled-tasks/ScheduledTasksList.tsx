'use client';

import { useScheduledTasks } from '@/lib/hooks/useScheduledTasks';
import ScheduledTaskCard from './ScheduledTaskCard';

export default function ScheduledTasksList({ onEdit }: { onEdit: (task: any) => void }) {
  const { tasks, loading } = useScheduledTasks();

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

'use client';

import { useScheduledTasks } from '@/lib/hooks/useScheduledTasks';
import Button from '@/components/ui/Button';

export default function BulkActionsBar() {
  const { pauseAll, activateAll } = useScheduledTasks();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-3">
      <Button onClick={pauseAll} variant="secondary" size="sm">Tümünü Duraklat</Button>
      <Button onClick={activateAll} variant="secondary" size="sm">Tümünü Aktifleştir</Button>
    </div>
  );
}

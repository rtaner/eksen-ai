'use client';

import { useState } from 'react';
import LeaveDateManager from './LeaveDateManager';

export default function AdvancedSettings({ taskId }: { taskId?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!taskId) return null;

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-medium text-blue-600"
      >
        {isOpen ? '▼' : '▶'} Detaylı Ayarlar
      </button>
      {isOpen && <LeaveDateManager taskId={taskId} />}
    </div>
  );
}

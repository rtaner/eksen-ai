'use client';

import { useState, useRef, useEffect } from 'react';
import RecurrenceSelector from './RecurrenceSelector';
import AssignmentSelector from './AssignmentSelector';
import AdvancedSettings from './AdvancedSettings';
import Button from '@/components/ui/Button';

export default function ScheduledTaskModal({ task, onClose, onSuccess, createTask, updateTask }: any) {
  const [formData, setFormData] = useState(task || {
    name: 'Zamanlanmış Görev', // Auto-generated name
    description: '',
    recurrence_type: 'daily',
    recurrence_config: { type: 'daily' },
    scheduled_time: '17:00:00', // Default deadline time
    assignment_type: 'specific',
    assignment_config: { type: 'specific', personnel_ids: [] },
  });

  // Swipe to dismiss için state
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    try {
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await createTask(formData);
      }
      onClose();
      // Call onSuccess after closing to refresh the list
      if (onSuccess) {
        setTimeout(() => onSuccess(), 100);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Swipe to dismiss handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = modalRef.current?.querySelector('.overflow-y-auto')?.scrollTop || 0;
    // Sadece scroll en üstteyken swipe'a izin ver
    if (scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY;
    // Sadece aşağı kaydırmaya izin ver
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 150px'den fazla kaydırıldıysa kapat
    if (currentY > 150) {
      onClose();
    }
    
    setCurrentY(0);
    setStartY(0);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-3xl h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-transform"
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator - sadece mobilde */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header - sabit */}
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">{task ? 'Görevi Düzenle' : 'Yeni Görev'}</h2>
        </div>
        
        {/* Content - scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <textarea
              placeholder="Görev Açıklaması"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg"
              rows={4}
            />

            <RecurrenceSelector value={formData} onChange={setFormData} />
            <AssignmentSelector value={formData} onChange={setFormData} />
            <AdvancedSettings taskId={task?.id} />
          </div>
        </div>

        {/* Footer - sabit */}
        <div className="p-4 sm:p-6 border-t flex gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="secondary">İptal</Button>
          <Button onClick={handleSubmit}>Kaydet</Button>
        </div>
      </div>
    </div>
  );
}

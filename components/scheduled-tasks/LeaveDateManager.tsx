'use client';

import { useState, useEffect } from 'react';
import { useLeaveDates } from '@/lib/hooks/useLeaveDates';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function LeaveDateManager({ taskId }: { taskId: string }) {
  const { leaveDates, addLeaveDate, removeLeaveDate } = useLeaveDates(taskId);
  const [newDate, setNewDate] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [personnel, setPersonnel] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    const { data } = await supabase
      .from('personnel')
      .select('id, name')
      .order('name');
    
    setPersonnel(data || []);
  };

  const handleAdd = async () => {
    if (!newDate || !selectedPersonnel) return;
    
    await addLeaveDate({
      scheduled_task_id: taskId,
      personnel_id: selectedPersonnel,
      leave_date: newDate,
    });
    
    setNewDate('');
    setSelectedPersonnel('');
  };

  return (
    <div className="mt-4 space-y-3">
      <h4 className="font-medium text-sm">İzin Günleri</h4>
      <p className="text-xs text-gray-600">Belirli personelin izinli olduğu günleri ekleyin</p>
      
      <div className="space-y-2">
        <select
          value={selectedPersonnel}
          onChange={(e) => setSelectedPersonnel(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">Personel Seçin</option>
          {personnel.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button onClick={handleAdd} size="sm" disabled={!newDate || !selectedPersonnel}>
            Ekle
          </Button>
        </div>
      </div>

      {leaveDates.length > 0 && (
        <div className="space-y-2">
          {leaveDates.map((date) => (
            <div key={date.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{new Date(date.leave_date).toLocaleDateString('tr-TR')}</span>
              <button 
                onClick={() => removeLeaveDate(date.id)} 
                className="text-red-600 text-sm hover:text-red-700"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TaskForm from '@/components/tasks/TaskForm';
import Button from '@/components/ui/Button';

interface Personnel {
  id: string;
  name: string;
}

interface AssignStoreTaskModalProps {
  initialDescription: string;
  onClose: () => void;
}

export default function AssignStoreTaskModal({ initialDescription, onClose }: AssignStoreTaskModalProps) {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPersonnel = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data } = await supabase
          .from('personnel')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name');
          
        if (data) {
          setPersonnelList(data);
          if (data.length > 0) {
            setSelectedPersonnelId(data[0].id);
          }
        }
      }
      setIsLoading(false);
    };

    fetchPersonnel();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Görev Ata</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : personnelList.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Görev atanacak personel bulunamadı. Önce personel eklemelisiniz.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personel Seçin
                </label>
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => setSelectedPersonnelId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {personnelList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedPersonnelId && (
                <TaskForm 
                  personnelId={selectedPersonnelId} 
                  initialDescription={initialDescription}
                  onSuccess={onClose}
                  onCancel={onClose}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

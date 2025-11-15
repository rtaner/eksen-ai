'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChecklistExecution } from '@/lib/hooks/useChecklistExecution';
import { useToast } from '@/lib/contexts/ToastContext';
import Button from '@/components/ui/Button';

interface Personnel {
  id: string;
  name: string;
}

interface PersonnelAssignmentFormProps {
  resultId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function PersonnelAssignmentForm({
  resultId,
  onComplete,
  onSkip,
}: PersonnelAssignmentFormProps) {
  const supabase = createClient();
  const { profile } = useAuth();
  const { assignToPersonnel } = useChecklistExecution(null);
  const { showSuccess, showError } = useToast();
  
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch personnel
  useEffect(() => {
    fetchPersonnel();
  }, [profile?.organization_id]);

  const fetchPersonnel = async () => {
    if (!profile?.organization_id) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('personnel')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name');

      if (error) throw error;

      setPersonnel(data || []);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      showError('Personel listesi yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      showError('En az 1 personel seçmelisiniz');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await assignToPersonnel(resultId, selectedIds);
      
      if (success) {
        showSuccess(`${selectedIds.length} personele atandı`);
        onComplete();
      } else {
        showError('Atama yapılamadı');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      showError('Atama yapılamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPersonnel = personnel.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Personel Seç
        </h3>
        <p className="text-sm text-gray-600">
          Bu checklist sonucunu hangi personellere atamak istiyorsunuz?
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Personel ara..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Personnel List */}
      <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
        {isLoading ? (
          <p className="text-center text-gray-500 py-4">Yükleniyor...</p>
        ) : filteredPersonnel.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {searchQuery ? 'Personel bulunamadı' : 'Henüz personel yok'}
          </p>
        ) : (
          filteredPersonnel.map((p) => (
            <label
              key={p.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${
                  selectedIds.includes(p.id)
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggleSelection(p.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900">{p.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected Count */}
      {selectedIds.length > 0 && (
        <p className="text-sm text-blue-600 font-medium">
          {selectedIds.length} personel seçildi
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          variant="secondary"
          onClick={onSkip}
          disabled={isSubmitting}
        >
          Atla
        </Button>
        <Button
          onClick={handleAssign}
          disabled={selectedIds.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Atanıyor...' : 'Ata'}
        </Button>
      </div>
    </div>
  );
}

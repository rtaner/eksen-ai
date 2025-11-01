'use client';

import { useState } from 'react';
import { Personnel } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface PersonnelDeleteConfirmProps {
  personnel: Personnel;
  onSuccess: (personnelId: string) => void;
  onCancel: () => void;
}

export default function PersonnelDeleteConfirm({
  personnel,
  onSuccess,
  onCancel,
}: PersonnelDeleteConfirmProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Delete personnel from database
      const { error: deleteError } = await supabase
        .from('personnel')
        .delete()
        .eq('id', personnel.id);

      if (deleteError) throw deleteError;

      onSuccess(personnel.id);
    } catch (err: any) {
      console.error('Error deleting personnel:', err);
      setError(err.message || 'Personel silinirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 font-medium mb-2">
          ⚠️ Dikkat: Bu işlem geri alınamaz!
        </p>
        <p className="text-sm text-gray-700">
          <strong>{personnel.name}</strong> adlı personeli silmek üzeresiniz.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Bu personele ait tüm notlar, görevler ve analizler de silinecektir.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          İptal
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={isLoading}
          className="flex-1"
        >
          Sil
        </Button>
      </div>
    </div>
  );
}

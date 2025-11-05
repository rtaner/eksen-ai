'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface ManualPersonnel {
  id: string;
  name: string;
}

interface ManualPersonnelEditFormProps {
  personnel: ManualPersonnel;
  onSuccess: (updatedPersonnel: ManualPersonnel) => void;
  onCancel: () => void;
}

export default function ManualPersonnelEditForm({
  personnel,
  onSuccess,
  onCancel,
}: ManualPersonnelEditFormProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(personnel.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('İsim boş olamaz');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('personnel')
        .update({ name: name.trim() })
        .eq('id', personnel.id);

      if (updateError) throw updateError;

      onSuccess({ ...personnel, name: name.trim() });
    } catch (err: any) {
      console.error('Error updating personnel:', err);
      setError(err.message || 'Personel güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          İsim
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
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
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          Güncelle
        </Button>
      </div>
    </form>
  );
}

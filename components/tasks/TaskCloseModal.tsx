'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';

interface TaskCloseModalProps {
  task: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskCloseModal({
  task,
  onSuccess,
  onCancel,
}: TaskCloseModalProps) {
  const [rating, setRating] = useState<number>(3); // Default 3 stars
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    if (rating < 1 || rating > 5) {
      setError('Lütfen 1-5 arası bir değerlendirme seçin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create fresh client instance to avoid stale session
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'closed',
          star_rating: rating,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      onSuccess?.();
    } catch (err: any) {
      console.error('Error closing task:', err);
      setError(err.message || 'Görev kapatılırken bir hata oluştu');
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

      {/* Task info */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Görev:</p>
        <p className="text-gray-900 font-medium">{task.description}</p>
        <p className="text-xs text-gray-500 mt-2">
          Termin: {new Date(task.deadline).toLocaleDateString('tr-TR')}
        </p>
      </div>

      {/* Rating selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Performans Değerlendirmesi
        </label>
        <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
            readonly={false}
          />
          <p className="text-sm text-gray-600">
            {rating === 1 && '⭐ Yetersiz'}
            {rating === 2 && '⭐⭐ Geliştirilmeli'}
            {rating === 3 && '⭐⭐⭐ Orta'}
            {rating === 4 && '⭐⭐⭐⭐ İyi'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Mükemmel'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button
          onClick={handleClose}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Kapatılıyor...' : 'Görevi Kapat'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  role: 'owner' | 'manager' | 'personnel';
}

interface UserDeleteConfirmProps {
  user: User;
  onSuccess: (userId: string) => void;
  onCancel: () => void;
}

export default function UserDeleteConfirm({
  user,
  onSuccess,
  onCancel,
}: UserDeleteConfirmProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Delete user's profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Note: Deleting from profiles table will cascade delete related data
      // due to foreign key constraints (personnel, notes, tasks, etc.)

      onSuccess(user.id);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Kullanıcı silinirken bir hata oluştu');
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
          <strong>{user.name} {user.surname}</strong> (@{user.username}) adlı kullanıcıyı silmek üzeresiniz.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Bu kullanıcının:
        </p>
        <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
          <li>Hesabı silinecek</li>
          <li>Yazdığı tüm notlar silinecek</li>
          <li>Oluşturduğu tüm görevler silinecek</li>
          <li>İlişkili tüm veriler silinecek</li>
        </ul>
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

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface PersonnelRecord {
  id: string;
  name: string;
  surname: string;
  user_id: string | null;
  email: string | null;
  created_at: string;
  notes_count: number;
  tasks_count: number;
}

interface DuplicatePair {
  id: string;
  record1: PersonnelRecord;
  record2: PersonnelRecord;
  suggested_primary: string;
}

interface DuplicatePersonnelCardProps {
  duplicate: DuplicatePair;
  onMerge: (primaryId: string, secondaryId: string) => Promise<boolean>;
  onDismiss: (duplicateId: string) => void;
}

export default function DuplicatePersonnelCard({ duplicate, onMerge, onDismiss }: DuplicatePersonnelCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [merging, setMerging] = useState(false);

  const { record1, record2, suggested_primary } = duplicate;
  const primaryRecord = suggested_primary === record2.id ? record2 : record1;
  const secondaryRecord = suggested_primary === record2.id ? record1 : record2;

  const handleMerge = async () => {
    setMerging(true);
    const success = await onMerge(primaryRecord.id, secondaryRecord.id);
    setMerging(false);
    if (success) {
      setShowConfirm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (showConfirm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-400">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Personel Kayıtlarını Birleştir
        </h3>

        <p className="text-gray-700 mb-4">
          <strong>{primaryRecord.name} {primaryRecord.surname}</strong> için 2 kayıt birleştirilecek:
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-700 font-semibold">✅ Ana Kayıt (Tutulacak)</span>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <div>• Kullanıcı: {primaryRecord.user_id ? `✅ Var (${primaryRecord.email})` : '❌ Yok'}</div>
            <div>• Notlar: {primaryRecord.notes_count} adet</div>
            <div>• Görevler: {primaryRecord.tasks_count} adet</div>
            <div>• Oluşturma: {formatDate(primaryRecord.created_at)}</div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-700 font-semibold">❌ Silinecek Kayıt</span>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <div>• Kullanıcı: {secondaryRecord.user_id ? `✅ Var (${secondaryRecord.email})` : '❌ Yok'}</div>
            <div>• Notlar: {secondaryRecord.notes_count} adet</div>
            <div>• Görevler: {secondaryRecord.tasks_count} adet</div>
            <div>• Oluşturma: {formatDate(secondaryRecord.created_at)}</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="font-semibold text-blue-900 mb-2">Taşınacak Veriler:</div>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• {secondaryRecord.notes_count} not → Ana kayda taşınacak</div>
            <div>• {secondaryRecord.tasks_count} görev → Ana kayda taşınacak</div>
            <div>• Tüm analizler → Ana kayda taşınacak</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Bu işlem geri alınamaz!
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowConfirm(false)}
            disabled={merging}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={handleMerge}
            isLoading={merging}
            className="flex-1"
          >
            Birleştir ve Devam Et
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">👤</span>
        <h3 className="text-lg font-bold text-gray-900">
          {record1.name} {record1.surname}
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Record 1 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="font-semibold text-gray-700 mb-2">
            Kayıt 1 {record1.id === suggested_primary && '(Önerilen)'}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• ID: {record1.id.substring(0, 8)}...</div>
            <div>• Kullanıcı: {record1.user_id ? '✅ Var' : '❌ Yok'}</div>
            {record1.email && <div>• Email: {record1.email}</div>}
            <div>• Notlar: {record1.notes_count} adet</div>
            <div>• Görevler: {record1.tasks_count} adet</div>
            <div>• Oluşturma: {formatDate(record1.created_at)}</div>
          </div>
        </div>

        {/* Record 2 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="font-semibold text-gray-700 mb-2">
            Kayıt 2 {record2.id === suggested_primary && '(Önerilen)'}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• ID: {record2.id.substring(0, 8)}...</div>
            <div>• Kullanıcı: {record2.user_id ? '✅ Var' : '❌ Yok'}</div>
            {record2.email && <div>• Email: {record2.email}</div>}
            <div>• Notlar: {record2.notes_count} adet</div>
            <div>• Görevler: {record2.tasks_count} adet</div>
            <div>• Oluşturma: {formatDate(record2.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => onDismiss(duplicate.id)}
          className="flex-1"
        >
          Bu Duplicate Değil
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowConfirm(true)}
          className="flex-1"
        >
          Birleştir
        </Button>
      </div>
    </div>
  );
}

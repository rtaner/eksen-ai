'use client';

import { useEffect, useState } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useDuplicatePersonnel } from '@/lib/hooks/useDuplicatePersonnel';
import DuplicatePersonnelCard from '@/components/organization/DuplicatePersonnelCard';
import { useRouter } from 'next/navigation';

export default function DuplicatesPage() {
  const router = useRouter();
  const { canEdit, isLoading: permissionsLoading } = usePermissions();
  const { duplicates, loading, error, detectDuplicates, mergePersonnel, dismissDuplicate } = useDuplicatePersonnel();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!permissionsLoading && !canEdit('personnel')) {
      router.push('/personnel');
    }
  }, [permissionsLoading, canEdit, router]);

  useEffect(() => {
    if (!permissionsLoading && canEdit('personnel') && !hasChecked) {
      detectDuplicates();
      setHasChecked(true);
    }
  }, [permissionsLoading, canEdit, hasChecked, detectDuplicates]);

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Duplicate kayıtlar kontrol ediliyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit('personnel')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Duplicate Personel Kayıtları
          </h1>
          <p className="text-gray-600">
            Bu kayıtlar aynı kişiye ait olabilir. İnceleyip birleştirmek isterseniz "Birleştir" butonuna tıklayın.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Duplicates List */}
        {duplicates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Duplicate Kayıt Bulunamadı
            </h2>
            <p className="text-gray-600">
              Tüm personel kayıtları benzersiz görünüyor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {duplicates.map((duplicate) => (
              <DuplicatePersonnelCard
                key={duplicate.id}
                duplicate={duplicate}
                onMerge={mergePersonnel}
                onDismiss={dismissDuplicate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

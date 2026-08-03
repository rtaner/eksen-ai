'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Personnel } from '@/lib/types';
import { usePermissions } from '@/lib/hooks/usePermissions';
import PersonnelList from './PersonnelList';
import PersonnelForm from './PersonnelForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface PersonnelDirectoryClientProps {
  initialPersonnel: Personnel[];
}

export default function PersonnelDirectoryClient({
  initialPersonnel,
}: PersonnelDirectoryClientProps) {
  const router = useRouter();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSuccess = (newPersonnel: Personnel) => {
    setPersonnel([newPersonnel, ...personnel]);
    setShowAddModal(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Personel Listesi ({personnel.length})
          </h1>
          <p className="text-sm text-gray-600">
            Mağaza personellerinizi, hesap rollerini ve performans bilgilerini yönetin
          </p>
        </div>

        {canCreate('personnel') && (
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="sm"
          >
            + Personel Ekle
          </Button>
        )}
      </div>

      <PersonnelList
        personnel={personnel}
        canCreate={canCreate('personnel')}
        canEdit={canEdit('personnel')}
        canDelete={canDelete('personnel')}
        onAdd={() => setShowAddModal(true)}
      />

      {/* Add Personnel Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Yeni Personel Ekle"
        >
          <PersonnelForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

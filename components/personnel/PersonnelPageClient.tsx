'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Personnel } from '@/lib/types';
import { usePermissions } from '@/lib/hooks/usePermissions';
import PersonnelList from './PersonnelList';
import PersonnelForm from './PersonnelForm';
import Modal from '@/components/ui/Modal';

interface PersonnelPageClientProps {
  initialPersonnel: Personnel[];
}

export default function PersonnelPageClient({
  initialPersonnel,
}: PersonnelPageClientProps) {
  const router = useRouter();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = (newPersonnel: Personnel) => {
    setPersonnel([newPersonnel, ...personnel]);
    setShowAddModal(false);
    router.refresh();
  };

  return (
    <>
      <PersonnelList
        personnel={personnel}
        canCreate={canCreate('personnel')}
        canEdit={canEdit('personnel')}
        canDelete={canDelete('personnel')}
        onAdd={handleAdd}
      />

      {/* Add Modal */}
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
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Personnel } from '@/lib/types';
import { usePermissions } from '@/lib/hooks/usePermissions';
import PersonnelList from './PersonnelList';
import PersonnelForm from './PersonnelForm';
import PersonnelDeleteConfirm from './PersonnelDeleteConfirm';
import Modal from '@/components/ui/Modal';

interface PersonnelPageClientProps {
  initialPersonnel: Personnel[];
}

export default function PersonnelPageClient({
  initialPersonnel,
}: PersonnelPageClientProps) {
  const router = useRouter();
  const { canCreate, canEdit, canDelete, isLoading } = usePermissions();
  const [personnel, setPersonnel] = useState<Personnel[]>(initialPersonnel);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleEdit = (p: Personnel) => {
    setSelectedPersonnel(p);
    setShowEditModal(true);
  };

  const handleDelete = (p: Personnel) => {
    setSelectedPersonnel(p);
    setShowDeleteModal(true);
  };

  const handleAddSuccess = (newPersonnel: Personnel) => {
    setPersonnel([newPersonnel, ...personnel]);
    setShowAddModal(false);
    router.refresh();
  };

  const handleEditSuccess = (updatedPersonnel: Personnel) => {
    setPersonnel(
      personnel.map((p) => (p.id === updatedPersonnel.id ? updatedPersonnel : p))
    );
    setShowEditModal(false);
    setSelectedPersonnel(null);
    router.refresh();
  };

  const handleDeleteSuccess = (personnelId: string) => {
    setPersonnel(personnel.filter((p) => p.id !== personnelId));
    setShowDeleteModal(false);
    setSelectedPersonnel(null);
    router.refresh();
  };

  // Track initial load
  useEffect(() => {
    if (!isLoading) {
      setHasInitialLoad(true);
    }
  }, [isLoading]);

  // Only show loading on first load, not on subsequent navigations
  if (isLoading && !hasInitialLoad && personnel.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      <PersonnelList
        personnel={personnel}
        canCreate={canCreate('personnel')}
        canEdit={canEdit('personnel')}
        canDelete={canDelete('personnel')}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
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

      {/* Edit Modal */}
      {showEditModal && selectedPersonnel && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPersonnel(null);
          }}
          title="Personel Düzenle"
        >
          <PersonnelForm
            personnel={selectedPersonnel}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPersonnel(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPersonnel && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPersonnel(null);
          }}
          title="Personel Sil"
        >
          <PersonnelDeleteConfirm
            personnel={selectedPersonnel}
            onSuccess={handleDeleteSuccess}
            onCancel={() => {
              setShowDeleteModal(false);
              setSelectedPersonnel(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}

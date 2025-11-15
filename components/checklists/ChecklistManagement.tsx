'use client';

import { useState } from 'react';
import { useChecklists } from '@/lib/hooks/useChecklists';
import { usePermissions } from '@/lib/hooks/usePermissions';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ChecklistForm from './ChecklistForm';
import ChecklistCard from './ChecklistCard';
import { useToast } from '@/lib/contexts/ToastContext';
import type { Checklist } from '@/lib/types';

export default function ChecklistManagement() {
  const { checklists, isLoading, deleteChecklist, refreshChecklists } = useChecklists();
  const { showSuccess, showError } = useToast();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [deletingChecklist, setDeletingChecklist] = useState<Checklist | null>(null);

  // Server-side already checks owner, no need to check again
  // This prevents "Bu sayfaya erişim yetkiniz yok" flash

  const handleCreateNew = () => {
    setEditingChecklist(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    setIsFormModalOpen(true);
  };

  const handleDelete = (checklist: Checklist) => {
    setDeletingChecklist(checklist);
  };

  const confirmDelete = async () => {
    if (!deletingChecklist) return;

    const success = await deleteChecklist(deletingChecklist.id);
    
    if (success) {
      showSuccess('Checklist silindi');
      setDeletingChecklist(null);
    } else {
      showError('Checklist silinirken bir hata oluştu');
    }
  };

  const handleFormSuccess = async () => {
    setIsFormModalOpen(false);
    setEditingChecklist(null);
    // Refresh list to ensure it's up to date
    await refreshChecklists();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Checklistlerim</h2>
          <p className="text-gray-600 mt-1">
            Yeniden kullanılabilir checklist şablonları oluşturun ve yönetin
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          + Yeni Checklist
        </Button>
      </div>


      {/* Checklist List */}
      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Henüz checklist yok
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Yeni bir checklist oluşturarak başlayın
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateNew}>
                  + Yeni Checklist
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checklists.map((checklist) => (
                <ChecklistCard
                  key={checklist.id}
                  checklist={checklist}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingChecklist(null);
        }}
        title={editingChecklist ? 'Checklist Düzenle' : 'Yeni Checklist'}
        size="lg"
      >
        <ChecklistForm
          editingChecklist={editingChecklist}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingChecklist(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingChecklist}
        onClose={() => setDeletingChecklist(null)}
        title="Checklist Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>{deletingChecklist?.title}</strong> checklist'ini silmek istediğinizden emin misiniz?
          </p>
          <p className="text-sm text-gray-600">
            Bu işlem geri alınamaz. Mevcut checklist sonuçları korunacaktır.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeletingChecklist(null)}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useChecklists } from '@/lib/hooks/useChecklists';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ChecklistTemplateCard from './ChecklistTemplateCard';
import ChecklistExecutionModal from './ChecklistExecutionModal';
import type { Checklist } from '@/lib/types';

export default function ChecklistsClient() {
  const { checklists, isLoading } = useChecklists();
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  const handleStart = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setIsExecutionModalOpen(true);
  };

  const handleExecutionComplete = () => {
    setIsExecutionModalOpen(false);
    setSelectedChecklist(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Checklistler</h1>
        <p className="text-gray-600 mt-2">
          Bir checklist seçin ve değerlendirme yapın
        </p>
      </div>

      {/* Checklist List */}
      <div>
        {isLoading ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          </Card>
        ) : checklists.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
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
                Yöneticiniz henüz checklist oluşturmamış
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {checklists.map((checklist) => (
              <ChecklistTemplateCard
                key={checklist.id}
                checklist={checklist}
                onStart={handleStart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Execution Modal */}
      <Modal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        title={selectedChecklist?.title || 'Checklist'}
        size="lg"
      >
        {selectedChecklist && (
          <ChecklistExecutionModal
            checklist={selectedChecklist}
            onComplete={handleExecutionComplete}
            onCancel={() => setIsExecutionModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface AnalysisCardProps {
  analysis: any;
  isOwner: boolean;
  onDelete: (id: string) => void;
}

const analysisTypeLabels = {
  yetkinlik: '📋 Yetkinlik Analizi',
  egilim: '📈 Eğilim Analizi',
  butunlesik: '🔄 Bütünleşik Analiz',
};

const analysisTypeColors = {
  yetkinlik: 'bg-green-100 text-green-700 border-green-200',
  egilim: 'bg-purple-100 text-purple-700 border-purple-200',
  butunlesik: 'bg-blue-100 text-blue-700 border-blue-200',
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;

  return date.toLocaleDateString('tr-TR');
}

export default function AnalysisCard({
  analysis,
  isOwner,
  onDelete,
}: AnalysisCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleView = () => {
    router.push(`/settings/analyses/${analysis.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ai_analyses')
        .delete()
        .eq('id', analysis.id);

      if (error) throw error;

      onDelete(analysis.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Analiz silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  const dateRangeStart = new Date(analysis.date_range_start);
  const dateRangeEnd = new Date(analysis.date_range_end);

  return (
    <>
      <Card hover>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Analysis Type Badge */}
          <div
            className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 ${
              analysisTypeColors[analysis.analysis_type as keyof typeof analysisTypeColors]
            }`}
          >
            <div className="text-sm font-semibold whitespace-nowrap">
              {analysisTypeLabels[analysis.analysis_type as keyof typeof analysisTypeLabels]}
            </div>
          </div>

          {/* Analysis Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {capitalizeFirst(analysis.personnel?.name || 'Bilinmeyen')}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>
                📅 {dateRangeStart.toLocaleDateString('tr-TR')} -{' '}
                {dateRangeEnd.toLocaleDateString('tr-TR')}
              </span>
              <span className="text-gray-400">•</span>
              <span>🕐 {getRelativeTime(analysis.created_at)}</span>
              {analysis.creator && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>
                    👤{' '}
                    {capitalizeFirst(
                      `${analysis.creator.name} ${analysis.creator.surname}`
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleView} size="sm">
              Görüntüle
            </Button>
            {isOwner && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="danger"
                size="sm"
              >
                Sil
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Analizi Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bu analizi silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

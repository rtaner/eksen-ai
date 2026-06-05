'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnalysisType } from '@/lib/types/analyses';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface NewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: { id: string; name: string }[];
  onSuccess: (analysis: any) => void;
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get tomorrow's date (to include today's notes)
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get date 3 months ago
const getThreeMonthsAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NewAnalysisModal({
  isOpen,
  onClose,
  personnel,
  onSuccess,
}: NewAnalysisModalProps) {
  const supabase = createClient();
  
  const [personnelId, setPersonnelId] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('yetkinlik');
  const [dateRangeStart, setDateRangeStart] = useState(getThreeMonthsAgo());
  const [dateRangeEnd, setDateRangeEnd] = useState(getTomorrowDate());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<{
    notesCount: number;
    tasksCount: number;
    checklistsCount: number;
  } | null>(null);

  // Fetch data stats when personnel or date range changes
  useEffect(() => {
    if (personnelId && dateRangeStart && dateRangeEnd) {
      fetchDataStats();
    } else {
      setDataStats(null);
    }
  }, [personnelId, dateRangeStart, dateRangeEnd]);

  const fetchDataStats = async () => {
    try {
      // Fetch notes count
      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('personnel_id', personnelId)
        .gte('created_at', dateRangeStart)
        .lte('created_at', dateRangeEnd);

      // Fetch closed tasks count
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('personnel_id', personnelId)
        .eq('status', 'closed')
        .gte('completed_at', dateRangeStart)
        .lte('completed_at', dateRangeEnd);

      // Fetch checklists count
      const { data: checklistAssignments } = await supabase
        .from('checklist_assignments')
        .select('checklist_result:checklist_results(completed_at)')
        .eq('personnel_id', personnelId);

      const checklistsCount = (checklistAssignments || [])
        .map((a: any) => a.checklist_result)
        .filter((c: any) => c && c.completed_at >= dateRangeStart && c.completed_at <= dateRangeEnd)
        .length;

      setDataStats({
        notesCount: notesCount || 0,
        tasksCount: tasksCount || 0,
        checklistsCount: checklistsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching data stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!personnelId) {
      setError('Lütfen bir personel seçin');
      return;
    }

    if (!dateRangeStart || !dateRangeEnd) {
      setError('Lütfen tarih aralığını seçin');
      return;
    }

    if (new Date(dateRangeStart) > new Date(dateRangeEnd)) {
      setError('Başlangıç tarihi bitiş tarihinden sonra olamaz');
      return;
    }

    if (dataStats && dataStats.notesCount === 0 && dataStats.tasksCount === 0 && dataStats.checklistsCount === 0) {
      setError('Seçilen dönemde analiz edilecek veri bulunamadı');
      return;
    }

    setIsLoading(true);

    try {
      // Call Edge Function
      const functionName = `analyze-butunlesik`;
      
      const { data, error: fnError } = await supabase.functions.invoke(
        functionName,
        {
          body: {
            personnelId,
            dateRangeStart,
            dateRangeEnd,
          },
        }
      );

      if (fnError) throw fnError;
      if (data && data.success === false) {
        throw new Error(`${data.error}\n\nDetails: ${data.details || ''}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Analiz oluşturulamadı');
      }

      // Fetch personnel and creator info to attach to analysis
      const selectedPersonnel = personnel.find(p => p.id === personnelId);
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, name, surname')
        .eq('id', user?.id)
        .single();

      // Attach relations to analysis
      const analysisWithRelations = {
        ...data.analysis,
        personnel: selectedPersonnel,
        creator: creator,
      };

      // Success
      onSuccess(analysisWithRelations);
      
      // Reset form
      setPersonnelId('');
      setAnalysisType('yetkinlik');
      setDateRangeStart(getThreeMonthsAgo());
      setDateRangeEnd(getTomorrowDate());
      setDataStats(null);
    } catch (err: any) {
      console.error('Error creating analysis:', err);
      setError(err.message || 'Analiz oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🆕 Yeni Analiz Oluştur" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Personnel Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personel Seç *
          </label>
          <select
            value={personnelId}
            onChange={(e) => setPersonnelId(e.target.value)}
            disabled={isLoading}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Personel seçin...</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Analysis Type Select - Hidden since we only have one now */}
        <div className="hidden">
          <input type="hidden" value="butunlesik" />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlangıç Tarihi *
            </label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitiş Tarihi *
            </label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Data Stats */}
        {dataStats && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              ℹ️ Bu dönemde:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {dataStats.notesCount} not</li>
              <li>• {dataStats.tasksCount} tamamlanmış görev</li>
              <li>• {dataStats.checklistsCount} checklist sonucu</li>
            </ul>
            {dataStats.notesCount === 0 && dataStats.tasksCount === 0 && dataStats.checklistsCount === 0 && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Analiz için yeterli veri yok
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              !personnelId ||
              Boolean(dataStats &&
                dataStats.notesCount === 0 &&
                dataStats.tasksCount === 0 &&
                dataStats.checklistsCount === 0)
            }
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Analiz Ediliyor...
              </>
            ) : (
              'Analiz Et'
            )}
          </Button>
        </div>

        {isLoading && (
          <p className="text-xs text-gray-500 text-center">
            Bu işlem 20-50 saniye sürebilir, lütfen bekleyin...
          </p>
        )}
      </form>
    </Modal>
  );
}

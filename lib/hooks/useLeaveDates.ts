import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LeaveDate, AddLeaveDateInput } from '@/lib/types/scheduled-tasks';

export function useLeaveDates(scheduledTaskId: string) {
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scheduledTaskId) {
      fetchLeaveDates();

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`leave-dates-${scheduledTaskId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scheduled_task_leave_dates',
            filter: `scheduled_task_id=eq.${scheduledTaskId}`,
          },
          () => {
            fetchLeaveDates();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [scheduledTaskId]);

  const fetchLeaveDates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('scheduled_task_leave_dates')
        .select('*')
        .eq('scheduled_task_id', scheduledTaskId)
        .order('leave_date', { ascending: true });

      if (fetchError) throw fetchError;

      setLeaveDates(data || []);
    } catch (err: any) {
      console.error('Error fetching leave dates:', err);
      setError(err.message || 'İzin günleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addLeaveDate = async (input: AddLeaveDateInput): Promise<LeaveDate | null> => {
    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('scheduled_task_leave_dates')
        .insert(input)
        .select()
        .single();

      if (insertError) throw insertError;

      setLeaveDates((prev) => [...prev, data].sort((a, b) => 
        a.leave_date.localeCompare(b.leave_date)
      ));
      return data;
    } catch (err: any) {
      console.error('Error adding leave date:', err);
      setError(err.message || 'İzin günü eklenirken hata oluştu');
      return null;
    }
  };

  const removeLeaveDate = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('scheduled_task_leave_dates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setLeaveDates((prev) => prev.filter((date) => date.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error removing leave date:', err);
      setError(err.message || 'İzin günü silinirken hata oluştu');
      return false;
    }
  };

  return {
    leaveDates,
    loading,
    error,
    fetchLeaveDates,
    addLeaveDate,
    removeLeaveDate,
  };
}

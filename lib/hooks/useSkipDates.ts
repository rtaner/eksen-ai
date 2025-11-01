import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SkipDate, AddSkipDateInput } from '@/lib/types/scheduled-tasks';

export function useSkipDates(scheduledTaskId: string) {
  const [skipDates, setSkipDates] = useState<SkipDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scheduledTaskId) {
      fetchSkipDates();

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`skip-dates-${scheduledTaskId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scheduled_task_skip_dates',
            filter: `scheduled_task_id=eq.${scheduledTaskId}`,
          },
          () => {
            fetchSkipDates();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [scheduledTaskId]);

  const fetchSkipDates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('scheduled_task_skip_dates')
        .select('*')
        .eq('scheduled_task_id', scheduledTaskId)
        .order('skip_date', { ascending: true });

      if (fetchError) throw fetchError;

      setSkipDates(data || []);
    } catch (err: any) {
      console.error('Error fetching skip dates:', err);
      setError(err.message || 'Atlanan günler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addSkipDate = async (input: AddSkipDateInput): Promise<SkipDate | null> => {
    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('scheduled_task_skip_dates')
        .insert(input)
        .select()
        .single();

      if (insertError) throw insertError;

      setSkipDates((prev) => [...prev, data].sort((a, b) => 
        a.skip_date.localeCompare(b.skip_date)
      ));
      return data;
    } catch (err: any) {
      console.error('Error adding skip date:', err);
      setError(err.message || 'Atlanan gün eklenirken hata oluştu');
      return null;
    }
  };

  const removeSkipDate = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('scheduled_task_skip_dates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSkipDates((prev) => prev.filter((date) => date.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error removing skip date:', err);
      setError(err.message || 'Atlanan gün silinirken hata oluştu');
      return false;
    }
  };

  return {
    skipDates,
    loading,
    error,
    fetchSkipDates,
    addSkipDate,
    removeSkipDate,
  };
}

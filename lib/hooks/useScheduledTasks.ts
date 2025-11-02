import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  ScheduledTask,
  CreateScheduledTaskInput,
  UpdateScheduledTaskInput,
} from '@/lib/types/scheduled-tasks';

const supabase = createClient();

export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching scheduled tasks:', err);
      setError(err.message || 'Görevler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('scheduled_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheduled_tasks',
        },
        (payload) => {
          console.log('Real-time INSERT:', payload);
          setTasks((prev) => [payload.new as ScheduledTask, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scheduled_tasks',
        },
        (payload) => {
          console.log('Real-time UPDATE:', payload);
          setTasks((prev) =>
            prev.map((task) =>
              task.id === payload.new.id ? (payload.new as ScheduledTask) : task
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'scheduled_tasks',
        },
        (payload) => {
          console.log('Real-time DELETE:', payload);
          setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from scheduled_tasks');
      supabase.removeChannel(channel);
    };
  }, []);

  const createTask = async (input: CreateScheduledTaskInput): Promise<ScheduledTask | null> => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profil bulunamadı');

      const { data, error: insertError } = await supabase
        .from('scheduled_tasks')
        .insert({
          ...input,
          organization_id: profile.organization_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Real-time subscription will handle the update
      return data;
    } catch (err: any) {
      console.error('Error creating scheduled task:', err);
      setError(err.message || 'Görev oluşturulurken hata oluştu');
      return null;
    }
  };

  const updateTask = async (
    id: string,
    input: UpdateScheduledTaskInput
  ): Promise<ScheduledTask | null> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('scheduled_tasks')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Real-time subscription will handle the update
      return data;
    } catch (err: any) {
      console.error('Error updating scheduled task:', err);
      setError(err.message || 'Görev güncellenirken hata oluştu');
      return null;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Real-time subscription will handle the update
      return true;
    } catch (err: any) {
      console.error('Error deleting scheduled task:', err);
      setError(err.message || 'Görev silinirken hata oluştu');
      return false;
    }
  };

  const toggleActive = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error('Görev bulunamadı');

      const { data, error: updateError } = await supabase
        .from('scheduled_tasks')
        .update({ is_active: !task.is_active })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Real-time subscription will handle the update
      return true;
    } catch (err: any) {
      console.error('Error toggling task status:', err);
      setError(err.message || 'Durum değiştirilirken hata oluştu');
      return false;
    }
  };

  const pauseAll = async (): Promise<boolean> => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profil bulunamadı');

      const { error: updateError } = await supabase
        .from('scheduled_tasks')
        .update({ is_active: false })
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (updateError) throw updateError;

      await fetchTasks();
      return true;
    } catch (err: any) {
      console.error('Error pausing all tasks:', err);
      setError(err.message || 'Görevler duraklatılırken hata oluştu');
      return false;
    }
  };

  const activateAll = async (): Promise<boolean> => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profil bulunamadı');

      const { error: updateError } = await supabase
        .from('scheduled_tasks')
        .update({ is_active: true })
        .eq('organization_id', profile.organization_id)
        .eq('is_active', false);

      if (updateError) throw updateError;

      await fetchTasks();
      return true;
    } catch (err: any) {
      console.error('Error activating all tasks:', err);
      setError(err.message || 'Görevler aktifleştirilirken hata oluştu');
      return false;
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleActive,
    pauseAll,
    activateAll,
  };
}

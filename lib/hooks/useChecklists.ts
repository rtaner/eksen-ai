'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Checklist, ChecklistFormData } from '@/lib/types';

interface UseChecklistsReturn {
  checklists: Checklist[];
  isLoading: boolean;
  error: string | null;
  createChecklist: (data: ChecklistFormData) => Promise<Checklist | null>;
  updateChecklist: (id: string, data: Partial<ChecklistFormData>) => Promise<boolean>;
  deleteChecklist: (id: string) => Promise<boolean>;
  refreshChecklists: () => Promise<void>;
}

export function useChecklists(): UseChecklistsReturn {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Fetch checklists
  const fetchChecklists = async () => {
    if (!profile?.organization_id) {
      setIsLoading(false);
      return;
    }

    try {
      // Only show loading on first fetch
      if (!hasFetched) {
        setIsLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('checklists')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setChecklists(data || []);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching checklists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch checklists');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch - wait for auth to complete
  useEffect(() => {
    if (!authLoading && profile?.organization_id) {
      fetchChecklists();
    } else if (!authLoading && !profile) {
      setIsLoading(false);
    }
  }, [authLoading, profile?.organization_id]);

  // Real-time subscription - optional, don't block UI
  useEffect(() => {
    if (!profile?.organization_id || !hasFetched) return;

    console.log('🔵 Setting up real-time subscription for org:', profile.organization_id);

    const channel = supabase
      .channel(`checklists-changes-${profile.organization_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklists',
          filter: `organization_id=eq.${profile.organization_id}`,
        },
        (payload) => {
          console.log('🔵 Real-time event:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newChecklist = payload.new as Checklist;
            if (!newChecklist.deleted_at) {
              console.log('✅ Adding new checklist to list');
              setChecklists((prev) => [newChecklist, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedChecklist = payload.new as Checklist;
            console.log('✅ Updating checklist in list');
            setChecklists((prev) =>
              prev.map((c) => (c.id === updatedChecklist.id ? updatedChecklist : c))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedChecklist = payload.old as Checklist;
            console.log('✅ Removing checklist from list');
            setChecklists((prev) => prev.filter((c) => c.id !== deletedChecklist.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Real-time subscription error (non-blocking)');
        }
      });

    return () => {
      console.log('🔵 Unsubscribing from real-time');
      supabase.removeChannel(channel);
    };
  }, [profile?.organization_id, hasFetched]);


  // Create checklist
  const createChecklist = async (data: ChecklistFormData): Promise<Checklist | null> => {
    console.log('🔵 createChecklist called with:', data);
    console.log('🔵 Profile:', profile);
    
    if (!profile?.organization_id) {
      console.error('❌ Organization not found');
      setError('Organization not found');
      return null;
    }

    try {
      setError(null);

      const insertData = {
        organization_id: profile.organization_id,
        title: data.title,
        description: data.description || null,
        items: data.items,
      };
      
      console.log('🔵 Inserting data:', insertData);

      const { data: newChecklist, error: createError } = await supabase
        .from('checklists')
        .insert(insertData)
        .select()
        .single();

      console.log('🔵 Insert result:', { newChecklist, createError });

      if (createError) throw createError;

      console.log('✅ Checklist created successfully:', newChecklist);
      
      // Optimistic update - add to list immediately
      setChecklists((prev) => [newChecklist, ...prev]);
      
      return newChecklist;
    } catch (err) {
      console.error('❌ Error creating checklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checklist');
      return null;
    }
  };

  // Update checklist
  const updateChecklist = async (
    id: string,
    data: Partial<ChecklistFormData>
  ): Promise<boolean> => {
    try {
      setError(null);

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.items !== undefined) updateData.items = data.items;

      const { data: updatedChecklist, error: updateError } = await supabase
        .from('checklists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Optimistic update - update in list immediately
      if (updatedChecklist) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === id ? updatedChecklist : c))
        );
      }

      return true;
    } catch (err) {
      console.error('Error updating checklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to update checklist');
      return false;
    }
  };

  // Delete checklist (hard delete)
  const deleteChecklist = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      // Optimistic update - remove immediately
      setChecklists((prev) => prev.filter((c) => c.id !== id));

      const { error: deleteError } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        // Rollback on error - refresh list
        await fetchChecklists();
        throw deleteError;
      }

      console.log('✅ Checklist deleted');
      return true;
    } catch (err) {
      console.error('Error deleting checklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete checklist');
      return false;
    }
  };

  // Refresh checklists
  const refreshChecklists = async () => {
    await fetchChecklists();
  };

  return {
    checklists,
    isLoading,
    error,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    refreshChecklists,
  };
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Checklist, ChecklistResult } from '@/lib/types';

interface UseChecklistExecutionReturn {
  completedItems: string[];
  itemComments: Record<string, string>;
  setItemComment: (itemId: string, comment: string) => void;
  score: number;
  progress: number;
  isSubmitting: boolean;
  error: string | null;
  toggleItem: (itemId: string) => void;
  submitResult: (closingNote?: string) => Promise<ChecklistResult | null>;
  assignToPersonnel: (resultId: string, personnelIds: string[]) => Promise<boolean>;
  reset: () => void;
}

export function useChecklistExecution(
  checklist: Checklist | null
): UseChecklistExecutionReturn {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();
  const supabase = createClient();

  // Set item comment
  const setItemComment = (itemId: string, comment: string) => {
    setItemComments((prev) => ({
      ...prev,
      [itemId]: comment,
    }));
  };

  // Calculate score in real-time
  const score = useMemo(() => {
    if (!checklist || checklist.items.length === 0) return 0;
    return (completedItems.length / checklist.items.length) * 5;
  }, [completedItems, checklist]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!checklist || checklist.items.length === 0) return 0;
    return (completedItems.length / checklist.items.length) * 100;
  }, [completedItems, checklist]);

  // Toggle item completion
  const toggleItem = (itemId: string) => {
    setCompletedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Submit checklist result
  const submitResult = async (closingNote?: string): Promise<ChecklistResult | null> => {
    if (!checklist || !user || !profile?.organization_id) {
      setError('Missing required data');
      return null;
    }

    if (completedItems.length === 0) {
      setError('En az 1 madde tamamlanmalıdır');
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const resultData = {
        checklist_id: checklist.id,
        organization_id: profile.organization_id,
        completed_by: user.id,
        checklist_snapshot: checklist,
        completed_items: completedItems,
        total_items: checklist.items.length,
        score: parseFloat(score.toFixed(2)),
        closing_note: closingNote?.trim() || null,
        item_comments: itemComments,
      };

      const { data: result, error: submitError } = await supabase
        .from('checklist_results')
        .insert(resultData)
        .select()
        .single();

      if (submitError) throw submitError;

      return result;
    } catch (err) {
      console.error('Error submitting checklist result:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit result');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };


  // Assign result to personnel
  const assignToPersonnel = async (
    resultId: string,
    personnelIds: string[]
  ): Promise<boolean> => {
    if (!user || !profile || personnelIds.length === 0) {
      setError('Missing required data');
      return false;
    }

    try {
      setError(null);

      const assignments = personnelIds.map((personnelId) => ({
        checklist_result_id: resultId,
        personnel_id: personnelId,
        assigned_by: user.id,
      }));

      const { error: assignError } = await supabase
        .from('checklist_assignments')
        .insert(assignments);

      if (assignError) throw assignError;

      // Get personnel metadata to find their user_id for notifications
      const { data: personnelData } = await supabase
        .from('personnel')
        .select('id, name, metadata')
        .in('id', personnelIds);

      // Fetch owners of the organization to notify them
      const { data: owners } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'owner');

      // Create notifications for linked users and owners
      if (personnelData && checklist && profile?.organization_id) {
        const notifications = personnelData
          .filter((p: any) => p.metadata && p.metadata.user_id)
          .map((p: any) => ({
            user_id: p.metadata.user_id,
            organization_id: profile.organization_id,
            type: 'checklist_assigned',
            title: 'Yeni Checklist Atandı',
            message: `Size "${checklist.title}" checklist'i atandı.`,
            link: `/personnel/${p.id}?tab=checklists`,
          }));

        // Add notifications for the organization owners
        if (owners && owners.length > 0) {
          const managerName = profile ? `${profile.name} ${profile.surname}` : 'Bir yönetici';
          
          owners.forEach((owner) => {
            // Don't notify the owner if they are the one who did the action
            if (owner.id === user.id) return;

            personnelData.forEach((p: any) => {
              notifications.push({
                user_id: owner.id,
                organization_id: profile.organization_id,
                type: 'checklist_assigned',
                title: 'Checklist Değerlendirmesi Tamamlandı',
                message: `${managerName}, ${p.name} için "${checklist.title}" değerlendirmesini tamamladı.`,
                link: `/personnel/${p.id}?tab=checklists`,
              });
            });
          });
        }

        if (notifications.length > 0) {
          const { error: notifyError } = await supabase
            .from('notifications')
            .insert(notifications);
            
          if (notifyError) {
            console.error('Error creating checklist notifications:', notifyError);
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error assigning to personnel:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign to personnel');
      return false;
    }
  };

  // Reset state
  const reset = () => {
    setCompletedItems([]);
    setItemComments({});
    setError(null);
  };

  // Reset when checklist changes
  useEffect(() => {
    reset();
  }, [checklist?.id]);

  return {
    completedItems,
    itemComments,
    setItemComment,
    score,
    progress,
    isSubmitting,
    error,
    toggleItem,
    submitResult,
    assignToPersonnel,
    reset,
  };
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Checklist, ChecklistResult } from '@/lib/types';

interface UseChecklistExecutionReturn {
  completedItems: string[];
  score: number;
  progress: number;
  isSubmitting: boolean;
  error: string | null;
  toggleItem: (itemId: string) => void;
  submitResult: () => Promise<ChecklistResult | null>;
  assignToPersonnel: (resultId: string, personnelIds: string[]) => Promise<boolean>;
  reset: () => void;
}

export function useChecklistExecution(
  checklist: Checklist | null
): UseChecklistExecutionReturn {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();
  const supabase = createClient();

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
  const submitResult = async (): Promise<ChecklistResult | null> => {
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
    if (!user || personnelIds.length === 0) {
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
    setError(null);
  };

  // Reset when checklist changes
  useEffect(() => {
    reset();
  }, [checklist?.id]);

  return {
    completedItems,
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

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChecklistResultWithDetails } from '@/lib/types';

interface UseChecklistResultsReturn {
  results: ChecklistResultWithDetails[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RESULTS_PER_PAGE = 10;

export function useChecklistResults(personnelId: string): UseChecklistResultsReturn {
  const [results, setResults] = useState<ChecklistResultWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const supabase = createClient();

  // Fetch results for personnel
  const fetchResults = async (pageNum: number, append: boolean = false) => {
    if (!personnelId) {
      setIsLoading(false);
      return;
    }

    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch assignments with result details
      const { data: assignments, error: fetchError } = await supabase
        .from('checklist_assignments')
        .select(`
          id,
          assigned_at,
          checklist_result:checklist_results (
            id,
            checklist_id,
            organization_id,
            completed_by,
            checklist_snapshot,
            completed_items,
            total_items,
            score,
            completed_at,
            created_at
          )
        `)
        .eq('personnel_id', personnelId)
        .order('assigned_at', { ascending: false })
        .range(pageNum * RESULTS_PER_PAGE, (pageNum + 1) * RESULTS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      // Fetch completed_by names
      const resultIds = assignments
        ?.map((a: any) => a.checklist_result?.completed_by)
        .filter(Boolean) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, surname')
        .in('id', resultIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, `${p.name} ${p.surname}`]) || []
      );

      // Transform data
      const transformedResults: ChecklistResultWithDetails[] = assignments
        ?.filter((a: any) => a.checklist_result)
        .map((a: any) => ({
          ...a.checklist_result,
          completed_by_name: profileMap.get(a.checklist_result.completed_by) || 'Unknown',
          assigned_to: [
            {
              personnel_id: personnelId,
              personnel_name: '', // Will be filled if needed
            },
          ],
        })) || [];

      if (append) {
        setResults((prev) => [...prev, ...transformedResults]);
      } else {
        setResults(transformedResults);
      }

      setHasMore(transformedResults.length === RESULTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching checklist results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };


  // Initial fetch
  useEffect(() => {
    setPage(0);
    fetchResults(0, false);
  }, [personnelId]);

  // Real-time subscription for new assignments
  useEffect(() => {
    if (!personnelId) return;

    const channel = supabase
      .channel('checklist-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checklist_assignments',
          filter: `personnel_id=eq.${personnelId}`,
        },
        async (payload) => {
          // Fetch the full result with details
          const { data: assignment } = await supabase
            .from('checklist_assignments')
            .select(`
              id,
              assigned_at,
              checklist_result:checklist_results (
                id,
                checklist_id,
                organization_id,
                completed_by,
                checklist_snapshot,
                completed_items,
                total_items,
                score,
                completed_at,
                created_at
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (assignment && (assignment as any).checklist_result) {
            // Fetch completed_by name
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, surname')
              .eq('id', (assignment as any).checklist_result.completed_by)
              .single();

            const newResult: ChecklistResultWithDetails = {
              ...(assignment as any).checklist_result,
              completed_by_name: profile
                ? `${profile.name} ${profile.surname}`
                : 'Unknown',
              assigned_to: [
                {
                  personnel_id: personnelId,
                  personnel_name: '',
                },
              ],
            };

            setResults((prev) => [newResult, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [personnelId]);

  // Load more results
  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchResults(nextPage, true);
  };

  // Refresh results
  const refresh = async () => {
    setPage(0);
    await fetchResults(0, false);
  };

  return {
    results,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

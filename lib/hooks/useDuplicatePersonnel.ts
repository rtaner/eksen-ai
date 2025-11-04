import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PersonnelRecord {
  id: string;
  name: string;
  surname: string;
  user_id: string | null;
  email: string | null;
  created_at: string;
  notes_count: number;
  tasks_count: number;
}

interface DuplicatePair {
  id: string;
  record1: PersonnelRecord;
  record2: PersonnelRecord;
  suggested_primary: string;
}

export function useDuplicatePersonnel() {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const detectDuplicates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/merge-personnel?action=detect`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Duplicate detection failed');
      }

      const result = await response.json();
      console.log('Duplicates detected:', result);
      setDuplicates(result.duplicates || []);
    } catch (err: any) {
      console.error('Error detecting duplicates:', err);
      setError(err.message || 'Duplicate kayıtlar tespit edilirken hata oluştu');
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const mergePersonnel = async (primaryId: string, secondaryId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/merge-personnel?action=merge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ primaryId, secondaryId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Remove merged duplicate from list
      setDuplicates(prev => prev.filter(d => d.id !== `${primaryId}_${secondaryId}` && d.id !== `${secondaryId}_${primaryId}`));
      
      return true;
    } catch (err: any) {
      console.error('Error merging personnel:', err);
      setError(err.message || 'Kayıtlar birleştirilirken hata oluştu');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissDuplicate = (duplicateId: string) => {
    setDuplicates(prev => prev.filter(d => d.id !== duplicateId));
  };

  return {
    duplicates,
    loading,
    error,
    detectDuplicates,
    mergePersonnel,
    dismissDuplicate,
  };
}

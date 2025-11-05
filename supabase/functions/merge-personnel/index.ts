import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'detect') {
      // Only check personnel table for duplicates
      const { data: personnel, error: personnelError } = await supabaseClient
        .from('personnel')
        .select('id, name, metadata, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (personnelError) throw personnelError;

      // Get all personnel IDs for count queries
      const personnelIds = (personnel || []).map(p => p.id);

      // Get notes counts for all personnel
      const { data: notesData } = await supabaseClient
        .from('notes')
        .select('personnel_id')
        .in('personnel_id', personnelIds);

      // Get tasks counts for all personnel
      const { data: tasksData } = await supabaseClient
        .from('tasks')
        .select('personnel_id')
        .in('personnel_id', personnelIds);

      // Create count maps
      const notesCounts = new Map();
      const tasksCounts = new Map();

      (notesData || []).forEach(note => {
        notesCounts.set(note.personnel_id, (notesCounts.get(note.personnel_id) || 0) + 1);
      });

      (tasksData || []).forEach(task => {
        tasksCounts.set(task.personnel_id, (tasksCounts.get(task.personnel_id) || 0) + 1);
      });

      const duplicates: any[] = [];
      const seen = new Map();

      // Identify duplicates by name (case-insensitive)
      for (const person of personnel || []) {
        const normalizedName = person.name.toLowerCase().trim();
        const userId = person.metadata?.user_id || null;
        
        if (seen.has(normalizedName)) {
          const existing = seen.get(normalizedName);
          const existingUserId = existing.metadata?.user_id || null;
          
          // Skip if both records have the same user_id (same person, not duplicate)
          if (userId && existingUserId && userId === existingUserId) {
            continue;
          }
          
          // This is a real duplicate - either:
          // 1. Both have different user_ids (different people, coincidence)
          // 2. One has user_id, other doesn't (manual + member)
          // 3. Both don't have user_id (two manual entries)
          
          // Determine suggested primary: prefer the one with user_id
          let suggestedPrimary = existing.id;
          if (!existingUserId && userId) {
            suggestedPrimary = person.id;
          }
          
          duplicates.push({
            id: `${existing.id}_${person.id}`,
            record1: {
              id: existing.id,
              name: existing.name,
              surname: '',
              user_id: existingUserId,
              created_at: existing.created_at,
              notes_count: notesCounts.get(existing.id) || 0,
              tasks_count: tasksCounts.get(existing.id) || 0,
            },
            record2: {
              id: person.id,
              name: person.name,
              surname: '',
              user_id: userId,
              created_at: person.created_at,
              notes_count: notesCounts.get(person.id) || 0,
              tasks_count: tasksCounts.get(person.id) || 0,
            },
            suggested_primary: suggestedPrimary,
          });
        } else {
          seen.set(normalizedName, person);
        }
      }

      return new Response(
        JSON.stringify({ duplicates }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'merge') {
      // Merge personnel records
      const { primaryId, secondaryId } = await req.json();

      if (!primaryId || !secondaryId) {
        throw new Error('Missing primaryId or secondaryId');
      }

      // Check if records exist in personnel table
      const { data: personnelRecords } = await supabaseClient
        .from('personnel')
        .select('id, organization_id')
        .in('id', [primaryId, secondaryId]);

      if (!personnelRecords || personnelRecords.length !== 2) {
        throw new Error('Personnel records not found');
      }

      if (personnelRecords.some(r => r.organization_id !== profile.organization_id)) {
        throw new Error('Records do not belong to your organization');
      }

      // Move notes
      const { error: notesError } = await supabaseClient
        .from('notes')
        .update({ personnel_id: primaryId })
        .eq('personnel_id', secondaryId);

      if (notesError) throw notesError;

      // Move tasks
      const { error: tasksError } = await supabaseClient
        .from('tasks')
        .update({ personnel_id: primaryId })
        .eq('personnel_id', secondaryId);

      if (tasksError) throw tasksError;

      // Update AI analyses - get analyses that contain secondaryId
      const { data: analyses } = await supabaseClient
        .from('ai_analyses')
        .select('id, personnel_ids')
        .contains('personnel_ids', [secondaryId]);

      // Update each analysis to replace secondaryId with primaryId
      if (analyses && analyses.length > 0) {
        for (const analysis of analyses) {
          const updatedIds = analysis.personnel_ids.map((id: string) => 
            id === secondaryId ? primaryId : id
          );
          
          await supabaseClient
            .from('ai_analyses')
            .update({ personnel_ids: updatedIds })
            .eq('id', analysis.id);
        }
      }

      // Delete secondary record from personnel table
      const { error: deleteError } = await supabaseClient
        .from('personnel')
        .delete()
        .eq('id', secondaryId)
        .eq('organization_id', profile.organization_id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Failed to delete secondary record: ${deleteError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Personnel records merged successfully',
          primaryId,
          secondaryId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

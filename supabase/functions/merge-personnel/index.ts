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
      // Detect duplicates
      const { data: personnel, error: fetchError } = await supabaseClient
        .from('personnel')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const duplicates: any[] = [];
      const seen = new Map();

      for (const person of personnel || []) {
        // Use only name for matching (personnel table doesn't have surname)
        const key = person.name.toLowerCase().trim();
        
        if (seen.has(key)) {
          const existing = seen.get(key);
          
          // Count related data
          const [notesCount1, tasksCount1, notesCount2, tasksCount2] = await Promise.all([
            supabaseClient.from('notes').select('id', { count: 'exact', head: true }).eq('personnel_id', existing.id),
            supabaseClient.from('tasks').select('id', { count: 'exact', head: true }).eq('personnel_id', existing.id),
            supabaseClient.from('notes').select('id', { count: 'exact', head: true }).eq('personnel_id', person.id),
            supabaseClient.from('tasks').select('id', { count: 'exact', head: true }).eq('personnel_id', person.id),
          ]);

          duplicates.push({
            id: `${existing.id}_${person.id}`,
            record1: {
              ...existing,
              notes_count: notesCount1.count || 0,
              tasks_count: tasksCount1.count || 0,
            },
            record2: {
              ...person,
              notes_count: notesCount2.count || 0,
              tasks_count: tasksCount2.count || 0,
            },
            suggested_primary: person.user_id ? person.id : existing.id,
          });
        } else {
          seen.set(key, person);
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

      // Verify both records belong to the organization
      const { data: records } = await supabaseClient
        .from('personnel')
        .select('id, organization_id')
        .in('id', [primaryId, secondaryId]);

      if (!records || records.length !== 2) {
        throw new Error('Personnel records not found');
      }

      if (records.some(r => r.organization_id !== profile.organization_id)) {
        throw new Error('Personnel records do not belong to your organization');
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

      // Update AI analyses
      const { error: analysesError } = await supabaseClient
        .from('ai_analyses')
        .update({ 
          personnel_ids: supabaseClient.rpc('array_replace', {
            arr: supabaseClient.raw('personnel_ids'),
            old_val: secondaryId,
            new_val: primaryId
          })
        })
        .contains('personnel_ids', [secondaryId]);

      // Delete secondary record
      const { error: deleteError } = await supabaseClient
        .from('personnel')
        .delete()
        .eq('id', secondaryId);

      if (deleteError) throw deleteError;

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

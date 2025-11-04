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
      // Detect duplicates in profiles (users with accounts)
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, name, surname, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      const duplicates: any[] = [];
      const seen = new Map();

      // First pass: identify duplicates
      for (const person of profiles || []) {
        const key = `${person.name.toLowerCase().trim()}_${person.surname.toLowerCase().trim()}`;
        
        if (seen.has(key)) {
          const existing = seen.get(key);
          duplicates.push({
            id: `${existing.id}_${person.id}`,
            record1: {
              id: existing.id,
              name: existing.name,
              surname: existing.surname,
              created_at: existing.created_at,
              notes_count: 0,
              tasks_count: 0,
            },
            record2: {
              id: person.id,
              name: person.name,
              surname: person.surname,
              created_at: person.created_at,
              notes_count: 0,
              tasks_count: 0,
            },
            suggested_primary: existing.id, // Default to older record
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
        .from('profiles')
        .select('id, organization_id')
        .in('id', [primaryId, secondaryId]);

      if (!records || records.length !== 2) {
        throw new Error('Profile records not found');
      }

      if (records.some(r => r.organization_id !== profile.organization_id)) {
        throw new Error('Profile records do not belong to your organization');
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

      // Delete secondary profile (this will cascade delete auth.users via ON DELETE CASCADE)
      const { error: deleteError } = await supabaseClient
        .from('profiles')
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

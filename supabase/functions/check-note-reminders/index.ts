import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate 3 days ago
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    console.log('Checking note reminders...', { todayStr, threeDaysAgoStr });

    // Get all organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('id');

    if (orgsError) throw orgsError;

    let dailyReminderCount = 0;
    let personnelReminderCount = 0;

    for (const org of organizations || []) {
      // Get all owner and manager users in this organization
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, surname')
        .eq('organization_id', org.id)
        .in('role', ['owner', 'manager']);

      if (usersError) {
        console.error(`Error fetching users for org ${org.id}:`, usersError);
        continue;
      }

      if (!users || users.length === 0) continue;

      // Get all personnel in this organization
      const { data: allPersonnel, error: personnelError } = await supabaseAdmin
        .from('personnel')
        .select('id, name')
        .eq('organization_id', org.id);

      if (personnelError) {
        console.error(`Error fetching personnel for org ${org.id}:`, personnelError);
        continue;
      }

      if (!allPersonnel || allPersonnel.length === 0) continue;

      for (const user of users) {
        // Check 1: Did user add any notes today?
        const { data: todayNotes, error: todayNotesError } = await supabaseAdmin
          .from('notes')
          .select('id')
          .eq('author_id', user.id)
          .gte('created_at', todayStr)
          .limit(1);

        if (todayNotesError) {
          console.error(`Error checking today's notes for user ${user.id}:`, todayNotesError);
          continue;
        }

        const hasNotesToday = todayNotes && todayNotes.length > 0;

        // Send daily reminder if no notes today
        if (!hasNotesToday) {
          // Check if already notified today
          const { data: existingDaily } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'note_reminder_daily')
            .gte('created_at', todayStr)
            .limit(1);

          if (!existingDaily || existingDaily.length === 0) {
            await supabaseAdmin.from('notifications').insert({
              user_id: user.id,
              organization_id: org.id,
              type: 'note_reminder_daily',
              title: 'Not Girişi Hatırlatması',
              message: 'Bugün hiç not girişi yapmadınız',
              link: '/personnel',
            });
            dailyReminderCount++;
            console.log(`Sent daily reminder to user ${user.id}`);
          }
        }

        // Check 2: Personnel reminder check (Disabled per request)
        // 3-day personnel note reminders have been disabled.
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${dailyReminderCount} daily reminders and ${personnelReminderCount} personnel reminders.`,
        stats: {
          dailyReminders: dailyReminderCount,
          personnelReminders: personnelReminderCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-note-reminders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

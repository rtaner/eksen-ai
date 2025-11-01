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

        // Check 2: Personnel without notes for 3+ days
        for (const personnel of allPersonnel) {
          // Get last note for this personnel by this user
          const { data: lastNote, error: lastNoteError } = await supabaseAdmin
            .from('notes')
            .select('created_at')
            .eq('author_id', user.id)
            .eq('personnel_id', personnel.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (lastNoteError) {
            console.error(`Error checking notes for personnel ${personnel.id}:`, lastNoteError);
            continue;
          }

          let shouldNotify = false;

          if (!lastNote || lastNote.length === 0) {
            // No notes ever for this personnel - check if personnel is older than 3 days
            const { data: personnelData } = await supabaseAdmin
              .from('personnel')
              .select('created_at')
              .eq('id', personnel.id)
              .single();

            if (personnelData) {
              const personnelCreated = new Date(personnelData.created_at);
              personnelCreated.setHours(0, 0, 0, 0);
              shouldNotify = personnelCreated <= threeDaysAgo;
            }
          } else {
            // Check if last note is older than 3 days
            const lastNoteDate = new Date(lastNote[0].created_at);
            lastNoteDate.setHours(0, 0, 0, 0);
            shouldNotify = lastNoteDate < threeDaysAgo;
          }

          if (shouldNotify) {
            // Check if already notified today for this personnel
            const { data: existingPersonnel } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'note_reminder_personnel')
              .gte('created_at', todayStr)
              .ilike('message', `%${personnel.name}%`)
              .limit(1);

            if (!existingPersonnel || existingPersonnel.length === 0) {
              await supabaseAdmin.from('notifications').insert({
                user_id: user.id,
                organization_id: org.id,
                type: 'note_reminder_personnel',
                title: 'Personel Not Hatırlatması',
                message: `${personnel.name} isimli personel için 3 gündür not girişi yapmıyorsunuz`,
                link: `/personnel/${personnel.id}`,
              });
              personnelReminderCount++;
              console.log(`Sent personnel reminder to user ${user.id} for personnel ${personnel.id}`);
            }
          }
        }
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

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

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log('Checking task deadlines...', { todayStr, yesterdayStr });

    // Get all open tasks with deadlines today or in the past
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        description,
        deadline,
        personnel_id,
        personnel:personnel_id (
          id,
          name,
          organization_id,
          metadata
        )
      `)
      .eq('status', 'open')
      .lte('deadline', todayStr);

    if (tasksError) throw tasksError;

    console.log(`Found ${tasks?.length || 0} tasks with deadlines`);

    let dueCount = 0;
    let overdueCount = 0;

    for (const task of tasks || []) {
      const personnel = task.personnel as any;
      if (!personnel) continue;

      // Determine if task is due today or overdue
      const isDueToday = task.deadline === todayStr;
      const isOverdue = task.deadline < todayStr;

      // Skip if already notified today
      const { data: existingNotifications } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('type', isDueToday ? 'task_due' : 'task_overdue')
        .gte('created_at', todayStr)
        .ilike('message', `%${task.description.substring(0, 20)}%`)
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Already notified for task ${task.id}`);
        continue;
      }

      const notifications = [];

      // For tasks due today: notify only the personnel (if they have a user account)
      if (isDueToday) {
        const personnelUserId = personnel.metadata?.user_id;
        
        if (personnelUserId) {
          notifications.push({
            user_id: personnelUserId,
            organization_id: personnel.organization_id,
            type: 'task_due',
            title: 'Göreviniz Bugün Bitiyor',
            message: task.description.substring(0, 100) + (task.description.length > 100 ? '...' : ''),
            link: `/personnel/${personnel.id}?tab=tasks`,
          });
          console.log(`Task ${task.id} due today - notifying personnel user ${personnelUserId}`);
        } else {
          console.log(`Task ${task.id} due today - personnel ${personnel.id} has no user account, skipping notification`);
        }
      }

      // For overdue tasks: notify all managers and owners
      if (isOverdue) {
        const { data: usersToNotify } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('organization_id', personnel.organization_id)
          .in('role', ['owner', 'manager']);

        if (usersToNotify && usersToNotify.length > 0) {
          usersToNotify.forEach((profile) => {
            notifications.push({
              user_id: profile.id,
              organization_id: personnel.organization_id,
              type: 'task_overdue',
              title: 'Görev Gecikti',
              message: `${personnel.name}: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`,
              link: `/personnel/${personnel.id}?tab=tasks`,
            });
          });
          console.log(`Task ${task.id} overdue - notifying ${usersToNotify.length} managers/owners`);
        } else {
          console.log(`No managers/owners to notify for overdue task ${task.id}`);
        }
      }

      // Insert notifications if any
      if (notifications.length > 0) {
        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error(`Error creating notifications for task ${task.id}:`, notifError);
        } else {
          console.log(`Created ${notifications.length} notifications for task ${task.id}`);
          if (isDueToday) dueCount++;
          if (isOverdue) overdueCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${tasks?.length || 0} tasks. Sent ${dueCount} due notifications and ${overdueCount} overdue notifications.`,
        stats: {
          totalTasks: tasks?.length || 0,
          dueToday: dueCount,
          overdue: overdueCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-task-deadlines:', error);
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

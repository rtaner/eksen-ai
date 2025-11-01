import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    console.log('Creating scheduled task instances...', { todayStr, dayOfWeek, dayOfMonth });

    // Fetch active scheduled tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('scheduled_tasks')
      .select('*')
      .eq('is_active', true);

    if (tasksError) throw tasksError;

    let createdCount = 0;
    let skippedCount = 0;

    for (const task of tasks || []) {
      // Check if should run today
      if (!shouldRunToday(task, dayOfWeek, dayOfMonth)) {
        console.log(`Task ${task.id} not scheduled for today`);
        continue;
      }

      // Check skip dates
      const { data: skipDates } = await supabaseAdmin
        .from('scheduled_task_skip_dates')
        .select('*')
        .eq('scheduled_task_id', task.id)
        .eq('skip_date', todayStr);

      if (skipDates && skipDates.length > 0) {
        console.log(`Task ${task.id} skipped for ${todayStr}`);
        skippedCount++;
        continue;
      }

      // Get assigned personnel
      const assignedPersonnel = await getAssignedPersonnel(supabaseAdmin, task);

      for (const personnel of assignedPersonnel) {
        // Check leave dates
        const { data: leaveDates } = await supabaseAdmin
          .from('scheduled_task_leave_dates')
          .select('*')
          .eq('scheduled_task_id', task.id)
          .eq('personnel_id', personnel.id)
          .eq('leave_date', todayStr);

        let finalPersonnelId = personnel.id;

        if (leaveDates && leaveDates.length > 0) {
          const leaveDate = leaveDates[0];
          if (leaveDate.delegate_personnel_id) {
            finalPersonnelId = leaveDate.delegate_personnel_id;
            console.log(`Using delegate for ${personnel.id}: ${finalPersonnelId}`);
          } else {
            console.log(`Skipping ${personnel.id} - on leave without delegate`);
            skippedCount++;
            continue;
          }
        }

        // Create task instance
        const { error: insertError } = await supabaseAdmin
          .from('tasks')
          .insert({
            scheduled_task_id: task.id,
            personnel_id: finalPersonnelId,
            author_id: task.created_by,
            description: task.description,
            deadline: todayStr,
            status: 'open',
          });

        if (insertError) {
          console.error(`Error creating task for ${finalPersonnelId}:`, insertError);
        } else {
          createdCount++;
          
          // Send notification
          await supabaseAdmin.from('notifications').insert({
            user_id: finalPersonnelId,
            organization_id: task.organization_id,
            type: 'task_assigned',
            title: 'Yeni Görev Atandı',
            message: task.description.substring(0, 100),
            link: `/personnel/${finalPersonnelId}?tab=tasks`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdCount} task instances, skipped ${skippedCount}`,
        stats: { created: createdCount, skipped: skippedCount, totalTasks: tasks?.length || 0 },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function shouldRunToday(task: any, dayOfWeek: number, dayOfMonth: number): boolean {
  switch (task.recurrence_type) {
    case 'daily':
      return true;
    case 'weekly':
      return task.recurrence_config.days?.includes(dayOfWeek) || false;
    case 'monthly':
      return task.recurrence_config.day === dayOfMonth;
    default:
      return false;
  }
}

async function getAssignedPersonnel(supabase: any, task: any): Promise<any[]> {
  if (task.assignment_type === 'specific') {
    const personnelIds = task.assignment_config.personnel_ids || [];
    const { data } = await supabase
      .from('personnel')
      .select('id')
      .in('id', personnelIds);
    return data || [];
  } else if (task.assignment_type === 'role') {
    const role = task.assignment_config.role;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('organization_id', task.organization_id)
      .eq('role', role);
    
    if (!profiles) return [];
    
    // Get personnel records for these users
    const { data: personnel } = await supabase
      .from('personnel')
      .select('id')
      .eq('organization_id', task.organization_id)
      .contains('metadata', { role });
    
    return personnel || [];
  }
  return [];
}

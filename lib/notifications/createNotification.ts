import { createClient } from '@/lib/supabase/client';

export type NotificationType = 
  | 'task_assigned' 
  | 'task_due' 
  | 'task_overdue' 
  | 'note_added' 
  | 'analysis_completed'
  | 'note_reminder_daily'
  | 'note_reminder_personnel';

interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user
 * This should typically be called from server-side code or Edge Functions
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

/**
 * Helper functions for common notification types
 */

export async function notifyTaskAssigned(
  userId: string,
  organizationId: string,
  taskDescription: string,
  personnelId: string
) {
  return createNotification({
    userId,
    organizationId,
    type: 'task_assigned',
    title: 'Yeni Görev Atandı',
    message: taskDescription,
    link: `/personnel/${personnelId}?tab=tasks`,
  });
}

export async function notifyTaskDue(
  userId: string,
  organizationId: string,
  taskDescription: string,
  personnelId: string
) {
  return createNotification({
    userId,
    organizationId,
    type: 'task_due',
    title: 'Görev Bugün Bitiyor',
    message: taskDescription,
    link: `/personnel/${personnelId}?tab=tasks`,
  });
}

export async function notifyTaskOverdue(
  userId: string,
  organizationId: string,
  taskDescription: string,
  personnelId: string
) {
  return createNotification({
    userId,
    organizationId,
    type: 'task_overdue',
    title: 'Görev Gecikti',
    message: taskDescription,
    link: `/personnel/${personnelId}?tab=tasks`,
  });
}

export async function notifyNoteAdded(
  userId: string,
  organizationId: string,
  personnelName: string,
  personnelId: string
) {
  return createNotification({
    userId,
    organizationId,
    type: 'note_added',
    title: 'Yeni Not Eklendi',
    message: `${personnelName} için yeni bir not eklendi`,
    link: `/personnel/${personnelId}`,
  });
}

export async function notifyAnalysisCompleted(
  userId: string,
  organizationId: string,
  personnelName: string,
  analysisType: string,
  analysisId: string
) {
  return createNotification({
    userId,
    organizationId,
    type: 'analysis_completed',
    title: 'AI Analizi Tamamlandı',
    message: `${personnelName} için ${analysisType} analizi tamamlandı`,
    link: `/settings/analyses/${analysisId}`,
  });
}

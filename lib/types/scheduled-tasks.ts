// Scheduled Tasks Types

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';
export type AssignmentType = 'specific' | 'role';
export type UserRole = 'owner' | 'manager' | 'personnel';

// Recurrence Configuration
export type RecurrenceConfig =
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0=Sunday, 1=Monday, ..., 6=Saturday
  | { type: 'monthly'; day: number }; // 1-31

// Assignment Configuration
export type AssignmentConfig =
  | { type: 'specific'; personnel_ids: string[] }
  | { type: 'role'; role: UserRole };

// Main Scheduled Task Interface
export interface ScheduledTask {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig;
  scheduled_time: string; // HH:MM:SS format
  assignment_type: AssignmentType;
  assignment_config: AssignmentConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Leave Date Interface
export interface LeaveDate {
  id: string;
  scheduled_task_id: string;
  personnel_id: string;
  leave_date: string; // YYYY-MM-DD format
  delegate_personnel_id: string | null;
  created_at: string;
}

// Skip Date Interface
export interface SkipDate {
  id: string;
  scheduled_task_id: string;
  skip_date: string; // YYYY-MM-DD format
  created_at: string;
}

// Input Types for Creating/Updating
export interface CreateScheduledTaskInput {
  name: string;
  description: string;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig;
  scheduled_time?: string;
  assignment_type: AssignmentType;
  assignment_config: AssignmentConfig;
}

export interface UpdateScheduledTaskInput {
  name?: string;
  description?: string;
  recurrence_type?: RecurrenceType;
  recurrence_config?: RecurrenceConfig;
  scheduled_time?: string;
  assignment_type?: AssignmentType;
  assignment_config?: AssignmentConfig;
  is_active?: boolean;
}

export interface AddLeaveDateInput {
  scheduled_task_id: string;
  personnel_id: string;
  leave_date: string;
  delegate_personnel_id?: string | null;
}

export interface AddSkipDateInput {
  scheduled_task_id: string;
  skip_date: string;
}

// Helper Types
export interface ScheduledTaskWithDetails extends ScheduledTask {
  leave_dates?: LeaveDate[];
  skip_dates?: SkipDate[];
  assigned_personnel_count?: number;
}

// Day of Week Constants
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazar', short: 'Paz' },
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
] as const;

// Recurrence Type Labels
export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  daily: 'Her Gün',
  weekly: 'Haftalık',
  monthly: 'Aylık',
};

// Helper Functions
export function getRecurrenceDescription(task: ScheduledTask): string {
  switch (task.recurrence_type) {
    case 'daily':
      return 'Her gün';
    case 'weekly': {
      const config = task.recurrence_config as { type: 'weekly'; days: number[] };
      const dayNames = config.days
        .sort((a, b) => a - b)
        .map((day) => DAYS_OF_WEEK[day].short)
        .join(', ');
      return `Her hafta: ${dayNames}`;
    }
    case 'monthly': {
      const config = task.recurrence_config as { type: 'monthly'; day: number };
      return `Her ayın ${config.day}. günü`;
    }
    default:
      return '';
  }
}

export function getAssignmentDescription(task: ScheduledTask): string {
  switch (task.assignment_type) {
    case 'specific': {
      const config = task.assignment_config as { type: 'specific'; personnel_ids: string[] };
      return `${config.personnel_ids.length} personel`;
    }
    case 'role': {
      const config = task.assignment_config as { type: 'role'; role: UserRole };
      const roleLabels: Record<UserRole, string> = {
        owner: 'Tüm Sahipler',
        manager: 'Tüm Yöneticiler',
        personnel: 'Tüm Personel',
      };
      return roleLabels[config.role];
    }
    default:
      return '';
  }
}

export function formatTime(time: string): string {
  // Convert HH:MM:SS to HH:MM
  return time.substring(0, 5);
}

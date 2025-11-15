// Re-export database types
export type { Database, Json } from './database.types';
import type { Role, ResourceType, TaskStatus } from './database.types';

// Custom application types
export interface Organization {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  role: Role;
  name: string;
  surname: string;
  username: string;
  hierarchy_level: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  organization_id: string;
  role: Role;
  resource_type: ResourceType;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Personnel {
  id: string;
  organization_id: string;
  name: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type NoteSentiment = 'positive' | 'negative' | 'neutral';

export interface Note {
  id: string;
  personnel_id: string;
  author_id: string;
  content: string;
  is_voice_note: boolean;
  sentiment: NoteSentiment;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  personnel_id: string;
  author_id?: string; // Optional for backward compatibility
  description: string;
  deadline: string;
  status: TaskStatus;
  star_rating: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  id: string;
  personnel_id: string;
  strengths: string[];
  development_areas: string[];
  raw_response: string | null;
  created_at: string;
}

// Extended types with relations
export interface NoteWithAuthor extends Note {
  author: Profile;
}

export interface TaskWithPersonnel extends Task {
  personnel: Personnel;
}

export interface PersonnelWithStats extends Personnel {
  notes_count: number;
  open_tasks_count: number;
  closed_tasks_count: number;
  average_rating: number | null;
}

// Permission check result
export interface PermissionSet {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
}

export interface UserSession {
  user: AuthUser;
  profile: Profile;
  organization: Organization;
  permissions: Record<ResourceType, PermissionSet>;
}

// Form types
export interface RegisterFormData {
  name: string;
  surname: string;
  username: string;
  password: string;
  inviteCode?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface PersonnelFormData {
  name: string;
  metadata?: Record<string, any>;
}

export interface NoteFormData {
  content: string;
  is_voice_note?: boolean;
}

export interface TaskFormData {
  description: string;
  deadline?: string;
}

export interface TaskCloseData {
  star_rating: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// Export Role, ResourceType, TaskStatus
export type { Role, ResourceType, TaskStatus };

// Export Analysis types
export * from './analyses';

// Export Checklist types
export * from './checklists';

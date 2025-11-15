// Checklist system types

export interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface Checklist {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  items: ChecklistItem[];
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistResult {
  id: string;
  checklist_id: string;
  organization_id: string;
  completed_by: string;
  checklist_snapshot: Checklist;
  completed_items: string[]; // Array of item IDs
  total_items: number;
  score: number; // 0.00 to 5.00
  completed_at: string;
  created_at: string;
}

export interface ChecklistAssignment {
  id: string;
  checklist_result_id: string;
  personnel_id: string;
  assigned_by: string;
  assigned_at: string;
  created_at: string;
}

// Extended types with relations
export interface ChecklistResultWithDetails extends ChecklistResult {
  completed_by_name: string;
  assigned_to: Array<{
    personnel_id: string;
    personnel_name: string;
  }>;
}

// Form data types
export interface ChecklistFormData {
  title: string;
  description?: string;
  items: ChecklistItem[];
}

export interface ChecklistExecutionData {
  checklist_id: string;
  completed_items: string[];
  score: number;
}

export interface ChecklistAssignmentData {
  checklist_result_id: string;
  personnel_ids: string[];
}

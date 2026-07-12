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
  closing_note: string | null; // Optional comment when completing checklist
  item_comments?: Record<string, string> | null; // Optional comments for individual items
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

export interface ChecklistAnalysis {
  id: string;
  checklist_id: string;
  organization_id: string;
  created_by: string;
  date_range_start: string;
  date_range_end: string;
  stats: {
    totalCount: number;
    averageScore: number;
    itemStats: Array<{
      id: string;
      text: string;
      order: number;
      failCount: number;
      failRate: number;
      successRate: number;
    }>;
    personnelStats: Array<{
      name: string;
      averageScore: number;
      runsCount: number;
      completionRate: number;
    }>;
  };
  analysis: string;
  created_at: string;
  profiles?: {
    name: string;
    surname: string;
  } | null;
}

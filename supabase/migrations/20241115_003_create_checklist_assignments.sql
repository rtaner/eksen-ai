-- Create checklist_assignments table for assigning results to personnel
CREATE TABLE IF NOT EXISTS checklist_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_result_id UUID NOT NULL REFERENCES checklist_results(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate assignments
  CONSTRAINT checklist_assignments_unique UNIQUE(checklist_result_id, personnel_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_personnel ON checklist_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_result ON checklist_assignments(checklist_result_id);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_assigned_by ON checklist_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_assigned_at ON checklist_assignments(assigned_at DESC);

-- Add comment
COMMENT ON TABLE checklist_assignments IS 'Links checklist results to personnel for tracking';

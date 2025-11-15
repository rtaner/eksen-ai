-- Create checklist_results table for completed checklists
CREATE TABLE IF NOT EXISTS checklist_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checklist_snapshot JSONB NOT NULL,
  completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INTEGER NOT NULL,
  score DECIMAL(3,2) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT checklist_results_score_range CHECK (score >= 0.00 AND score <= 5.00),
  CONSTRAINT checklist_results_total_items_positive CHECK (total_items > 0),
  CONSTRAINT checklist_results_completed_items_is_array CHECK (jsonb_typeof(completed_items) = 'array'),
  CONSTRAINT checklist_results_snapshot_is_object CHECK (jsonb_typeof(checklist_snapshot) = 'object')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_results_org ON checklist_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_results_checklist ON checklist_results(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_results_completed_by ON checklist_results(completed_by);
CREATE INDEX IF NOT EXISTS idx_checklist_results_completed_at ON checklist_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_results_score ON checklist_results(score);

-- Add comment
COMMENT ON TABLE checklist_results IS 'Stores completed checklist results with scores';

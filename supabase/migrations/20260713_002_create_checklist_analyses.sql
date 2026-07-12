-- Create checklist_analyses table
CREATE TABLE IF NOT EXISTS checklist_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_analyses_checklist ON checklist_analyses(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_analyses_org ON checklist_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_analyses_created_at ON checklist_analyses(created_at DESC);

-- Enable RLS
ALTER TABLE checklist_analyses ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view analyses in their organization
CREATE POLICY "Users can view checklist analyses in their organization"
ON checklist_analyses FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT policy: Owners and managers can create checklist analyses
CREATE POLICY "Owners and managers can create checklist analyses"
ON checklist_analyses FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
  AND created_by = auth.uid()
);

-- DELETE policy: Only owners and managers can delete checklist analyses
CREATE POLICY "Owners and managers can delete checklist analyses"
ON checklist_analyses FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')
  )
);

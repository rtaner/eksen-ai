-- Create store_analyses table
CREATE TABLE store_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'error')) DEFAULT 'processing',
  dashboard_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster querying
CREATE INDEX idx_store_analyses_org ON store_analyses(organization_id);
CREATE INDEX idx_store_analyses_created ON store_analyses(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_store_analyses_updated_at
  BEFORE UPDATE ON store_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE store_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for store_analyses
-- Managers and Owners can view
CREATE POLICY "Users can view their organization's store analyses"
  ON store_analyses
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Only Owners can insert
CREATE POLICY "Only owners can insert store analyses"
  ON store_analyses
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only Owners can update
CREATE POLICY "Only owners can update store analyses"
  ON store_analyses
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only Owners can delete
CREATE POLICY "Only owners can delete store analyses"
  ON store_analyses
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

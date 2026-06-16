-- Create ai_analysis_jobs table
CREATE TABLE ai_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'extracting', 'analyzing', 'completed', 'error')) DEFAULT 'pending',
  error_message TEXT,
  extracted_data JSONB,
  final_insights JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster querying
CREATE INDEX idx_ai_analysis_jobs_org ON ai_analysis_jobs(organization_id);
CREATE INDEX idx_ai_analysis_jobs_created ON ai_analysis_jobs(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_ai_analysis_jobs_updated_at
  BEFORE UPDATE ON ai_analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_analysis_jobs
-- Managers and Owners can view
CREATE POLICY "Users can view their organization's ai_analysis_jobs"
  ON ai_analysis_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Only Owners can insert
CREATE POLICY "Only owners can insert ai_analysis_jobs"
  ON ai_analysis_jobs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Only Owners can update
CREATE POLICY "Only owners can update ai_analysis_jobs"
  ON ai_analysis_jobs
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
CREATE POLICY "Only owners can delete ai_analysis_jobs"
  ON ai_analysis_jobs
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Enable Realtime for ai_analysis_jobs so the client can listen to status changes
ALTER PUBLICATION supabase_realtime ADD TABLE ai_analysis_jobs;

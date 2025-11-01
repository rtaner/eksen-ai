-- Update ai_analyses table structure for new analysis system

-- Drop old table if exists (development only - production'da dikkatli ol!)
DROP TABLE IF EXISTS ai_analyses CASCADE;

-- Create new ai_analyses table with updated structure
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('yetkinlik', 'egilim', 'butunlesik')),
  
  -- Analysis parameters
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  
  -- Analysis results (flexible JSON structure)
  result JSONB NOT NULL,
  raw_response TEXT,
  
  -- Meta information
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add 'analyses' to permissions resource_type
ALTER TABLE permissions 
  DROP CONSTRAINT IF EXISTS permissions_resource_type_check;

ALTER TABLE permissions 
  ADD CONSTRAINT permissions_resource_type_check 
  CHECK (resource_type IN ('notes', 'tasks', 'personnel', 'analyses'));

-- Create indexes for performance
CREATE INDEX idx_analyses_personnel ON ai_analyses(personnel_id);
CREATE INDEX idx_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_analyses_created_by ON ai_analyses(created_by);
CREATE INDEX idx_analyses_created_at ON ai_analyses(created_at DESC);
CREATE INDEX idx_analyses_date_range ON ai_analyses(date_range_start, date_range_end);

-- Add comments
COMMENT ON TABLE ai_analyses IS 'Stores AI-generated personnel analyses';
COMMENT ON COLUMN ai_analyses.analysis_type IS 'Type of analysis: yetkinlik, egilim, or butunlesik';
COMMENT ON COLUMN ai_analyses.result IS 'Analysis result in JSON format (structure varies by type)';
COMMENT ON COLUMN ai_analyses.raw_response IS 'Raw response from Gemini API for debugging';

-- RLS Policies for ai_analyses

-- Enable RLS
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owners can manage all analyses"
  ON ai_analyses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN personnel per ON per.organization_id = p.organization_id
      WHERE p.id = auth.uid()
      AND p.role = 'owner'
      AND per.id = ai_analyses.personnel_id
    )
  );

-- Managers can view if they have permission
CREATE POLICY "Managers can view analyses with permission"
  ON ai_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN personnel per ON per.organization_id = p.organization_id
      JOIN permissions perm ON perm.organization_id = p.organization_id 
        AND perm.role = p.role 
        AND perm.resource_type = 'analyses'
      WHERE p.id = auth.uid()
      AND p.role = 'manager'
      AND per.id = ai_analyses.personnel_id
      AND perm.can_view = true
    )
  );

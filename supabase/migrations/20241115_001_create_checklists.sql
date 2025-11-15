-- Create checklists table for checklist templates
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT checklists_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT checklists_items_is_array CHECK (jsonb_typeof(items) = 'array')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklists_org ON checklists(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklists_active ON checklists(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checklists_created_at ON checklists(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE checklists IS 'Stores reusable checklist templates for evaluations';

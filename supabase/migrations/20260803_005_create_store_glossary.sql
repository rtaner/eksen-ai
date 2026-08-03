-- Migration: Create store_glossary table for store-specific jargon and terms

CREATE TABLE IF NOT EXISTS store_glossary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  term VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_store_glossary_org ON store_glossary(organization_id);

-- RLS Policies
ALTER TABLE store_glossary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org glossary" ON store_glossary;
DROP POLICY IF EXISTS "Owners and Managers can insert glossary" ON store_glossary;
DROP POLICY IF EXISTS "Owners and Managers can update glossary" ON store_glossary;
DROP POLICY IF EXISTS "Owners and Managers can delete glossary" ON store_glossary;

CREATE POLICY "Users can view org glossary"
  ON store_glossary FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Owners and Managers can insert glossary"
  ON store_glossary FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

CREATE POLICY "Owners and Managers can update glossary"
  ON store_glossary FOR UPDATE
  USING (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

CREATE POLICY "Owners and Managers can delete glossary"
  ON store_glossary FOR DELETE
  USING (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

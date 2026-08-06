-- Migration: Create one_on_one_meetings table and set RLS permissions
-- Ensures meeting records are visible ONLY to Owner and Manager roles. Personnel CANNOT view meeting records.

CREATE TABLE IF NOT EXISTS one_on_one_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE NOT NULL,
  manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 10),
  answers JSONB DEFAULT '{}',
  personnel_commitment TEXT,
  manager_commitment TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('draft', 'completed')) DEFAULT 'completed',
  meeting_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_org ON one_on_one_meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_personnel ON one_on_one_meetings(personnel_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_manager ON one_on_one_meetings(manager_id);

-- Enable RLS
ALTER TABLE one_on_one_meetings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Owner and Manager can view meetings" ON one_on_one_meetings;
DROP POLICY IF EXISTS "Owner and Manager can insert meetings" ON one_on_one_meetings;
DROP POLICY IF EXISTS "Owner and Manager can update meetings" ON one_on_one_meetings;
DROP POLICY IF EXISTS "Owner and Manager can delete meetings" ON one_on_one_meetings;

-- SELECT policy: ONLY Owner and Manager roles in the organization can view meeting records
CREATE POLICY "Owner and Manager can view meetings"
  ON one_on_one_meetings FOR SELECT
  USING (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

-- INSERT policy: ONLY Owner and Manager roles can create meeting records
CREATE POLICY "Owner and Manager can insert meetings"
  ON one_on_one_meetings FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'manager')
    AND manager_id = auth.uid()
  );

-- UPDATE policy: ONLY Owner and Manager roles can update meeting records
CREATE POLICY "Owner and Manager can update meetings"
  ON one_on_one_meetings FOR UPDATE
  USING (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

-- DELETE policy: ONLY Owner and Manager roles can delete meeting records
CREATE POLICY "Owner and Manager can delete meetings"
  ON one_on_one_meetings FOR DELETE
  USING (
    get_user_role() IN ('owner', 'manager')
    AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
  );

-- Trigger for updated_at
CREATE TRIGGER update_one_on_one_meetings_updated_at
  BEFORE UPDATE ON one_on_one_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Create groups, group_members tables and add group_id to notes & tasks

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create group_members table (Many-to-Many between personnel and groups)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  personnel_id UUID REFERENCES personnel(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, personnel_id)
);

-- 3. Add group_id to notes table and make personnel_id nullable
ALTER TABLE notes ALTER COLUMN personnel_id DROP NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 4. Add group_id to tasks table and make personnel_id nullable
ALTER TABLE tasks ALTER COLUMN personnel_id DROP NOT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_org ON groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_personnel ON group_members(personnel_id);
CREATE INDEX IF NOT EXISTS idx_notes_group ON notes(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id);

-- 6. Trigger for updated_at on groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add is_store_level to notes and tasks tables and organization_id to notes/tasks

-- 1. Add is_store_level and organization_id columns to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_store_level BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Add is_store_level and organization_id columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_store_level BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Create indexes for store-level queries
CREATE INDEX IF NOT EXISTS idx_notes_store_level ON notes(is_store_level);
CREATE INDEX IF NOT EXISTS idx_tasks_store_level ON tasks(is_store_level);
CREATE INDEX IF NOT EXISTS idx_notes_organization ON notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);

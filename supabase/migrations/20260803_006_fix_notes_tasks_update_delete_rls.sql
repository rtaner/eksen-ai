-- Migration: Fix UPDATE and DELETE RLS policies for notes and tasks
-- Ensures that store-level and group-level items can be updated, deleted, and closed without RLS restriction errors.

-- 1. NOTES UPDATE & DELETE POLICIES
DROP POLICY IF EXISTS "Authorized users can update notes" ON notes;
DROP POLICY IF EXISTS "Notes update policy" ON notes;

CREATE POLICY "Notes update policy"
  ON notes FOR UPDATE
  USING (
    (get_user_role() = 'owner' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
    OR (get_user_role() = 'manager' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR (is_store_level = TRUE)
    OR (group_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Authorized users can delete notes" ON notes;
DROP POLICY IF EXISTS "Notes delete policy" ON notes;

CREATE POLICY "Notes delete policy"
  ON notes FOR DELETE
  USING (
    (get_user_role() = 'owner' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
    OR (get_user_role() = 'manager' AND author_id = auth.uid())
    OR (is_store_level = TRUE AND get_user_role() IN ('owner', 'manager'))
    OR (group_id IS NOT NULL AND get_user_role() IN ('owner', 'manager'))
  );

-- 2. TASKS UPDATE & DELETE POLICIES
DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Tasks update policy" ON tasks;

CREATE POLICY "Tasks update policy"
  ON tasks FOR UPDATE
  USING (
    (get_user_role() IN ('owner', 'manager') AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
    OR (personnel_id = auth.uid() OR personnel_id IN (
      SELECT id FROM personnel WHERE metadata->>'user_id' = auth.uid()::text
    ))
    OR (is_store_level = TRUE)
    OR (group_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Authorized users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Tasks delete policy" ON tasks;

CREATE POLICY "Tasks delete policy"
  ON tasks FOR DELETE
  USING (
    (get_user_role() IN ('owner', 'manager') AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
    OR (is_store_level = TRUE AND get_user_role() IN ('owner', 'manager'))
    OR (group_id IS NOT NULL AND get_user_role() IN ('owner', 'manager'))
  );

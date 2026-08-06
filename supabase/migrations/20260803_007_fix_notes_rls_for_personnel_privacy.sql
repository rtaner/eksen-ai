-- Migration: Fix notes and tasks RLS visibility policies for personnel & manager privacy
-- 1. Owner sees all notes in organization.
-- 2. Manager and Personnel ONLY see notes they authored (author_id = auth.uid()).
--    They CANNOT see notes written by others or notes written for/about themselves.
-- 3. Personnel can only see tasks assigned to them, group tasks for their groups, store tasks, or tasks authored by them.

-- 1. FIX NOTES SELECT POLICY
DROP POLICY IF EXISTS "Notes visibility role-based" ON notes;
DROP POLICY IF EXISTS "Notes visibility with groups and store" ON notes;
DROP POLICY IF EXISTS "Notes hierarchical visibility" ON notes;
DROP POLICY IF EXISTS "Notes visibility final" ON notes;

CREATE POLICY "Notes visibility role-based"
  ON notes FOR SELECT
  USING (
    -- Owner sees all notes in their organization
    (
      get_user_role() = 'owner' 
      AND (
        organization_id = get_user_organization_id() 
        OR organization_id IS NULL
        OR personnel_id IN (SELECT id FROM personnel WHERE organization_id = get_user_organization_id())
        OR group_id IN (SELECT id FROM groups WHERE organization_id = get_user_organization_id())
      )
    )
    OR
    -- Note Author (Manager, Personnel, etc.) always sees ONLY notes they authored
    (author_id = auth.uid())
  );

-- 2. FIX NOTES UPDATE & DELETE POLICIES
DROP POLICY IF EXISTS "Authorized users can update notes" ON notes;
DROP POLICY IF EXISTS "Notes update policy" ON notes;

CREATE POLICY "Notes update policy"
  ON notes FOR UPDATE
  USING (
    (get_user_role() = 'owner' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authorized users can delete notes" ON notes;
DROP POLICY IF EXISTS "Notes delete policy" ON notes;

CREATE POLICY "Notes delete policy"
  ON notes FOR DELETE
  USING (
    (get_user_role() = 'owner' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR author_id = auth.uid()
  );

-- 3. FIX TASKS SELECT POLICY
DROP POLICY IF EXISTS "Tasks visibility role-based" ON tasks;
DROP POLICY IF EXISTS "Tasks visibility with groups and store" ON tasks;
DROP POLICY IF EXISTS "Tasks hierarchical visibility" ON tasks;

CREATE POLICY "Tasks visibility role-based"
  ON tasks FOR SELECT
  USING (
    -- Owner & Manager have full access to all tasks in organization
    (
      get_user_role() IN ('owner', 'manager') 
      AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
    )
    OR
    -- Store level tasks for the user's organization
    (
      is_store_level = TRUE 
      AND (organization_id = get_user_organization_id() OR organization_id IS NULL)
    )
    OR
    -- Group tasks for groups the personnel belongs to
    (
      group_id IS NOT NULL 
      AND group_id IN (
        SELECT group_id FROM group_members WHERE personnel_id IN (
          SELECT id FROM personnel WHERE metadata->>'user_id' = auth.uid()::text OR id = auth.uid()
        )
      )
    )
    OR
    -- Author of task
    (author_id = auth.uid())
    OR
    -- Personnel directly assigned to task
    (
      personnel_id = auth.uid() 
      OR personnel_id IN (
        SELECT id FROM personnel WHERE metadata->>'user_id' = auth.uid()::text
      )
    )
  );

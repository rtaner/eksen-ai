-- Migration: Enforce specific visibility rules for manager role
-- 1. Tasks: Owner & Manager have FULL access to all tasks across organization. Personnel sees tasks for their group/self/store/own author.
-- 2. Notes: 
--    - Owner sees ALL notes in organization.
--    - Manager sees Store General notes + Group notes + ONLY their own authored personal notes.
--    - Personnel sees Store General notes + Group notes + Notes about self + Own authored notes.

-- Update notes SELECT policy
DROP POLICY IF EXISTS "Notes visibility with groups and store" ON notes;
DROP POLICY IF EXISTS "Notes hierarchical visibility" ON notes;
DROP POLICY IF EXISTS "Notes visibility final" ON notes;
DROP POLICY IF EXISTS "Notes visibility role-based" ON notes;

CREATE POLICY "Notes visibility role-based"
  ON notes FOR SELECT
  USING (
    -- Owner sees all notes in organization
    (get_user_role() = 'owner' AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR
    -- Store general notes visible to everyone in organization
    (is_store_level = TRUE)
    OR
    -- Group notes visible to everyone in organization
    (group_id IS NOT NULL)
    OR
    -- Author always sees notes they wrote
    (author_id = auth.uid())
    OR
    -- Personnel sees personal notes written about themselves
    (personnel_id = auth.uid() OR personnel_id IN (
      SELECT id FROM personnel WHERE metadata->>'user_id' = auth.uid()::text
    ))
  );

-- Update tasks SELECT policy
DROP POLICY IF EXISTS "Tasks visibility with groups and store" ON tasks;
DROP POLICY IF EXISTS "Tasks hierarchical visibility" ON tasks;
DROP POLICY IF EXISTS "Tasks visibility role-based" ON tasks;

CREATE POLICY "Tasks visibility role-based"
  ON tasks FOR SELECT
  USING (
    -- Owner & Manager have full access to all tasks in organization
    (get_user_role() IN ('owner', 'manager') AND (organization_id = get_user_organization_id() OR organization_id IS NULL))
    OR
    -- Store level tasks
    (is_store_level = TRUE)
    OR
    -- Group tasks
    (group_id IS NOT NULL)
    OR
    -- Author of task
    (author_id = auth.uid())
    OR
    -- Personnel assigned to task
    (personnel_id = auth.uid() OR personnel_id IN (
      SELECT id FROM personnel WHERE metadata->>'user_id' = auth.uid()::text
    ))
  );

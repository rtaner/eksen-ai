-- Migration: Fix RLS policies for notes and tasks to allow group_id and is_store_level inserts

-- 1. Fix notes INSERT policy
DROP POLICY IF EXISTS "Authorized users can create notes" ON notes;
DROP POLICY IF EXISTS "Authorized users can create notes hierarchical" ON notes;
DROP POLICY IF EXISTS "Authorized users can create notes fixed" ON notes;

CREATE POLICY "Authorized users can create notes fixed"
  ON notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      -- Individual personnel note
      (personnel_id IS NOT NULL AND personnel_id IN (
        SELECT id FROM personnel WHERE organization_id = get_user_organization_id()
      ))
      OR
      -- Group note
      (group_id IS NOT NULL AND group_id IN (
        SELECT id FROM groups WHERE organization_id = get_user_organization_id()
      ))
      OR
      -- Store general note
      (is_store_level = TRUE)
      OR
      -- Organization bound
      (organization_id IS NOT NULL AND organization_id = get_user_organization_id())
    )
    AND (
      (get_user_role() = 'personnel')
      OR
      has_permission('notes', 'create')
    )
  );

-- 2. Fix notes SELECT policy to allow viewing group and store notes
DROP POLICY IF EXISTS "Notes visibility final" ON notes;
DROP POLICY IF EXISTS "Notes simple visibility" ON notes;
DROP POLICY IF EXISTS "Notes visibility with groups and store" ON notes;

CREATE POLICY "Notes visibility with groups and store"
  ON notes FOR SELECT
  USING (
    author_id = auth.uid()
    OR is_store_level = TRUE
    OR organization_id = get_user_organization_id()
    OR personnel_id IN (SELECT id FROM personnel WHERE organization_id = get_user_organization_id())
    OR group_id IN (SELECT id FROM groups WHERE organization_id = get_user_organization_id())
  );

-- 3. Fix tasks INSERT policy
DROP POLICY IF EXISTS "Authorized users can create tasks hierarchical" ON tasks;
DROP POLICY IF EXISTS "Authorized users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Authorized users can create tasks fixed" ON tasks;

CREATE POLICY "Authorized users can create tasks fixed"
  ON tasks FOR INSERT
  WITH CHECK (
    has_permission('tasks', 'create')
    AND (
      (personnel_id IS NOT NULL AND personnel_id IN (
        SELECT id FROM personnel WHERE organization_id = get_user_organization_id()
      ))
      OR
      (group_id IS NOT NULL AND group_id IN (
        SELECT id FROM groups WHERE organization_id = get_user_organization_id()
      ))
      OR
      (is_store_level = TRUE)
      OR
      (organization_id IS NOT NULL AND organization_id = get_user_organization_id())
    )
  );

-- 4. Fix tasks SELECT policy
DROP POLICY IF EXISTS "Tasks hierarchical visibility" ON tasks;
DROP POLICY IF EXISTS "Tasks visibility with groups and store" ON tasks;

CREATE POLICY "Tasks visibility with groups and store"
  ON tasks FOR SELECT
  USING (
    is_store_level = TRUE
    OR organization_id = get_user_organization_id()
    OR personnel_id IN (SELECT id FROM personnel WHERE organization_id = get_user_organization_id())
    OR group_id IN (SELECT id FROM groups WHERE organization_id = get_user_organization_id())
  );

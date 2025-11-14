-- BACKUP of original tasks RLS policies
-- Created: 2024-11-10
-- Original file: 20241028_002_rls_policies.sql

-- ============================================
-- TASKS POLICIES (ORIGINAL)
-- ============================================

-- Everyone in org can view all tasks
CREATE POLICY "Users can view org tasks"
  ON tasks FOR SELECT
  USING (
    personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Users with permission can create tasks
CREATE POLICY "Authorized users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    has_permission('tasks', 'create')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Users with permission can update tasks (only open tasks)
CREATE POLICY "Authorized users can update tasks"
  ON tasks FOR UPDATE
  USING (
    has_permission('tasks', 'edit')
    AND status = 'open'
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Users with permission can delete tasks
CREATE POLICY "Authorized users can delete tasks"
  ON tasks FOR DELETE
  USING (
    has_permission('tasks', 'delete')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

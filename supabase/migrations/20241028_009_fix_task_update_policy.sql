-- Fix task update policy to allow closing tasks
-- The previous policy only allowed updating open tasks, but we need to update
-- the status from 'open' to 'closed' when closing a task

-- Drop the old policy
DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;

-- Create new policy that allows updating tasks (including closing them)
-- The check is on the OLD row (before update), not the NEW row
CREATE POLICY "Authorized users can update tasks"
  ON tasks FOR UPDATE
  USING (
    has_permission('tasks', 'edit')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    has_permission('tasks', 'edit')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

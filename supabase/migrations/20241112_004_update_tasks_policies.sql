-- Update tasks RLS policies
-- Personnel & Manager: can_view=true shows all tasks, can_view=false shows only tasks assigned to them

-- Drop old tasks SELECT policy
DROP POLICY IF EXISTS "Users can view org tasks" ON tasks;
DROP POLICY IF EXISTS "Tasks hierarchical visibility" ON tasks;

-- Create new tasks SELECT policy
CREATE POLICY "Tasks visibility with permissions"
  ON tasks FOR SELECT
  USING (
    -- Owner sees all tasks in their org
    (
      get_user_role() = 'owner' 
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
    
    OR
    
    -- Personnel with can_view=true sees all tasks in org
    (
      get_user_role() = 'personnel'
      AND has_permission('tasks', 'view')
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
    
    OR
    
    -- Personnel with can_view=false sees only tasks assigned to them
    -- Check both: personnel.id = auth.uid() OR personnel.metadata->>'user_id' = auth.uid()
    (
      get_user_role() = 'personnel'
      AND NOT has_permission('tasks', 'view')
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
        AND (
          id = auth.uid()
          OR
          metadata->>'user_id' = auth.uid()::text
        )
      )
    )
    
    OR
    
    -- Manager with can_view=true sees all tasks in org
    (
      get_user_role() = 'manager'
      AND has_permission('tasks', 'view')
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
    
    OR
    
    -- Manager with can_view=false sees only tasks assigned to them
    -- Check both: personnel.id = auth.uid() OR personnel.metadata->>'user_id' = auth.uid()
    (
      get_user_role() = 'manager'
      AND NOT has_permission('tasks', 'view')
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
        AND (
          id = auth.uid()
          OR
          metadata->>'user_id' = auth.uid()::text
        )
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Tasks visibility with permissions" ON tasks IS 
'Task visibility based on permissions:
- Owner: sees all tasks in org
- Personnel + can_view=true: sees all tasks in org
- Personnel + can_view=false: sees only tasks assigned to them
- Manager + can_view=true: sees all tasks in org
- Manager + can_view=false: sees only tasks assigned to them';

-- INSERT, UPDATE, DELETE policies remain unchanged (already correct)

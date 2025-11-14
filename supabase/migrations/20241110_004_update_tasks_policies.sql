-- Update tasks RLS policies for hierarchical permission system

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view org tasks" ON tasks;

-- Create new hierarchical SELECT policy
CREATE POLICY "Tasks hierarchical visibility"
  ON tasks FOR SELECT
  USING (
    -- Owner sees all tasks in their org
    get_user_role() = 'owner'
    
    OR
    
    -- Manager/Personnel with can_view permission
    (
      get_user_role() IN ('manager', 'personnel')
      AND has_permission('tasks', 'view')
      AND (
        -- See tasks assigned to themselves (ALL tasks, including from upper levels)
        personnel_id = auth.uid()
        OR
        personnel_id IN (
          SELECT id FROM personnel 
          WHERE metadata->>'user_id' = auth.uid()::text
        )
        
        OR
        
        -- Manager sees lower hierarchy tasks
        (
          get_user_role() = 'manager'
          AND author_id IS NOT NULL
          AND get_author_hierarchy_level(author_id) IS NOT NULL
          AND get_user_hierarchy_level() > get_author_hierarchy_level(author_id)
          AND personnel_id IN (
            SELECT id FROM personnel 
            WHERE organization_id = get_user_organization_id()
          )
        )
        
        OR
        
        -- Manager sees same hierarchy tasks
        (
          get_user_role() = 'manager'
          AND author_id IS NOT NULL
          AND get_author_hierarchy_level(author_id) IS NOT NULL
          AND get_user_hierarchy_level() = get_author_hierarchy_level(author_id)
          AND personnel_id IN (
            SELECT id FROM personnel 
            WHERE organization_id = get_user_organization_id()
          )
        )
      )
    )
    
    OR
    
    -- Manager/Personnel WITHOUT can_view permission
    -- Only see tasks they created themselves
    (
      get_user_role() IN ('manager', 'personnel')
      AND NOT has_permission('tasks', 'view')
      AND author_id = auth.uid()
    )
    
    OR
    
    -- Backward compatibility: tasks without author_id
    (
      author_id IS NULL
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Tasks hierarchical visibility" ON tasks IS 
'Hierarchical task visibility: Users see own tasks + lower level tasks + same level tasks (if can_view=true)';

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Authorized users can create tasks" ON tasks;

-- Create new INSERT policy (simplified - hierarchy control in frontend)
CREATE POLICY "Authorized users can create tasks hierarchical"
  ON tasks FOR INSERT
  WITH CHECK (
    has_permission('tasks', 'create')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Authorized users can create tasks hierarchical" ON tasks IS 
'Users with create permission can add tasks to personnel in their organization. Hierarchy filtering done in frontend (Owner not shown in list).';

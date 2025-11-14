-- Update notes RLS policies for hierarchical permission system

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Notes visibility" ON notes;

-- Create new hierarchical SELECT policy
CREATE POLICY "Notes hierarchical visibility"
  ON notes FOR SELECT
  USING (
    -- Owner sees all notes in their org
    get_user_role() = 'owner'
    
    OR
    
    -- Everyone sees their own notes (notes they wrote)
    author_id = auth.uid()
    
    OR
    
    -- Personnel with can_view=true sees notes about themselves
    (
      get_user_role() = 'personnel'
      AND has_permission('notes', 'view')
      AND (
        personnel_id = auth.uid()
        OR
        personnel_id IN (
          SELECT id FROM personnel 
          WHERE metadata->>'user_id' = auth.uid()::text
        )
      )
    )
    
    OR
    
    -- Manager with can_view sees lower hierarchy notes
    (
      get_user_role() = 'manager'
      AND has_permission('notes', 'view')
      AND get_author_hierarchy_level(author_id) IS NOT NULL
      AND get_user_hierarchy_level() > get_author_hierarchy_level(author_id)
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
    
    OR
    
    -- Manager with can_view sees same hierarchy notes
    (
      get_user_role() = 'manager'
      AND has_permission('notes', 'view')
      AND get_author_hierarchy_level(author_id) IS NOT NULL
      AND get_user_hierarchy_level() = get_author_hierarchy_level(author_id)
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Notes hierarchical visibility" ON notes IS 
'Hierarchical note visibility: Users see own notes + lower level notes + same level notes (if can_view=true)';

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Authorized users can create notes" ON notes;

-- Create new INSERT policy (simplified - hierarchy control in frontend)
CREATE POLICY "Authorized users can create notes hierarchical"
  ON notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND has_permission('notes', 'create')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Authorized users can create notes hierarchical" ON notes IS 
'Users with create permission can add notes to personnel in their organization. Hierarchy filtering done in frontend (Owner not shown in list).';

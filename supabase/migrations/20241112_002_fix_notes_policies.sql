-- Fix notes RLS policies
-- Properly handle personnel_id checks for both profile-based and manual personnel

-- Drop all existing notes policies
DROP POLICY IF EXISTS "Notes simple visibility" ON notes;
DROP POLICY IF EXISTS "Notes hierarchical visibility" ON notes;
DROP POLICY IF EXISTS "Notes visibility" ON notes;

-- Create new fixed SELECT policy
CREATE POLICY "Notes visibility fixed"
  ON notes FOR SELECT
  USING (
    -- Owner sees all notes in their org
    (
      get_user_role() = 'owner' 
      AND personnel_id IN (
        SELECT id FROM personnel 
        WHERE organization_id = get_user_organization_id()
      )
    )
    
    OR
    
    -- Everyone sees their own notes (notes they wrote)
    (
      author_id = auth.uid() 
      AND has_permission('notes', 'view')
    )
    
    OR
    
    -- Personnel with can_view=true sees notes about themselves
    -- Check both: personnel.id = auth.uid() OR personnel.metadata->>'user_id' = auth.uid()
    (
      get_user_role() = 'personnel'
      AND has_permission('notes', 'view')
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
    
    -- Manager with can_view=true sees notes about themselves
    -- Check both: personnel.id = auth.uid() OR personnel.metadata->>'user_id' = auth.uid()
    (
      get_user_role() = 'manager'
      AND has_permission('notes', 'view')
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
COMMENT ON POLICY "Notes visibility fixed" ON notes IS 
'Fixed note visibility:
- Owner: sees all notes in org
- Everyone: sees notes they wrote (author_id = auth.uid() + has_permission)
- Personnel + can_view=true: sees notes about themselves (checks both personnel.id and metadata.user_id)
- Manager + can_view=true: sees notes about themselves (checks both personnel.id and metadata.user_id)
- can_view=false: only sees notes they wrote';

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Authorized users can create notes hierarchical" ON notes;
DROP POLICY IF EXISTS "Authorized users can create notes" ON notes;

-- Create INSERT policy (unchanged)
CREATE POLICY "Authorized users can create notes"
  ON notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND has_permission('notes', 'create')
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- UPDATE and DELETE policies remain unchanged (already correct)

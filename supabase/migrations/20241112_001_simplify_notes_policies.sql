-- Simplify notes RLS policies
-- Remove hierarchy system, use simple role-based + personnel_id checks

-- Drop old hierarchical SELECT policy
DROP POLICY IF EXISTS "Notes hierarchical visibility" ON notes;
DROP POLICY IF EXISTS "Notes visibility" ON notes;

-- Create new simplified SELECT policy
CREATE POLICY "Notes simple visibility"
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
      AND personnel_id = auth.uid()
    )
    
    OR
    
    -- Manager with can_view=true sees notes about themselves
    (
      get_user_role() = 'manager'
      AND has_permission('notes', 'view')
      AND personnel_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Notes simple visibility" ON notes IS 
'Simplified note visibility:
- Owner: sees all notes
- Everyone: sees notes they wrote (author_id = auth.uid())
- Personnel + can_view=true: sees notes about themselves (personnel_id = auth.uid())
- Manager + can_view=true: sees notes about themselves (personnel_id = auth.uid())
- can_view=false: only sees notes they wrote';

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Authorized users can create notes hierarchical" ON notes;
DROP POLICY IF EXISTS "Authorized users can create notes" ON notes;

-- Create new INSERT policy (unchanged from original)
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
-- Users can only edit/delete their own notes (or Owner can edit/delete all)


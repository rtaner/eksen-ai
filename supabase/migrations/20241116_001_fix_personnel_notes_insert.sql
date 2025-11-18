-- Fix: Personnel should be able to create notes about themselves without permission check
-- This allows personnel to add self-notes regardless of organization permission settings

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authorized users can create notes" ON notes;

-- Create new INSERT policy with personnel self-note exception
CREATE POLICY "Authorized users can create notes"
  ON notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
    AND (
      -- Personnel can always create notes about themselves (self-notes)
      (
        get_user_role() = 'personnel'
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
      -- For other roles or notes about others, check permission
      has_permission('notes', 'create')
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Authorized users can create notes" ON notes IS 
'Note creation policy:
- Personnel: can ALWAYS create notes about themselves (self-notes) without permission check
- Other roles: need create permission to add notes
- All notes must be in same organization';

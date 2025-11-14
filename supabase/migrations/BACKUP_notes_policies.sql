-- BACKUP of original notes RLS policies
-- Created: 2024-11-10
-- Original file: 20241028_002_rls_policies.sql

-- ============================================
-- NOTES POLICIES (ORIGINAL)
-- ============================================

-- Complex visibility: Owner sees all, others see only their own
CREATE POLICY "Notes visibility"
  ON notes FOR SELECT
  USING (
    -- Owner sees all notes in their org
    (get_user_role() = 'owner' AND 
     personnel_id IN (
       SELECT id FROM personnel 
       WHERE organization_id = get_user_organization_id()
     ))
    OR
    -- Others see only their own notes (if they have view permission)
    (author_id = auth.uid() AND has_permission('notes', 'view'))
  );

-- Users with permission can create notes
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

-- Users can edit their own notes (with permission)
-- Owners can edit all notes
CREATE POLICY "Authorized users can update notes"
  ON notes FOR UPDATE
  USING (
    (author_id = auth.uid() AND has_permission('notes', 'edit'))
    OR
    (get_user_role() = 'owner' AND 
     personnel_id IN (
       SELECT id FROM personnel 
       WHERE organization_id = get_user_organization_id()
     ))
  );

-- Users can delete their own notes (with permission)
-- Owners can delete all notes
CREATE POLICY "Authorized users can delete notes"
  ON notes FOR DELETE
  USING (
    (author_id = auth.uid() AND has_permission('notes', 'delete'))
    OR
    (get_user_role() = 'owner' AND 
     personnel_id IN (
       SELECT id FROM personnel 
       WHERE organization_id = get_user_organization_id()
     ))
  );

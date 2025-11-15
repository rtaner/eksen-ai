-- Enable RLS on checklist tables
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHECKLISTS TABLE POLICIES
-- ============================================

-- SELECT: Users can view checklists in their organization
CREATE POLICY "Users can view checklists in their organization"
ON checklists FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- INSERT: Only owners can create checklists
CREATE POLICY "Only owners can create checklists"
ON checklists FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- UPDATE: Only owners can update checklists
CREATE POLICY "Only owners can update checklists"
ON checklists FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- DELETE: Only owners can delete checklists (soft delete via update)
CREATE POLICY "Only owners can delete checklists"
ON checklists FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);


-- ============================================
-- CHECKLIST_RESULTS TABLE POLICIES
-- ============================================

-- SELECT: Users can view results in their organization
CREATE POLICY "Users can view results in their organization"
ON checklist_results FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT: Users can create results in their organization
CREATE POLICY "Users can create results in their organization"
ON checklist_results FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND completed_by = auth.uid()
);

-- UPDATE: Users can only update their own results
CREATE POLICY "Users can update their own results"
ON checklist_results FOR UPDATE
USING (
  completed_by = auth.uid()
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- DELETE: Only owners can delete results
CREATE POLICY "Only owners can delete results"
ON checklist_results FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- ============================================
-- CHECKLIST_ASSIGNMENTS TABLE POLICIES
-- ============================================

-- SELECT: Users can view assignments in their organization
CREATE POLICY "Users can view assignments in their organization"
ON checklist_assignments FOR SELECT
USING (
  personnel_id IN (
    SELECT id FROM personnel 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- INSERT: Users can create assignments in their organization
CREATE POLICY "Users can create assignments in their organization"
ON checklist_assignments FOR INSERT
WITH CHECK (
  personnel_id IN (
    SELECT id FROM personnel 
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  AND assigned_by = auth.uid()
);

-- DELETE: Only owners and the assigner can delete assignments
CREATE POLICY "Owners and assigners can delete assignments"
ON checklist_assignments FOR DELETE
USING (
  assigned_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'owner'
    AND organization_id IN (
      SELECT organization_id FROM personnel WHERE id = checklist_assignments.personnel_id
    )
  )
);

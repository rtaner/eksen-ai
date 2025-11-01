-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check permission
CREATE OR REPLACE FUNCTION has_permission(
  p_resource_type TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_org_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- Get user's role and org
  SELECT role, organization_id INTO v_role, v_org_id
  FROM profiles WHERE id = auth.uid();
  
  -- Owner has all permissions
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT 
    CASE p_action
      WHEN 'view' THEN can_view
      WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      ELSE FALSE
    END INTO v_has_permission
  FROM permissions
  WHERE organization_id = v_org_id
    AND role = v_role
    AND resource_type = p_resource_type;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Only owners can update their organization
CREATE POLICY "Owners can update organization"
  ON organizations FOR UPDATE
  USING (
    id = get_user_organization_id() 
    AND get_user_role() = 'owner'
  );

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view profiles in their organization
CREATE POLICY "Users can view org profiles"
  ON profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Owners can update any profile in their org
CREATE POLICY "Owners can update org profiles"
  ON profiles FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() = 'owner'
  );

-- ============================================
-- PERMISSIONS POLICIES
-- ============================================

-- Users can view permissions in their organization
CREATE POLICY "Users can view org permissions"
  ON permissions FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Only owners can modify permissions
CREATE POLICY "Owners can insert permissions"
  ON permissions FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() = 'owner'
  );

CREATE POLICY "Owners can update permissions"
  ON permissions FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() = 'owner'
  );

CREATE POLICY "Owners can delete permissions"
  ON permissions FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() = 'owner'
  );

-- ============================================
-- PERSONNEL POLICIES
-- ============================================

-- Users can view personnel in their organization
CREATE POLICY "Users can view org personnel"
  ON personnel FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users with permission can create personnel
CREATE POLICY "Authorized users can create personnel"
  ON personnel FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND has_permission('personnel', 'create')
  );

-- Users with permission can update personnel
CREATE POLICY "Authorized users can update personnel"
  ON personnel FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('personnel', 'edit')
  );

-- Users with permission can delete personnel
CREATE POLICY "Authorized users can delete personnel"
  ON personnel FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('personnel', 'delete')
  );

-- ============================================
-- NOTES POLICIES
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

-- ============================================
-- TASKS POLICIES
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

-- ============================================
-- AI_ANALYSES POLICIES
-- ============================================

-- Users can view analyses for personnel in their org
CREATE POLICY "Users can view org analyses"
  ON ai_analyses FOR SELECT
  USING (
    personnel_id IN (
      SELECT id FROM personnel 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Only system (via Edge Functions) can insert analyses
-- This will be handled by service role key in Edge Functions
CREATE POLICY "Service role can insert analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (true);

-- No one can update or delete analyses (immutable record)

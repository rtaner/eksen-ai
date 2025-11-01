-- ============================================
-- FIX: Default Permissions Trigger
-- Add ON CONFLICT handling and owner permissions
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
DROP FUNCTION IF EXISTS trigger_create_default_permissions();
DROP FUNCTION IF EXISTS create_default_permissions(UUID);

-- Recreate function with ON CONFLICT handling
-- Note: Owner role doesn't need permissions entries as they have full access by default
CREATE OR REPLACE FUNCTION create_default_permissions(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Manager default permissions
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    (org_id, 'manager', 'personnel', true, true, true, true),
    (org_id, 'manager', 'notes', true, true, true, true),
    (org_id, 'manager', 'tasks', true, true, true, false)
  ON CONFLICT (organization_id, role, resource_type) DO NOTHING;
  
  -- Personnel default permissions (minimal)
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    (org_id, 'personnel', 'personnel', true, false, false, false),
    (org_id, 'personnel', 'notes', false, false, false, false),
    (org_id, 'personnel', 'tasks', true, false, false, false)
  ON CONFLICT (organization_id, role, resource_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION trigger_create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_permissions(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_permissions();

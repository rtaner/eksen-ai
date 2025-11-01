-- Function to create default permissions for a new organization
CREATE OR REPLACE FUNCTION create_default_permissions(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Manager default permissions
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    -- Manager can manage personnel
    (org_id, 'manager', 'personnel', true, true, true, true),
    -- Manager can manage notes (but only see their own)
    (org_id, 'manager', 'notes', true, true, true, true),
    -- Manager can manage tasks
    (org_id, 'manager', 'tasks', true, true, true, false);
  
  -- Personnel default permissions (minimal)
  INSERT INTO permissions (organization_id, role, resource_type, can_view, can_create, can_edit, can_delete)
  VALUES
    -- Personnel can only view personnel
    (org_id, 'personnel', 'personnel', true, false, false, false),
    -- Personnel cannot manage notes
    (org_id, 'personnel', 'notes', false, false, false, false),
    -- Personnel can view tasks (their own)
    (org_id, 'personnel', 'tasks', true, false, false, false);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default permissions when organization is created
CREATE OR REPLACE FUNCTION trigger_create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_permissions(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_permissions();

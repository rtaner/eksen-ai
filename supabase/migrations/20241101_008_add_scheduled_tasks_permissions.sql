-- Add scheduled_tasks permissions to default_permissions

-- For owner role
INSERT INTO default_permissions (role, resource, action)
VALUES 
  ('owner', 'scheduled_tasks', 'view'),
  ('owner', 'scheduled_tasks', 'create'),
  ('owner', 'scheduled_tasks', 'edit'),
  ('owner', 'scheduled_tasks', 'delete')
ON CONFLICT (role, resource, action) DO NOTHING;

-- For manager role
INSERT INTO default_permissions (role, resource, action)
VALUES 
  ('manager', 'scheduled_tasks', 'view'),
  ('manager', 'scheduled_tasks', 'create'),
  ('manager', 'scheduled_tasks', 'edit'),
  ('manager', 'scheduled_tasks', 'delete')
ON CONFLICT (role, resource, action) DO NOTHING;

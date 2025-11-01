-- Enable RLS on scheduled_tasks
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view scheduled tasks in their organization
CREATE POLICY "Users can view org scheduled tasks"
  ON scheduled_tasks FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Only users with permission can create
CREATE POLICY "Authorized users can create scheduled tasks"
  ON scheduled_tasks FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'create')
  );

-- Only users with permission can update
CREATE POLICY "Authorized users can update scheduled tasks"
  ON scheduled_tasks FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'edit')
  );

-- Only users with permission can delete
CREATE POLICY "Authorized users can delete scheduled tasks"
  ON scheduled_tasks FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND has_permission('scheduled_tasks', 'delete')
  );

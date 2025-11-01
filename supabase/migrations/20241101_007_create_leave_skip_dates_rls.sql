-- Enable RLS on scheduled_task_leave_dates
ALTER TABLE scheduled_task_leave_dates ENABLE ROW LEVEL SECURITY;

-- Users can view leave dates for scheduled tasks in their organization
CREATE POLICY "Users can view org leave dates"
  ON scheduled_task_leave_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_leave_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
  );

-- Users with edit permission can manage leave dates
CREATE POLICY "Authorized users can insert leave dates"
  ON scheduled_task_leave_dates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_leave_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
    AND has_permission('scheduled_tasks', 'edit')
  );

CREATE POLICY "Authorized users can delete leave dates"
  ON scheduled_task_leave_dates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_leave_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
    AND has_permission('scheduled_tasks', 'edit')
  );

-- Enable RLS on scheduled_task_skip_dates
ALTER TABLE scheduled_task_skip_dates ENABLE ROW LEVEL SECURITY;

-- Users can view skip dates for scheduled tasks in their organization
CREATE POLICY "Users can view org skip dates"
  ON scheduled_task_skip_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_skip_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
  );

-- Users with edit permission can manage skip dates
CREATE POLICY "Authorized users can insert skip dates"
  ON scheduled_task_skip_dates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_skip_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
    AND has_permission('scheduled_tasks', 'edit')
  );

CREATE POLICY "Authorized users can delete skip dates"
  ON scheduled_task_skip_dates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = scheduled_task_skip_dates.scheduled_task_id
      AND scheduled_tasks.organization_id = get_user_organization_id()
    )
    AND has_permission('scheduled_tasks', 'edit')
  );

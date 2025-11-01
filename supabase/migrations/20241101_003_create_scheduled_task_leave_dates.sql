-- Create scheduled_task_leave_dates table
CREATE TABLE IF NOT EXISTS scheduled_task_leave_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  delegate_personnel_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scheduled_task_id, personnel_id, leave_date)
);

-- Create indexes
CREATE INDEX idx_leave_dates_task ON scheduled_task_leave_dates(scheduled_task_id);
CREATE INDEX idx_leave_dates_personnel ON scheduled_task_leave_dates(personnel_id);
CREATE INDEX idx_leave_dates_date ON scheduled_task_leave_dates(leave_date);
CREATE INDEX idx_leave_dates_delegate ON scheduled_task_leave_dates(delegate_personnel_id);

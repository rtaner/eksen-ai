-- Create scheduled_task_skip_dates table
CREATE TABLE IF NOT EXISTS scheduled_task_skip_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  skip_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(scheduled_task_id, skip_date)
);

-- Create indexes
CREATE INDEX idx_skip_dates_task ON scheduled_task_skip_dates(scheduled_task_id);
CREATE INDEX idx_skip_dates_date ON scheduled_task_skip_dates(skip_date);

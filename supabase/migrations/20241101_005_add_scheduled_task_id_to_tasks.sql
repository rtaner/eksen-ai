-- Add scheduled_task_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_task_id UUID REFERENCES scheduled_tasks(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_task_id);

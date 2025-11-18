-- Add closing_note column to tasks table
-- This allows users to add optional comments when closing a task

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS closing_note TEXT;

-- Add comment to document the column
COMMENT ON COLUMN tasks.closing_note IS 'Optional comment added when closing the task';

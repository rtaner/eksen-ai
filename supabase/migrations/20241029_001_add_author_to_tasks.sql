-- Add author_id column to tasks table
ALTER TABLE tasks
ADD COLUMN author_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_tasks_author ON tasks(author_id);

-- Add comment
COMMENT ON COLUMN tasks.author_id IS 'User who created the task';

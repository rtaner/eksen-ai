-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Task Details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Recurrence
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_config JSONB NOT NULL,
  -- For weekly: {"days": [1, 3, 5]} (Monday, Wednesday, Friday)
  -- For monthly: {"day": 15} (15th of each month)
  
  scheduled_time TIME DEFAULT '09:00:00',
  
  -- Assignment
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('specific', 'role')),
  assignment_config JSONB NOT NULL,
  -- For specific: {"personnel_ids": ["uuid1", "uuid2"]}
  -- For role: {"role": "manager"}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_scheduled_tasks_org ON scheduled_tasks(organization_id);
CREATE INDEX idx_scheduled_tasks_active ON scheduled_tasks(is_active);
CREATE INDEX idx_scheduled_tasks_created_by ON scheduled_tasks(created_by);

-- Create updated_at trigger
CREATE TRIGGER update_scheduled_tasks_updated_at
  BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

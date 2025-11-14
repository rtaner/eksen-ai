-- Add hierarchy_level column to profiles table
-- This enables hierarchical permission system

-- Add column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 1;

-- Update existing records based on role
UPDATE profiles SET hierarchy_level = 3 WHERE role = 'owner';
UPDATE profiles SET hierarchy_level = 2 WHERE role = 'manager';
UPDATE profiles SET hierarchy_level = 1 WHERE role = 'personnel';

-- Add constraint to ensure valid hierarchy levels
ALTER TABLE profiles 
ADD CONSTRAINT check_hierarchy_level 
CHECK (hierarchy_level IN (1, 2, 3));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_hierarchy 
ON profiles(hierarchy_level);

-- Add comment for documentation
COMMENT ON COLUMN profiles.hierarchy_level IS 'Hierarchy level: 1=Personnel, 2=Manager, 3=Owner';

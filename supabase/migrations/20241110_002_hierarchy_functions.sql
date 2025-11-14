-- Helper functions for hierarchical permission system

-- Function to get current user's hierarchy level
CREATE OR REPLACE FUNCTION get_user_hierarchy_level()
RETURNS INTEGER AS $$
  SELECT hierarchy_level FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get author's hierarchy level by UUID
CREATE OR REPLACE FUNCTION get_author_hierarchy_level(author_uuid UUID)
RETURNS INTEGER AS $$
  SELECT hierarchy_level FROM profiles WHERE id = author_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_hierarchy_level() IS 'Returns the hierarchy level of the current authenticated user';
COMMENT ON FUNCTION get_author_hierarchy_level(UUID) IS 'Returns the hierarchy level of a specific user by UUID';

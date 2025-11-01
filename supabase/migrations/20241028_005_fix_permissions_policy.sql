-- ============================================
-- FIX: Permissions Policy for Registration
-- Allow new users to create default permissions during registration
-- ============================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "New owners can create default permissions" ON permissions;

-- Create a more permissive policy for new organization owners
-- This allows creating permissions right after organization creation
CREATE POLICY "Owners can create permissions for their org"
  ON permissions FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User must be the owner of the organization
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = permissions.organization_id
        AND profiles.role = 'owner'
    )
  );

-- Also update the existing "Owners can insert permissions" policy if it exists
DROP POLICY IF EXISTS "Owners can insert permissions" ON permissions;

-- Recreate it with the same logic
CREATE POLICY "Owners can manage permissions"
  ON permissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = permissions.organization_id
        AND profiles.role = 'owner'
    )
  );

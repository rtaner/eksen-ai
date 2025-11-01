-- Add DELETE policy for profiles table
-- Only owners can delete profiles in their organization

CREATE POLICY "Owners can delete org profiles"
  ON profiles FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() = 'owner'
    AND id != auth.uid()  -- Cannot delete own profile
  );

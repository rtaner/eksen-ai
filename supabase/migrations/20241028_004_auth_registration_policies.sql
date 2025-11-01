-- ============================================
-- REGISTRATION POLICIES
-- These policies allow new users to register and create organizations
-- ============================================

-- Allow anyone to create a new organization (during registration)
CREATE POLICY "Anyone can create organization during registration"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Allow anyone to create their own profile (during registration)
CREATE POLICY "Anyone can create own profile during registration"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow new organization owners to create default permissions
CREATE POLICY "New owners can create default permissions"
  ON permissions FOR INSERT
  WITH CHECK (
    -- Check if the user is the owner of the organization
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = permissions.organization_id
        AND profiles.role = 'owner'
    )
  );

-- Allow users to read organizations by invite_code (for joining)
CREATE POLICY "Anyone can read organization by invite_code"
  ON organizations FOR SELECT
  USING (true);


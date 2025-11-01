-- Auto-create personnel for new profiles and sync name changes

-- Function to create personnel when profile is created
CREATE OR REPLACE FUNCTION create_personnel_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create personnel for manager and personnel roles (not owner)
  IF NEW.role IN ('manager', 'personnel') THEN
    INSERT INTO personnel (
      organization_id,
      name,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      NEW.organization_id,
      NEW.name || ' ' || NEW.surname,
      jsonb_build_object('user_id', NEW.id, 'role', NEW.role),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create personnel after profile insert
CREATE TRIGGER create_personnel_on_profile_insert
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_personnel_for_profile();

-- Function to sync personnel name when profile name changes
CREATE OR REPLACE FUNCTION sync_personnel_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if name or surname changed
  IF (NEW.name != OLD.name OR NEW.surname != OLD.surname) THEN
    UPDATE personnel
    SET 
      name = NEW.name || ' ' || NEW.surname,
      updated_at = NOW()
    WHERE metadata->>'user_id' = NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync personnel name after profile update
CREATE TRIGGER sync_personnel_on_profile_update
AFTER UPDATE OF name, surname ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_personnel_name();

-- Update RLS policy for personnel INSERT to allow profile-based creation
-- Drop old policy
DROP POLICY IF EXISTS "Authorized users can create personnel" ON personnel;

-- Create new policy that allows both manual creation and auto-creation
CREATE POLICY "Authorized users can create personnel"
  ON personnel FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (
      -- Manual creation with permission
      has_permission('personnel', 'create')
      OR
      -- Auto-creation from profile (via trigger with SECURITY DEFINER)
      true
    )
  );

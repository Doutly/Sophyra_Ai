/*
  # Admin User Setup Helper

  1. Purpose
    - Provides function to set a user as admin
    - Call this after creating mani@sophrya.ai via Supabase Auth
  
  2. Usage
    - First: Create user mani@sophrya.ai with password 1234567890 in Supabase Dashboard
    - Then: Run SELECT setup_admin_user('mani@sophrya.ai');
  
  3. Note
    - This migration creates a helper function
    - The actual admin user must be created via Supabase Auth
*/

-- Create function to set user as admin
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = admin_email;
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Insert or update in public.users
  INSERT INTO public.users (id, email, name, role, is_approved)
  VALUES (user_id_var, admin_email, 'Admin User', 'admin', TRUE)
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'admin',
    is_approved = TRUE;
    
  RAISE NOTICE 'Successfully set % as admin', admin_email;
END;
$$;

-- Try to setup admin if user already exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'mani@sophrya.ai') THEN
    PERFORM setup_admin_user('mani@sophrya.ai');
  ELSE
    RAISE NOTICE 'Admin user mani@sophrya.ai does not exist yet. Create it via Supabase Dashboard, then run: SELECT setup_admin_user(''mani@sophrya.ai'');';
  END IF;
END $$;
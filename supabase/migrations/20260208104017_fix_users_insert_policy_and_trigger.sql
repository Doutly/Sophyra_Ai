/*
  # Fix Users Table INSERT Policy and Trigger Function
  
  ## Critical Fixes
  
  1. **Sync Missing Users from auth.users**
    - Ensure all auth.users have corresponding public.users records
    - This fixes orphaned foreign key references
  
  2. **Add Missing INSERT Policy**
    - Add policy allowing users to self-register during signup
    - This fixes the loading loop caused by failed user record creation
  
  3. **Update Trigger Function**
    - Extract role from raw_user_meta_data (defaults to 'student')
    - Extract is_approved from raw_user_meta_data
    - Auto-approve students, require approval for HR
    - Handle both INSERT and UPDATE scenarios
  
  4. **Fix Foreign Key References**
    - Update mock_interview_requests.user_id to reference public.users.id
    - Update mock_interview_requests.assigned_admin_id to reference public.users.id
    - Update mock_interview_requests.claimed_by to reference public.users.id
    - This ensures consistency across the database
  
  ## Security
  - INSERT policy allows users to create their own record during signup
  - RLS still protects user data from unauthorized access
*/

-- First, sync all missing users from auth.users to public.users
INSERT INTO public.users (id, email, name, role, is_approved, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'student'),
  COALESCE((au.raw_user_meta_data->>'is_approved')::boolean, 
    CASE WHEN COALESCE(au.raw_user_meta_data->>'role', 'student') = 'student' THEN true ELSE false END
  ),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow user self-registration" ON public.users;

-- Add INSERT policy for users table
CREATE POLICY "Allow user self-registration"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update trigger function to handle role and is_approved from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  user_is_approved boolean;
BEGIN
  -- Extract role from metadata, default to 'student'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Auto-approve students, require approval for HR
  IF NEW.raw_user_meta_data->>'is_approved' IS NOT NULL THEN
    user_is_approved := (NEW.raw_user_meta_data->>'is_approved')::boolean;
  ELSE
    user_is_approved := (user_role = 'student');
  END IF;
  
  INSERT INTO public.users (id, email, name, role, is_approved, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    user_is_approved,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = COALESCE(EXCLUDED.role, public.users.role),
    is_approved = COALESCE(EXCLUDED.is_approved, public.users.is_approved),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix foreign key references in mock_interview_requests table
-- Drop existing foreign keys
ALTER TABLE public.mock_interview_requests
  DROP CONSTRAINT IF EXISTS mock_interview_requests_user_id_fkey,
  DROP CONSTRAINT IF EXISTS mock_interview_requests_assigned_admin_id_fkey,
  DROP CONSTRAINT IF EXISTS mock_interview_requests_claimed_by_fkey;

-- Add corrected foreign keys pointing to public.users
ALTER TABLE public.mock_interview_requests
  ADD CONSTRAINT mock_interview_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT mock_interview_requests_assigned_admin_id_fkey 
    FOREIGN KEY (assigned_admin_id) REFERENCES public.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT mock_interview_requests_claimed_by_fkey 
    FOREIGN KEY (claimed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix admin_actions foreign keys
ALTER TABLE public.admin_actions
  DROP CONSTRAINT IF EXISTS admin_actions_admin_id_fkey;

ALTER TABLE public.admin_actions
  ADD CONSTRAINT admin_actions_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Add INSERT policy for admin_actions
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;

CREATE POLICY "Admins can create admin actions"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
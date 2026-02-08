/*
  # Comprehensive Database Security and Performance Optimization
  
  ## Critical Performance Improvements
  
  1. **Add Missing Indexes on Foreign Keys**
    - admin_actions.admin_id
    - mock_interview_requests.assigned_admin_id
    - users.approved_by
    - Improves join performance and foreign key constraint checks
  
  2. **Optimize RLS Policies for Performance**
    - Wrap all auth.uid() calls in SELECT to prevent re-evaluation per row
    - Applies to 36+ policies across all tables
    - Significant performance improvement at scale
  
  3. **Remove Unused Indexes**
    - Removes 23 unused indexes to reduce storage and maintenance overhead
    - Keeps only actively used indexes
  
  4. **Consolidate Duplicate RLS Policies**
    - Removes duplicate SELECT, INSERT, and UPDATE policies
    - Keeps the most comprehensive version of each
  
  5. **Fix Function Security**
    - Set immutable search_path on all functions
    - Prevents search_path hijacking attacks
  
  ## Security
  - All changes maintain or improve security
  - RLS policies remain restrictive
  - Functions are hardened against attacks
*/

-- ============================================================================
-- SECTION 1: Add Missing Indexes on Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id 
  ON public.admin_actions(admin_id);

CREATE INDEX IF NOT EXISTS idx_mock_interview_requests_assigned_admin_id 
  ON public.mock_interview_requests(assigned_admin_id);

CREATE INDEX IF NOT EXISTS idx_users_approved_by 
  ON public.users(approved_by);

-- ============================================================================
-- SECTION 2: Remove Unused Indexes
-- ============================================================================

DROP INDEX IF EXISTS public.idx_sessions_created_at;
DROP INDEX IF EXISTS public.idx_turns_session_id;
DROP INDEX IF EXISTS public.idx_reports_session_id;
DROP INDEX IF EXISTS public.idx_shares_report_id;
DROP INDEX IF EXISTS public.idx_shares_token;
DROP INDEX IF EXISTS public.idx_tips_user_id;
DROP INDEX IF EXISTS public.idx_resume_data_user_id;
DROP INDEX IF EXISTS public.idx_resume_data_session_id;
DROP INDEX IF EXISTS public.idx_resume_data_created_at;
DROP INDEX IF EXISTS public.idx_mock_requests_ticket_number;
DROP INDEX IF EXISTS public.idx_mock_requests_priority;
DROP INDEX IF EXISTS public.idx_mock_requests_scheduled_date;
DROP INDEX IF EXISTS public.idx_admin_actions_request_id;
DROP INDEX IF EXISTS public.idx_admin_actions_timestamp;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_users_is_approved;
DROP INDEX IF EXISTS public.idx_users_role_approved;
DROP INDEX IF EXISTS public.idx_mock_requests_user_id;
DROP INDEX IF EXISTS public.idx_mock_requests_status;
DROP INDEX IF EXISTS public.idx_mock_requests_created_at;
DROP INDEX IF EXISTS public.idx_mock_requests_claimed_by;
DROP INDEX IF EXISTS public.idx_mock_requests_booking_status;
DROP INDEX IF EXISTS public.idx_mock_requests_status_booking;

-- ============================================================================
-- SECTION 3: Consolidate Duplicate RLS Policies
-- ============================================================================

-- Remove duplicate policies on mock_interview_requests
DROP POLICY IF EXISTS "Users can create own requests" ON public.mock_interview_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON public.mock_interview_requests;

-- Remove duplicate policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

-- ============================================================================
-- SECTION 4: Optimize All RLS Policies for Performance
-- ============================================================================

-- SESSIONS TABLE
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;
CREATE POLICY "Users can create own sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- TURNS TABLE
DROP POLICY IF EXISTS "Users can create turns in own sessions" ON public.turns;
CREATE POLICY "Users can create turns in own sessions"
  ON public.turns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = turns.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can read own turns" ON public.turns;
CREATE POLICY "Users can read own turns"
  ON public.turns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = turns.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own turns" ON public.turns;
CREATE POLICY "Users can update own turns"
  ON public.turns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = turns.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

-- REPORTS TABLE
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = reports.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = reports.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = reports.session_id
      AND sessions.user_id = (select auth.uid())
    )
  );

-- TIPS TABLE
DROP POLICY IF EXISTS "Users can create own tips" ON public.tips;
CREATE POLICY "Users can create own tips"
  ON public.tips FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own tips" ON public.tips;
CREATE POLICY "Users can read own tips"
  ON public.tips FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tips" ON public.tips;
CREATE POLICY "Users can update own tips"
  ON public.tips FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- SHARES TABLE
DROP POLICY IF EXISTS "Report owners can create shares" ON public.shares;
CREATE POLICY "Report owners can create shares"
  ON public.shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports
      JOIN public.sessions ON reports.session_id = sessions.id
      WHERE reports.id = shares.report_id
      AND sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Report owners can update shares" ON public.shares;
CREATE POLICY "Report owners can update shares"
  ON public.shares FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      JOIN public.sessions ON reports.session_id = sessions.id
      WHERE reports.id = shares.report_id
      AND sessions.user_id = (select auth.uid())
    )
  );

-- RESUME_DATA TABLE
DROP POLICY IF EXISTS "Users can delete own resume data" ON public.resume_data;
CREATE POLICY "Users can delete own resume data"
  ON public.resume_data FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own resume data" ON public.resume_data;
CREATE POLICY "Users can insert own resume data"
  ON public.resume_data FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own resume data" ON public.resume_data;
CREATE POLICY "Users can update own resume data"
  ON public.resume_data FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own resume data" ON public.resume_data;
CREATE POLICY "Users can view own resume data"
  ON public.resume_data FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ADMIN_ACTIONS TABLE
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
CREATE POLICY "Admins can create admin actions"
  ON public.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

-- USERS TABLE
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "Allow user self-registration" ON public.users;
CREATE POLICY "Allow user self-registration"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- MOCK_INTERVIEW_REQUESTS TABLE
DROP POLICY IF EXISTS "Admins can update requests" ON public.mock_interview_requests;
CREATE POLICY "Admins can update requests"
  ON public.mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all requests" ON public.mock_interview_requests;
CREATE POLICY "Admins can view all requests"
  ON public.mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'admin'
  );

DROP POLICY IF EXISTS "HRs can claim approved requests" ON public.mock_interview_requests;
CREATE POLICY "HRs can claim approved requests"
  ON public.mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'hr' AND
    status = 'approved'
  );

DROP POLICY IF EXISTS "HRs can update own claimed requests" ON public.mock_interview_requests;
CREATE POLICY "HRs can update own claimed requests"
  ON public.mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'hr' AND
    claimed_by = (select auth.uid())
  );

DROP POLICY IF EXISTS "HRs can view approved unclaimed requests" ON public.mock_interview_requests;
CREATE POLICY "HRs can view approved unclaimed requests"
  ON public.mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'hr' AND
    status = 'approved' AND
    claimed_by IS NULL
  );

DROP POLICY IF EXISTS "HRs can view own claimed requests" ON public.mock_interview_requests;
CREATE POLICY "HRs can view own claimed requests"
  ON public.mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = (select auth.uid())) = 'hr' AND
    claimed_by = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own pending requests" ON public.mock_interview_requests;
CREATE POLICY "Users can update own pending requests"
  ON public.mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) AND
    status = 'pending'
  );

DROP POLICY IF EXISTS "Users can create requests" ON public.mock_interview_requests;
CREATE POLICY "Users can create requests"
  ON public.mock_interview_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own requests" ON public.mock_interview_requests;
CREATE POLICY "Users can view own requests"
  ON public.mock_interview_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- SECTION 5: Fix Function Search Paths
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  year_code TEXT;
  sequence_num INTEGER;
  new_ticket_number TEXT;
BEGIN
  year_code := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM public.mock_interview_requests
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NEW.created_at);
  
  new_ticket_number := 'MIR-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.ticket_number := new_ticket_number;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_resume_data_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  UPDATE public.users
  SET role = 'admin', is_approved = true
  WHERE id = admin_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.users (id, email, name, role, is_approved)
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'admin', true
    FROM auth.users
    WHERE id = admin_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
  user_is_approved BOOLEAN;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
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
$$;
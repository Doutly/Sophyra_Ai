/*
  # Add Missing RLS Policies

  1. Adds missing UPDATE policy for turns table
  2. Adds missing UPDATE policy for reports table
  3. Ensures all authenticated users can perform necessary operations
*/

-- Drop and recreate turns UPDATE policy
DROP POLICY IF EXISTS "Users can update own turns" ON turns;

CREATE POLICY "Users can update own turns"
ON turns
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  )
);

-- Drop and recreate reports UPDATE policy
DROP POLICY IF EXISTS "Users can update own reports" ON reports;

CREATE POLICY "Users can update own reports"
ON reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = reports.session_id
    AND sessions.user_id = auth.uid()
  )
);

-- Add shares UPDATE policy
DROP POLICY IF EXISTS "Report owners can update shares" ON shares;

CREATE POLICY "Report owners can update shares"
ON shares
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reports
    JOIN sessions ON sessions.id = reports.session_id
    WHERE reports.id = shares.report_id
    AND sessions.user_id = auth.uid()
  )
);

-- Add tips INSERT policy
DROP POLICY IF EXISTS "Users can create own tips" ON tips;

CREATE POLICY "Users can create own tips"
ON tips
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

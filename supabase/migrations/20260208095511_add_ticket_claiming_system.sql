/*
  # Add Ticket Claiming System

  1. Changes to mock_interview_requests Table
    - Add `claimed_by` UUID to track which HR claimed the ticket
    - Add `claimed_at` timestamp for claim tracking
    - Add `booking_status` for granular ticket state management
    - Add `meeting_room_link` TEXT for storing meeting URLs
  
  2. Status Flow
    - status: 'pending' | 'approved' | 'rejected' | 'completed' (admin workflow)
    - booking_status: 'unclaimed' | 'claimed' | 'booked' | 'completed' | 'cancelled' (HR workflow)
  
  3. Security
    - Update RLS policies for HR access
    - Add indexes for performance
*/

-- Add claimed_by column
ALTER TABLE mock_interview_requests ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id);

-- Add claimed_at timestamp
ALTER TABLE mock_interview_requests ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Add booking_status column
ALTER TABLE mock_interview_requests ADD COLUMN IF NOT EXISTS booking_status TEXT NOT NULL DEFAULT 'unclaimed';

-- Add check constraint for booking_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_status_check'
  ) THEN
    ALTER TABLE mock_interview_requests 
    ADD CONSTRAINT booking_status_check 
    CHECK (booking_status IN ('unclaimed', 'claimed', 'booked', 'completed', 'cancelled'));
  END IF;
END $$;

-- Add meeting_room_link column
ALTER TABLE mock_interview_requests ADD COLUMN IF NOT EXISTS meeting_room_link TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_requests_claimed_by ON mock_interview_requests(claimed_by);
CREATE INDEX IF NOT EXISTS idx_mock_requests_booking_status ON mock_interview_requests(booking_status);
CREATE INDEX IF NOT EXISTS idx_mock_requests_status_booking ON mock_interview_requests(status, booking_status);

-- Drop old RLS policies for mock_interview_requests
DROP POLICY IF EXISTS "Users can view own requests" ON mock_interview_requests;
DROP POLICY IF EXISTS "Users can create requests" ON mock_interview_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON mock_interview_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON mock_interview_requests;

-- Create new RLS policies
CREATE POLICY "Users can view own requests"
  ON mock_interview_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
  ON mock_interview_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all requests"
  ON mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update requests"
  ON mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "HRs can view approved unclaimed requests"
  ON mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'hr' AND
    (SELECT is_approved FROM users WHERE id = auth.uid()) = TRUE AND
    (status = 'approved' AND booking_status = 'unclaimed')
  );

CREATE POLICY "HRs can view own claimed requests"
  ON mock_interview_requests FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'hr' AND
    claimed_by = auth.uid()
  );

CREATE POLICY "HRs can claim approved requests"
  ON mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'hr' AND
    (SELECT is_approved FROM users WHERE id = auth.uid()) = TRUE AND
    (status = 'approved' AND booking_status = 'unclaimed' AND claimed_by IS NULL)
  )
  WITH CHECK (
    claimed_by = auth.uid() AND
    booking_status IN ('claimed', 'booked', 'completed', 'cancelled')
  );

CREATE POLICY "HRs can update own claimed requests"
  ON mock_interview_requests FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'hr' AND
    claimed_by = auth.uid()
  )
  WITH CHECK (
    claimed_by = auth.uid()
  );
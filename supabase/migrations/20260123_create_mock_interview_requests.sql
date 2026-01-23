/*
  # Create Mock Interview Requests Table
  
  1. New Tables
    - `mock_interview_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `job_role` (text)
      - `company_name` (text, optional)
      - `experience_level` (text)
      - `job_description` (text)
      - `preferred_date` (date)
      - `preferred_time` (time)
      - `additional_notes` (text, optional)
      - `status` (text: pending, approved, rejected, completed)
      - `admin_notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS
    - Users can create and read their own requests
    - Users can update their own pending requests
    - Admins can read and update all requests
*/

CREATE TABLE IF NOT EXISTS mock_interview_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_role text NOT NULL,
  company_name text,
  experience_level text NOT NULL CHECK (experience_level IN ('fresher', 'mid', 'senior')),
  job_description text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time time NOT NULL,
  additional_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mock_interview_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own requests"
  ON mock_interview_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own requests"
  ON mock_interview_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests"
  ON mock_interview_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS idx_mock_requests_user_id ON mock_interview_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_requests_status ON mock_interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_mock_requests_created_at ON mock_interview_requests(created_at DESC);

/*
  # Add Resume Data Storage

  1. New Tables
    - `resume_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `session_id` (uuid, foreign key to sessions, nullable)
      - `name` (text) - Candidate name
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `skills` (text[]) - Array of skills
      - `experience` (text) - Experience summary
      - `education` (text) - Education details
      - `summary` (text) - Professional summary
      - `linked_in` (text) - LinkedIn URL
      - `github` (text) - GitHub URL
      - `website` (text) - Personal website
      - `raw_text` (text) - First 2000 chars of extracted text
      - `file_name` (text) - Original file name
      - `file_size` (integer) - File size in bytes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `resume_data` table
    - Add policies for authenticated users to manage their own resume data
*/

-- Create resume_data table
CREATE TABLE IF NOT EXISTS resume_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  skills text[] DEFAULT '{}',
  experience text DEFAULT '',
  education text DEFAULT '',
  summary text DEFAULT '',
  linked_in text DEFAULT '',
  github text DEFAULT '',
  website text DEFAULT '',
  raw_text text DEFAULT '',
  file_name text DEFAULT '',
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_data_user_id ON resume_data(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_data_session_id ON resume_data(session_id);
CREATE INDEX IF NOT EXISTS idx_resume_data_created_at ON resume_data(created_at DESC);

-- Enable RLS
ALTER TABLE resume_data ENABLE ROW LEVEL SECURITY;

-- Policies for resume_data
CREATE POLICY "Users can view own resume data"
  ON resume_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume data"
  ON resume_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume data"
  ON resume_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume data"
  ON resume_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resume_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_resume_data_updated_at ON resume_data;
CREATE TRIGGER set_resume_data_updated_at
  BEFORE UPDATE ON resume_data
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_data_updated_at();

-- Add optional resume_data_id to sessions table for reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'resume_data_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN resume_data_id uuid REFERENCES resume_data(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sessions_resume_data_id ON sessions(resume_data_id);
  END IF;
END $$;
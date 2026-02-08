/*
  # Extend Mock Interview Ticket System

  ## Overview
  This migration enhances the mock interview request system with:
  - Ticket numbering system
  - Priority levels
  - Scheduled interview tracking
  - Admin assignment
  - Notification system
  - Admin action audit trail

  ## New Tables

  ### 1. `notifications`
  Tracks all system notifications for users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `type` (text: request_created, status_changed, interview_scheduled, reminder)
  - `title` (text: notification headline)
  - `message` (text: notification content)
  - `read_status` (boolean: read or unread)
  - `related_request_id` (uuid, optional foreign key to mock_interview_requests)
  - `created_at` (timestamptz)

  ### 2. `admin_actions`
  Audit trail for all admin actions on requests
  - `id` (uuid, primary key)
  - `admin_id` (uuid, foreign key to auth.users)
  - `action_type` (text: approved, rejected, scheduled, completed, noted)
  - `request_id` (uuid, foreign key to mock_interview_requests)
  - `notes` (text: admin comments)
  - `timestamp` (timestamptz)

  ## Table Extensions

  ### `mock_interview_requests` - New Columns
  - `ticket_number` (text: unique format MIR-YYYY-####)
  - `priority` (text: normal, high, urgent)
  - `scheduled_date` (date: actual scheduled interview date)
  - `scheduled_time` (time: actual scheduled interview time)
  - `assigned_admin_id` (uuid: which admin is handling this)
  - `status_updated_at` (timestamptz: track when status last changed)

  ## Security
  - Enable RLS on all new tables
  - Users can only read their own notifications
  - Admin actions are auditable and read-only after creation

  ## Indexes
  - Fast lookups by ticket number
  - Efficient notification queries by user and read status
  - Admin action history queries
*/

-- Add new columns to mock_interview_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_interview_requests' AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE mock_interview_requests ADD COLUMN ticket_number text UNIQUE;
    ALTER TABLE mock_interview_requests ADD COLUMN priority text DEFAULT 'normal' 
      CHECK (priority IN ('normal', 'high', 'urgent'));
    ALTER TABLE mock_interview_requests ADD COLUMN scheduled_date date;
    ALTER TABLE mock_interview_requests ADD COLUMN scheduled_time time;
    ALTER TABLE mock_interview_requests ADD COLUMN assigned_admin_id uuid REFERENCES auth.users(id);
    ALTER TABLE mock_interview_requests ADD COLUMN status_updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create function to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  year_code text;
  sequence_num integer;
  new_ticket_number text;
BEGIN
  year_code := TO_CHAR(NEW.created_at, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM mock_interview_requests
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NEW.created_at);
  
  new_ticket_number := 'MIR-' || year_code || '-' || LPAD(sequence_num::text, 4, '0');
  
  NEW.ticket_number := new_ticket_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating ticket numbers
DROP TRIGGER IF EXISTS set_ticket_number ON mock_interview_requests;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON mock_interview_requests
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('request_created', 'status_changed', 'interview_scheduled', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  read_status boolean DEFAULT false,
  related_request_id uuid REFERENCES mock_interview_requests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification read status"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('approved', 'rejected', 'scheduled', 'completed', 'noted')),
  request_id uuid REFERENCES mock_interview_requests(id) ON DELETE CASCADE NOT NULL,
  notes text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_actions (read-only audit trail)
CREATE POLICY "Authenticated users can read admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_requests_ticket_number ON mock_interview_requests(ticket_number);
CREATE INDEX IF NOT EXISTS idx_mock_requests_priority ON mock_interview_requests(priority);
CREATE INDEX IF NOT EXISTS idx_mock_requests_scheduled_date ON mock_interview_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_request_id ON admin_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_timestamp ON admin_actions(timestamp DESC);

-- Function to create notification on status change
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    VALUES (
      NEW.user_id,
      'status_changed',
      'Request Status Updated',
      'Your mock interview request ' || NEW.ticket_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      NEW.id
    );
    
    NEW.status_updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status change notifications
DROP TRIGGER IF EXISTS notify_status_change ON mock_interview_requests;
CREATE TRIGGER notify_status_change
  AFTER UPDATE ON mock_interview_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_status_change();

-- Function to create notification on request creation
CREATE OR REPLACE FUNCTION notify_on_request_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_request_id)
  VALUES (
    NEW.user_id,
    'request_created',
    'Request Submitted Successfully',
    'Your mock interview request ' || NEW.ticket_number || ' has been submitted and is pending review',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for request creation notifications
DROP TRIGGER IF EXISTS notify_request_creation ON mock_interview_requests;
CREATE TRIGGER notify_request_creation
  AFTER INSERT ON mock_interview_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_creation();
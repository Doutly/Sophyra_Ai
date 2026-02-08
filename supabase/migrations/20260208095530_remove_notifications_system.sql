/*
  # Remove Notifications System

  1. Cleanup
    - Drop triggers for automatic notification creation
    - Drop functions for notification logic
    - Drop notifications table entirely
    - Keep admin_actions for audit trail
  
  2. Rationale
    - Status will be shown directly in dashboard widgets
    - Eliminates RLS policy complexity
    - Simpler, more direct user experience
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS notify_request_creation ON mock_interview_requests;
DROP TRIGGER IF EXISTS notify_status_change ON mock_interview_requests;

-- Drop functions
DROP FUNCTION IF EXISTS notify_on_request_creation() CASCADE;
DROP FUNCTION IF EXISTS notify_on_status_change() CASCADE;

-- Drop notifications table (CASCADE removes foreign key constraints)
DROP TABLE IF EXISTS notifications CASCADE;
/*
  # Add Avatar Session Tracking

  ## Summary
  Adds avatar session tracking to support the Simli live avatar integration
  in interview rooms.

  ## New Tables

  ### `avatar_sessions`
  Records each Simli avatar session linked to an interview session.
  - `id` (uuid, primary key) - unique identifier
  - `interview_session_id` (text) - Firebase session document ID
  - `user_id` (uuid) - authenticated user who started the session
  - `face_id` (text) - Simli face ID used for this session
  - `started_at` (timestamptz) - when the avatar session was initiated
  - `ended_at` (timestamptz, nullable) - when the avatar session ended
  - `created_at` (timestamptz) - record creation timestamp

  ### `avatar_events`
  Logs speaking/silent events per avatar session for engagement analytics.
  - `id` (uuid, primary key)
  - `avatar_session_id` (uuid, FK to avatar_sessions)
  - `event_type` (text) - 'speaking' | 'silent' | 'error' | 'connected' | 'disconnected'
  - `occurred_at` (timestamptz) - when the event fired

  ## Security
  - RLS enabled on both tables
  - Users can only read/write their own avatar sessions and events
*/

CREATE TABLE IF NOT EXISTS avatar_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_id text NOT NULL DEFAULT '',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avatar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own avatar sessions"
  ON avatar_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own avatar sessions"
  ON avatar_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar sessions"
  ON avatar_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS avatar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_session_id uuid NOT NULL REFERENCES avatar_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT '',
  occurred_at timestamptz DEFAULT now()
);

ALTER TABLE avatar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own avatar events"
  ON avatar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM avatar_sessions
      WHERE avatar_sessions.id = avatar_session_id
      AND avatar_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can select own avatar events"
  ON avatar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM avatar_sessions
      WHERE avatar_sessions.id = avatar_session_id
      AND avatar_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_avatar_sessions_user_id ON avatar_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_sessions_interview_session_id ON avatar_sessions(interview_session_id);
CREATE INDEX IF NOT EXISTS idx_avatar_events_session_id ON avatar_events(avatar_session_id);

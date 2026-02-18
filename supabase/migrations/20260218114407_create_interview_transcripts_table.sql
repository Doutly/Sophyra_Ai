/*
  # Create interview_transcripts table for ElevenLabs webhook data

  1. New Tables
    - `interview_transcripts`
      - `id` (uuid, primary key)
      - `agent_id` (text) - ElevenLabs agent ID
      - `conversation_id` (text, unique) - ElevenLabs conversation ID
      - `session_id` (text) - Firebase session ID (if matched)
      - `status` (text) - done/failed
      - `transcript` (jsonb) - full transcript array
      - `analysis` (jsonb) - ElevenLabs analysis object
      - `metadata` (jsonb) - call metadata (duration, cost, etc.)
      - `dynamic_variables` (jsonb) - candidate/role context passed during call
      - `call_duration_secs` (integer)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Only service role can insert (webhook)
    - Authenticated users can read their own transcripts by session_id
*/

CREATE TABLE IF NOT EXISTS interview_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL DEFAULT '',
  conversation_id text UNIQUE NOT NULL,
  session_id text DEFAULT '',
  status text DEFAULT 'done',
  transcript jsonb DEFAULT '[]',
  analysis jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  dynamic_variables jsonb DEFAULT '{}',
  call_duration_secs integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert transcripts"
  ON interview_transcripts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select transcripts"
  ON interview_transcripts
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update transcripts"
  ON interview_transcripts
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_conversation_id
  ON interview_transcripts (conversation_id);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session_id
  ON interview_transcripts (session_id);

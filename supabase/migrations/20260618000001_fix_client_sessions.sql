-- ==========================================
-- Sprint 3C Fix — Ensure client_sessions exists
-- and service role can write to it
-- ==========================================

-- Create table only if it doesn't already exist
CREATE TABLE IF NOT EXISTS client_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS if not already enabled
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing service role policy if it exists, then recreate cleanly
DROP POLICY IF EXISTS "Admins have full access to client_sessions" ON client_sessions;

-- Service role bypasses RLS by default, but add an explicit policy
-- so that anon/authenticated reads are also blocked
CREATE POLICY "Admins have full access to client_sessions"
  ON client_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast token lookup (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires_at ON client_sessions(expires_at);

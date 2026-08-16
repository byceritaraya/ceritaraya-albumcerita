-- ==========================================
-- Phase 1: Cerita Raya Database Foundation
-- Migration 1 of 4: clients table
-- ==========================================
-- Creates the top-level clients entity.
-- Clients represent the businesses/couples who purchase Cerita Raya services.
-- Each client can have multiple events.
--
-- Pattern mirrors the existing events table:
--   id (uuid)          = internal PK, used in all FK relations, never in URLs
--   client_code (text) = human-readable business ID: CLI-0001
-- ==========================================

-- 1. Sequence for generating human-readable client codes
CREATE SEQUENCE IF NOT EXISTS client_code_seq START 1;

-- 2. clients table
CREATE TABLE IF NOT EXISTS clients (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code  text        UNIQUE NOT NULL
                           DEFAULT ('CLI-' || lpad(nextval('client_code_seq')::text, 4, '0')),
  name         text        NOT NULL,
  contact_name text,
  whatsapp     text,
  email        text,
  notes        text,
  status       text        NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT check_client_status CHECK (status IN ('active', 'inactive'))
);

-- 3. updated_at trigger (reuses the existing function from init schema)
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- 5. RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Admins have full management access (mirrors existing is_admin() pattern)
CREATE POLICY "Admins have full access to clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role has full access (needed for server-side Service Role Key operations)
CREATE POLICY "Service role has full access to clients"
  ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No public access -- clients are internal data only

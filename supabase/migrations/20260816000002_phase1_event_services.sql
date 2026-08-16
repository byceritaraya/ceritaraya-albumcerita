-- ==========================================
-- Phase 1: Cerita Raya Database Foundation
-- Migration 3 of 4: event_services junction table
-- ==========================================
-- event_services is the junction between events and the service catalog.
-- One row = one service activated for one event.
-- UNIQUE (event_id, service_id) enforces one-of-each-service-per-event.
--
-- IMPORTANT:
-- The configuration JSONB column exists for future service-specific settings
-- (e.g. Web Invitation content). It is intentionally EMPTY for the
-- Disposable Camera service during Phase 1.
-- Existing camera configuration remains on the events table
-- (photos_per_guest, max_contributors, film_recipe_id, etc.)
-- and must NOT be migrated here until a future dedicated phase.
-- ==========================================

-- 1. event_services table
CREATE TABLE IF NOT EXISTS event_services (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  service_id    uuid        NOT NULL REFERENCES services(id),
  status        text        NOT NULL DEFAULT 'active',
  configuration jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT check_event_service_status
    CHECK (status IN ('pending_setup', 'active', 'suspended', 'archived')),

  CONSTRAINT uq_event_service
    UNIQUE (event_id, service_id)
);

-- 2. updated_at trigger
CREATE TRIGGER update_event_services_updated_at
  BEFORE UPDATE ON event_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_event_services_event_id ON event_services(event_id);
CREATE INDEX IF NOT EXISTS idx_event_services_service_id ON event_services(service_id);
CREATE INDEX IF NOT EXISTS idx_event_services_status ON event_services(status);

-- 4. RLS
ALTER TABLE event_services ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to event_services"
  ON event_services
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role has full access
CREATE POLICY "Service role has full access to event_services"
  ON event_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No public access

-- ==========================================
-- Phase 1: Cerita Raya Database Foundation
-- Migration 4 of 4: Add client_id to events + seed data
-- ==========================================
-- Steps:
--   1. Add client_id (nullable FK) to events
--   2. Insert the "Cerita Raya Internal" legacy client (CLI-0000)
--   3. Backfill all existing events with this legacy client
--   4. Enforce NOT NULL after backfill
--   5. Create event_services row (disposable-camera) for all existing events
--
-- IMPORTANT:
--   - Existing events.event_id, events.slug, events.id are NOT changed.
--   - Existing routes (/guest, /host, /album, /event, /join) are unaffected.
--   - Existing authentication mechanisms are unaffected.
--   - host_slug and guest_slug are NOT dropped (per Phase 1 constraints).
--   - Camera configuration stays on events.* columns (no migration to event_services.configuration).
-- ==========================================

-- 1. Add client_id FK to events (nullable initially)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- 2. Insert the legacy "Cerita Raya Internal" client
--    This client represents all events created before the Client model existed.
--    client_code is manually set to CLI-0000 to distinguish it from real clients
--    (real clients will receive CLI-0001 onward from the sequence).
--    ON CONFLICT DO NOTHING makes this safe to re-run.
INSERT INTO clients (id, client_code, name, notes, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CLI-0000',
  'Cerita Raya Internal',
  'Legacy client record. Automatically assigned to all events created before the Client model was introduced in Phase 1.',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Also protect against re-run via client_code conflict
-- (the above INSERT uses a fixed UUID so ON CONFLICT (id) handles re-runs)

-- 3. Backfill: assign all existing events that have no client_id to the legacy client
UPDATE events
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id IS NULL;

-- 4. Enforce NOT NULL now that all rows have been backfilled
ALTER TABLE events
  ALTER COLUMN client_id SET NOT NULL;

-- 5. Index for client_id lookups
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);

-- 6. Backfill event_services: create a 'disposable-camera' service row for all existing events.
--    All existing events are Disposable Camera events.
--    configuration is intentionally empty {} -- camera config stays on events.* columns.
--    ON CONFLICT DO NOTHING makes this safe to re-run.
INSERT INTO event_services (event_id, service_id, status, configuration)
SELECT
  e.id,
  s.id,
  'active',
  '{}'::jsonb
FROM events e
CROSS JOIN services s
WHERE s.slug = 'disposable-camera'
ON CONFLICT (event_id, service_id) DO NOTHING;

-- ==========================================
-- Verification queries (commented out -- run manually to confirm):
-- ==========================================
-- SELECT COUNT(*) FROM events WHERE client_id IS NULL;
--   → should return 0

-- SELECT c.client_code, c.name, COUNT(e.id) AS event_count
--   FROM clients c
--   LEFT JOIN events e ON e.client_id = c.id
--   GROUP BY c.id;
--   → should show CLI-0000 with all existing event count

-- SELECT es.status, COUNT(*) FROM event_services es
--   JOIN services s ON s.id = es.service_id
--   WHERE s.slug = 'disposable-camera'
--   GROUP BY es.status;
--   → should show 'active' with all existing event count

-- SELECT * FROM services ORDER BY created_at;
--   → should show disposable-camera and web-invitation

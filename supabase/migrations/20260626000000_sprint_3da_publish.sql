-- ==========================================
-- Sprint 3D-A — Unified Slug + Publish Foundation
-- ==========================================

-- Add publish tracking columns to events.
-- is_published gates the /album/[slug] public route.
-- published_at records when the album first went live.
--
-- NOTE: published_slug is intentionally NOT added.
-- The existing `slug` column serves as the single public URL identifier.
--
-- NOTE: host_slug and guest_slug are deprecated but NOT dropped yet.
-- New slug-based routing reads the `slug` column exclusively.
-- A future cleanup sprint will drop host_slug and guest_slug.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false NOT NULL;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- The existing idx_events_slug index already covers public album lookups.
-- No additional index required.

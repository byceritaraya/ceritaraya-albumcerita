-- ==========================================
-- AlbumCerita — Sprint 3C Additive Migration
-- ==========================================

-- 1. ADDITIVE COLUMNS to events
-- Add nullable columns for the Host/Guest access model and metadata.
ALTER TABLE events
ADD COLUMN host_slug text UNIQUE,
ADD COLUMN guest_slug text UNIQUE,
ADD COLUMN host_pin_hash text,
ADD COLUMN guest_pin_hash text,
ADD COLUMN host_name text,
ADD COLUMN theme text DEFAULT 'Sage';

-- 2. CREATE contributors table if it doesn't exist
-- (Verified it already exists, but adding IF NOT EXISTS for safety)
CREATE TABLE IF NOT EXISTS contributors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. ALTER pin_attempts to support guest/host slugs
-- We add a target_slug column. We keep event_id for backward compatibility.
ALTER TABLE pin_attempts
ADD COLUMN target_slug text;

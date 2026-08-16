-- ==========================================
-- Phase 1: Cerita Raya Database Foundation
-- Migration 2 of 4: services catalog table
-- ==========================================
-- services is a predefined catalog of product types.
-- These are not user-created -- they are seeded by Cerita Raya.
-- New services are added by the engineering team as new products launch.
-- ==========================================

-- 1. services table
CREATE TABLE IF NOT EXISTS services (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- 3. RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to services"
  ON services
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role has full access
CREATE POLICY "Service role has full access to services"
  ON services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No public access -- service catalog is internal

-- 4. Seed: initial service catalog
-- ON CONFLICT DO NOTHING ensures this is safe to re-run.
INSERT INTO services (slug, name, description) VALUES
  (
    'disposable-camera',
    'Disposable Camera',
    'Analog-style photo capture with film processing, guest management, and public album release.'
  ),
  (
    'web-invitation',
    'Web Invitation',
    'Digital wedding invitation with RSVP, event schedule, and couple information.'
  )
ON CONFLICT (slug) DO NOTHING;

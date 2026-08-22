-- ==========================================
-- Phase 2J.1: Wedding Invitation Service Foundation
-- ==========================================
--
-- This migration is fully additive and non-destructive.
-- It does NOT modify any existing Disposable Camera tables,
-- events schema, or existing RLS policies.
--
-- Changes:
--   1. Fix service slug: web-invitation → wedding-invitation
--   2. Create wedding_invitation_templates  (template catalog)
--   3. Create wedding_invitations           (1:1 with events)
--   4. Create wedding_invitation_sections   (show/hide/order sections)
--   5. Create wedding_wishes                (public guest wishes)
-- ==========================================

-- ── 1. Fix service slug ───────────────────────────────────────────────────────
-- The initial seed used 'web-invitation'. The correct canonical slug is
-- 'wedding-invitation' (already used throughout the admin UI and sidebar).
-- This UPDATE is safe to run multiple times (idempotent via WHERE clause).
UPDATE services
  SET slug        = 'wedding-invitation',
      name        = 'Wedding Invitation',
      description = 'Beautiful digital wedding invitations with couple details, event schedule, gallery, and guest wishes.'
WHERE slug = 'web-invitation';

-- Insert if neither slug exists yet (safe re-run guard)
INSERT INTO services (slug, name, description, active)
  VALUES (
    'wedding-invitation',
    'Wedding Invitation',
    'Beautiful digital wedding invitations with couple details, event schedule, gallery, and guest wishes.',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ── 2. wedding_invitation_templates ──────────────────────────────────────────
-- A catalog of available invitation templates.
-- Templates are seeded by engineering — not user-created.
-- Template 01 will be seeded in a future phase.
CREATE TABLE IF NOT EXISTS wedding_invitation_templates (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text        UNIQUE NOT NULL,
  name          text        NOT NULL,
  description   text,
  thumbnail_url text,
  preview_url   text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_wedding_invitation_templates_updated_at
  BEFORE UPDATE ON wedding_invitation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wit_slug     ON wedding_invitation_templates(slug);
CREATE INDEX IF NOT EXISTS idx_wit_active   ON wedding_invitation_templates(is_active);

ALTER TABLE wedding_invitation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to wedding_invitation_templates"
  ON wedding_invitation_templates FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role has full access to wedding_invitation_templates"
  ON wedding_invitation_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public can read active templates (needed for future public renderer)
CREATE POLICY "Public can view active wedding invitation templates"
  ON wedding_invitation_templates FOR SELECT TO anon
  USING (is_active = true);

-- ── 3. wedding_invitations ────────────────────────────────────────────────────
-- One row per event that uses the Wedding Invitation service.
-- UNIQUE(event_id) enforces the 1-Event = 1-Service contract at DB level.
-- The event's existing slug column serves as the public identifier —
-- no new slug field is needed here.
CREATE TABLE IF NOT EXISTS wedding_invitations (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id   uuid        REFERENCES wedding_invitation_templates(id),
  status        text        NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_wi_event_id
    UNIQUE (event_id),

  CONSTRAINT check_wi_status
    CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TRIGGER update_wedding_invitations_updated_at
  BEFORE UPDATE ON wedding_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wi_event_id    ON wedding_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_wi_template_id ON wedding_invitations(template_id);
CREATE INDEX IF NOT EXISTS idx_wi_status      ON wedding_invitations(status);

ALTER TABLE wedding_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to wedding_invitations"
  ON wedding_invitations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role has full access to wedding_invitations"
  ON wedding_invitations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public read for published invitations (future renderer)
CREATE POLICY "Public can view published wedding invitations"
  ON wedding_invitations FOR SELECT TO anon
  USING (status = 'published');

-- ── 4. wedding_invitation_sections ───────────────────────────────────────────
-- Each row represents one content section of a wedding invitation.
-- Supports show/hide (enabled) and drag-and-drop ordering (sort_order).
-- data JSONB carries section-specific content (titles, text, image refs, etc.)
--
-- Supported section_key values for V1 (RSVP intentionally excluded):
--   cover, opening, couple, event-details, love-story, gallery,
--   wishes, gift, live-stream, closing
--
-- All sections are optional and independent.
CREATE TABLE IF NOT EXISTS wedding_invitation_sections (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id  uuid        NOT NULL REFERENCES wedding_invitations(id) ON DELETE CASCADE,
  section_key    text        NOT NULL,
  enabled        boolean     NOT NULL DEFAULT true,
  sort_order     integer     NOT NULL DEFAULT 0,
  data           jsonb       NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_wis_invitation_section
    UNIQUE (invitation_id, section_key),

  CONSTRAINT check_wis_section_key
    CHECK (section_key IN (
      'cover', 'opening', 'couple', 'event-details',
      'love-story', 'gallery', 'wishes', 'gift',
      'live-stream', 'closing'
    ))
);

CREATE TRIGGER update_wedding_invitation_sections_updated_at
  BEFORE UPDATE ON wedding_invitation_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wis_invitation_id ON wedding_invitation_sections(invitation_id);
CREATE INDEX IF NOT EXISTS idx_wis_sort_order    ON wedding_invitation_sections(invitation_id, sort_order);

ALTER TABLE wedding_invitation_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to wedding_invitation_sections"
  ON wedding_invitation_sections FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role has full access to wedding_invitation_sections"
  ON wedding_invitation_sections FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public can read sections of published invitations
CREATE POLICY "Public can view sections of published wedding invitations"
  ON wedding_invitation_sections FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM wedding_invitations wi
      WHERE wi.id = wedding_invitation_sections.invitation_id
        AND wi.status = 'published'
    )
  );

-- ── 5. wedding_wishes ─────────────────────────────────────────────────────────
-- Stores wishes submitted by guests on the public invitation page.
-- Admin moderation (is_visible toggle) will be implemented in a later phase.
-- RSVP data is explicitly NOT stored here — that belongs to a future table.
CREATE TABLE IF NOT EXISTS wedding_wishes (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id  uuid        NOT NULL REFERENCES wedding_invitations(id) ON DELETE CASCADE,
  guest_name     text        NOT NULL,
  message        text        NOT NULL,
  is_visible     boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT check_ww_guest_name_length
    CHECK (char_length(guest_name) BETWEEN 1 AND 100),

  CONSTRAINT check_ww_message_length
    CHECK (char_length(message) BETWEEN 1 AND 2000)
);

CREATE TRIGGER update_wedding_wishes_updated_at
  BEFORE UPDATE ON wedding_wishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ww_invitation_id ON wedding_wishes(invitation_id);
CREATE INDEX IF NOT EXISTS idx_ww_visible        ON wedding_wishes(invitation_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_ww_created_at     ON wedding_wishes(invitation_id, created_at DESC);

ALTER TABLE wedding_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to wedding_wishes"
  ON wedding_wishes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role has full access to wedding_wishes"
  ON wedding_wishes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public can submit wishes (INSERT only, no SELECT — moderation is admin-side)
CREATE POLICY "Public can submit wedding wishes"
  ON wedding_wishes FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_invitations wi
      WHERE wi.id = wedding_wishes.invitation_id
        AND wi.status = 'published'
    )
  );

-- Public can read visible wishes of published invitations
CREATE POLICY "Public can read visible wedding wishes"
  ON wedding_wishes FOR SELECT TO anon
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM wedding_invitations wi
      WHERE wi.id = wedding_wishes.invitation_id
        AND wi.status = 'published'
    )
  );

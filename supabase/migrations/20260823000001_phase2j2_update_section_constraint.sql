-- ==========================================
-- Phase 2J.2: Update Section Constraint & Register Arunika
-- ==========================================

-- 1. Update Section Key Constraint
ALTER TABLE wedding_invitation_sections DROP CONSTRAINT check_wis_section_key;

ALTER TABLE wedding_invitation_sections ADD CONSTRAINT check_wis_section_key
  CHECK (section_key IN (
    'cover', 'opening', 'couple', 'event_details', 'love_story', 
    'gallery', 'location', 'wishes', 'gift', 'live_stream', 
    'closing', 'countdown', 'rsvp', 'video', 'music', 'custom_section'
  ));

-- 2. Register Arunika Template
INSERT INTO wedding_invitation_templates (slug, name, description, is_active)
VALUES (
  'arunika',
  'Arunika',
  'A classic and elegant wedding invitation template with modern typography and smooth animations.',
  true
)
ON CONFLICT (slug) DO NOTHING;

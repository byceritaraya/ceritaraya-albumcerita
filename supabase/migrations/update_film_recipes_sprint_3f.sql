-- Migration: Update Film Recipes to Final Approved List

-- 1. Insert the new approved recipes
INSERT INTO film_recipes (name, slug, description, settings)
VALUES 
  ('AlbumCerita Signature', 'albumcerita-signature', 'Balanced & Timeless', '{"brightness": 1.0, "contrast": 1.0, "saturation": 1.0, "warmth": 0, "grain": "none", "vignette": "none"}'),
  ('Golden Memories', 'golden-memories', 'Warm Nostalgic Glow', '{"brightness": 1.1, "contrast": 1.0, "saturation": 1.3, "warmth": 50, "grain": "medium", "vignette": "soft"}'),
  ('Soft Romance', 'soft-romance', 'Bright & Airy', '{"brightness": 1.3, "contrast": 0.7, "saturation": 1.0, "warmth": 10, "grain": "none", "vignette": "none"}'),
  ('Timeless Portrait', 'timeless-portrait', 'Elegant Skin Tones', '{"brightness": 1.05, "contrast": 1.05, "saturation": 0.5, "warmth": -5, "grain": "light", "vignette": "none"}'),
  ('Midnight Cinema', 'midnight-cinema', 'Cinematic Night Look', '{"brightness": 0.6, "contrast": 1.5, "saturation": 0.8, "warmth": -30, "grain": "heavy", "vignette": "strong"}')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings,
  active = true;

-- 2. Migrate any existing events to use 'AlbumCerita Signature'
UPDATE events 
SET film_recipe_id = (SELECT id FROM film_recipes WHERE slug = 'albumcerita-signature')
WHERE film_recipe_id IN (
  SELECT id FROM film_recipes WHERE slug IN ('aero-100', 'amber-400', 'chrome-800', 'classic-bw')
) OR film_recipe_id IS NULL;

-- 3. Remove or disable the old incorrect recipes
DELETE FROM film_recipes 
WHERE slug IN ('aero-100', 'amber-400', 'chrome-800', 'classic-bw');

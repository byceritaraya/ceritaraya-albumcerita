-- Sprint 3F: Film Identity System (Film Recipes)
-- Adds film_recipes table and updates events to link to a recipe.

CREATE TABLE film_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  settings jsonb NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Insert 5 default film recipes
INSERT INTO film_recipes (id, name, slug, description, settings) VALUES
  (gen_random_uuid(), 'AlbumCerita Signature', 'albumcerita-signature', 'Balanced & Timeless (Default)', '{"brightness": 1.0, "contrast": 1.0, "saturation": 1.0, "warmth": 0, "grain": "light", "vignette": "none"}'),
  (gen_random_uuid(), 'Golden Memories', 'golden-memories', 'Warm Nostalgic Glow', '{"brightness": 1.02, "contrast": 1.05, "saturation": 1.10, "warmth": 15, "grain": "medium", "vignette": "soft"}'),
  (gen_random_uuid(), 'Soft Romance', 'soft-romance', 'Bright & Airy', '{"brightness": 1.08, "contrast": 0.95, "saturation": 0.90, "warmth": 5, "grain": "light", "vignette": "none"}'),
  (gen_random_uuid(), 'Timeless Portrait', 'timeless-portrait', 'Elegant Skin Tones', '{"brightness": 1.0, "contrast": 1.08, "saturation": 0.95, "warmth": -5, "grain": "medium", "vignette": "medium"}'),
  (gen_random_uuid(), 'Midnight Cinema', 'midnight-cinema', 'Cinematic Night Look', '{"brightness": 0.90, "contrast": 1.15, "saturation": 0.85, "warmth": -15, "grain": "heavy", "vignette": "strong"}');

-- Add film_recipe_id to events table
-- Retrieve the 'AlbumCerita Signature' recipe ID to use as a default for existing events
DO $$
DECLARE
  default_recipe_id uuid;
BEGIN
  SELECT id INTO default_recipe_id FROM film_recipes WHERE slug = 'albumcerita-signature' LIMIT 1;
  
  ALTER TABLE events ADD COLUMN film_recipe_id uuid REFERENCES film_recipes(id);
  
  -- Update existing events
  UPDATE events SET film_recipe_id = default_recipe_id WHERE film_recipe_id IS NULL;
  
  -- Now enforce NOT NULL
  ALTER TABLE events ALTER COLUMN film_recipe_id SET NOT NULL;
END $$;

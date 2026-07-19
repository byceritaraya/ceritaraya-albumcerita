-- Migration: Add Film Recipes to existing Database

-- 1. Create the film_recipes table if it doesn't exist
CREATE TABLE IF NOT EXISTS film_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  settings jsonb NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Grant access to default Supabase roles (Fixes "permission denied for table film_recipes")
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.film_recipes TO anon, authenticated, service_role;

-- 2. Insert the standard recipes
INSERT INTO film_recipes (name, slug, description, settings)
VALUES 
  ('Aero 100', 'aero-100', 'Clean, bright, vivid colors', '{"brightness": 1.05, "contrast": 1.05, "saturation": 1.1, "warmth": 0, "grain": "none", "vignette": "none"}'),
  ('Amber 400', 'amber-400', 'Warm golden tones with soft shadows', '{"brightness": 1.0, "contrast": 0.95, "saturation": 1.05, "warmth": 15, "grain": "light", "vignette": "soft"}'),
  ('Chrome 800', 'chrome-800', 'Moody, desaturated with heavy grain', '{"brightness": 0.95, "contrast": 1.15, "saturation": 0.8, "warmth": -5, "grain": "heavy", "vignette": "strong"}'),
  ('Classic B&W', 'classic-bw', 'High contrast monochrome', '{"brightness": 1.0, "contrast": 1.2, "saturation": 0.0, "warmth": 0, "grain": "medium", "vignette": "medium"}')
ON CONFLICT (slug) DO NOTHING;

-- 3. Add the column to events (nullable temporarily to update existing rows)
ALTER TABLE events ADD COLUMN IF NOT EXISTS film_recipe_id uuid REFERENCES film_recipes(id);

-- 4. Update existing events to use 'Amber 400' (or the first available recipe)
UPDATE events SET film_recipe_id = (SELECT id FROM film_recipes WHERE slug = 'amber-400') WHERE film_recipe_id IS NULL;

-- 5. Make the column NOT NULL
ALTER TABLE events ALTER COLUMN film_recipe_id SET NOT NULL;

-- 6. Enable RLS and add policies for film_recipes
ALTER TABLE film_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active film recipes" ON film_recipes 
  FOR SELECT TO public
  USING (active = true);

CREATE POLICY "Admins have full access to film recipes" ON film_recipes 
  FOR ALL TO authenticated 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- Migration: Fix Film Recipe Settings
-- Context: ColorProcessor was using `warmth * 2` for sepia (causing sepia(100%) for warmth=50),
-- and `Math.abs(warmth) / 100` for blue overlay. This migration corrects warmth values
-- to produce the intended look now that the processor uses the correct scale:
--   - Positive warmth (0–100): used directly as sepia(warmth%)
--   - Negative warmth (-100–0): used as rgba blue overlay at abs(warmth)/200 opacity
-- AlbumCerita Signature was all-neutral and had no visible effect — given subtle grain.

UPDATE film_recipes
SET settings = '{"brightness": 1.02, "contrast": 1.02, "saturation": 1.0, "warmth": 0, "grain": "light", "vignette": "none"}'
WHERE slug = 'albumcerita-signature';

UPDATE film_recipes
SET settings = '{"brightness": 1.1, "contrast": 1.0, "saturation": 1.2, "warmth": 30, "grain": "medium", "vignette": "soft"}'
WHERE slug = 'golden-memories';

UPDATE film_recipes
SET settings = '{"brightness": 1.25, "contrast": 0.85, "saturation": 1.05, "warmth": 8, "grain": "none", "vignette": "none"}'
WHERE slug = 'soft-romance';

UPDATE film_recipes
SET settings = '{"brightness": 1.05, "contrast": 1.05, "saturation": 0.6, "warmth": -8, "grain": "light", "vignette": "none"}'
WHERE slug = 'timeless-portrait';

-- Midnight Cinema: keep strong look but balance the blue tint for the new scale
UPDATE film_recipes
SET settings = '{"brightness": 0.65, "contrast": 1.4, "saturation": 0.85, "warmth": -40, "grain": "heavy", "vignette": "strong"}'
WHERE slug = 'midnight-cinema';

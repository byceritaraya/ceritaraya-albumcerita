-- ==========================================
-- Sprint 3F: Film Roll Development Gate
-- Adds roll_developed_at to contributors to enforce server-side
-- single-development guarantee. Once a roll is developed, the
-- backend will reject any further upload attempts from the same
-- contributor for the same event.
-- ==========================================

ALTER TABLE contributors
  ADD COLUMN roll_developed_at timestamptz;

COMMENT ON COLUMN contributors.roll_developed_at IS
  'Timestamp when this contributor developed their film roll. '
  'NULL = roll not yet developed. '
  'Non-NULL = roll has been developed and the gate is permanently closed. '
  'The Film Recipe is applied exactly once during development. '
  'After development, the gallery always displays the stored processed image '
  'and never re-applies the Film Recipe.';

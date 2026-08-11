-- ==========================================
-- Add auto_publish_at to events
-- ==========================================

ALTER TABLE events
  ADD COLUMN auto_publish_at timestamptz;

COMMENT ON COLUMN events.auto_publish_at IS
  'Timestamp when the event should automatically be considered published. If NULL, manual publish is required.';

-- Update RLS policies for photos
-- Drop existing policy
DROP POLICY IF EXISTS "Public can view active visible photos of published events" ON photos;

-- Recreate policy with auto_publish_at condition
CREATE POLICY "Public can view active visible photos of published events" ON photos 
  FOR SELECT TO public
  USING (
    deleted_at IS NULL 
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM events 
      WHERE id = photos.event_id 
      AND (is_published = true OR (auto_publish_at IS NOT NULL AND now() >= auto_publish_at))
    )
  );

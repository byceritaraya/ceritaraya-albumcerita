-- ==========================================
-- Phase 2H: Add encrypted Host PIN for Admin Retrieval
-- ==========================================

-- 1. ADDITIVE COLUMN to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS host_pin_encrypted text;

-- 2. Update the RPC to store host_pin_encrypted
CREATE OR REPLACE FUNCTION create_event_with_services(
  p_event_id          text,
  p_slug              text,
  p_name              text,
  p_event_type        text,
  p_event_date        date,
  p_client_id         uuid,
  p_pin_hash          text,
  p_host_pin_hash     text,
  p_guest_pin_hash    text,
  p_guest_pin         text,
  p_photos_per_guest  int,
  p_max_contributors  int,
  p_retention_months  int,
  p_expires_at        timestamptz,
  p_film_recipe_id    uuid,
  p_service_ids       uuid[],
  p_host_pin_encrypted text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_uuid  uuid;
  v_service_id  uuid;
BEGIN
  -- Insert the event row
  INSERT INTO events (
    event_id,
    slug,
    name,
    event_type,
    event_date,
    client_id,
    pin_hash,
    host_pin_hash,
    host_pin_encrypted,
    guest_pin_hash,
    guest_pin,
    photos_per_guest,
    max_contributors,
    retention_months,
    expires_at,
    film_recipe_id,
    state
  ) VALUES (
    p_event_id,
    p_slug,
    p_name,
    p_event_type::event_type,
    p_event_date,
    p_client_id,
    p_pin_hash,
    p_host_pin_hash,
    p_host_pin_encrypted,
    p_guest_pin_hash,
    p_guest_pin,
    p_photos_per_guest,
    p_max_contributors,
    p_retention_months,
    p_expires_at,
    p_film_recipe_id,
    'draft'
  )
  RETURNING id INTO v_event_uuid;

  -- Insert one event_services row per selected service
  FOREACH v_service_id IN ARRAY p_service_ids
  LOOP
    INSERT INTO event_services (event_id, service_id, status, configuration)
    VALUES (v_event_uuid, v_service_id, 'active', '{}');
  END LOOP;

  -- Return the human-readable event_id so the caller can redirect
  RETURN p_event_id;
END;
$$;

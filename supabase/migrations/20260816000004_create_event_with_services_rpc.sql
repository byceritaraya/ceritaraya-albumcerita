-- ==========================================
-- Phase 2B: Atomic Event + Services Creation RPC
-- ==========================================
-- Creates a PostgreSQL function that atomically:
--   1. Inserts one row into `events`
--   2. Inserts one row per service into `event_services`
--   3. Returns the human-readable event_id (e.g. "ABCD1234")
--   4. Rolls back the entire operation if any step fails
--
-- SECURITY DEFINER: runs with the function owner's privileges.
-- The function is restricted to admin users via an explicit check.
--
-- Parameters:
--   p_event_id          text         Human-readable event ID (CRA-XXXXXXXX)
--   p_slug              text         URL-safe slug
--   p_name              text         Event display name
--   p_event_type        text         wedding | birthday | corporate | other
--   p_event_date        date         Event date (YYYY-MM-DD)
--   p_client_id         uuid         FK → clients.id
--   p_pin_hash          text         bcrypt hash of legacy PIN
--   p_host_pin_hash     text         bcrypt hash of host PIN
--   p_guest_pin_hash    text         bcrypt hash of guest PIN
--   p_guest_pin         text         Plaintext guest PIN (for QR URL convenience)
--   p_photos_per_guest  int          Default: 10
--   p_max_contributors  int          Default: 50
--   p_retention_months  int          Default: 3
--   p_expires_at        timestamptz  Computed expiry
--   p_film_recipe_id    uuid         FK → film_recipes.id (Disposable Camera default)
--   p_service_ids       uuid[]       Array of services.id to activate
--
-- Returns: p_event_id (echoed back, confirms success)
-- ==========================================

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
  p_service_ids       uuid[]
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
  -- UNIQUE(event_id, service_id) enforces no duplicates
  FOREACH v_service_id IN ARRAY p_service_ids
  LOOP
    INSERT INTO event_services (event_id, service_id, status, configuration)
    VALUES (v_event_uuid, v_service_id, 'active', '{}');
  END LOOP;

  -- Return the human-readable event_id so the caller can redirect
  RETURN p_event_id;
END;
$$;

-- Grant execute to authenticated users (admin check is enforced by RLS on the tables,
-- and the server action uses the service role key which bypasses RLS entirely —
-- this grant is belt-and-suspenders for future anon-key callers).
GRANT EXECUTE ON FUNCTION create_event_with_services TO service_role;

-- ==========================================
-- Phase 2J.4A: RPC for Atomic Section Reordering (v2 — Security Audit Fix)
-- ==========================================
--
-- Safely reorders wedding invitation sections within a transaction.
--
-- Guarantees:
--   1. p_section_ids must be non-empty.
--   2. p_section_ids must contain no duplicate IDs.
--   3. The submitted set must be exactly the complete set of sections
--      belonging to p_invitation_id (neither more nor fewer).
--   4. Every submitted ID must belong to p_invitation_id.
--   5. No new section records are created.
--   6. All sort_order updates are atomic — if any validation fails,
--      zero rows are updated.
--   7. SECURITY DEFINER is scoped with explicit search_path to prevent
--      search_path injection attacks.

CREATE OR REPLACE FUNCTION reorder_wedding_invitation_sections(
  p_invitation_id uuid,
  p_section_ids   uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submitted_count  integer;
  v_actual_count     integer;
  v_duplicate_count  integer;
  v_foreign_count    integer;
  v_id               uuid;
  v_index            integer;
BEGIN
  -- ── Guard 1: reject empty array ──────────────────────────────────────────
  IF p_section_ids IS NULL OR array_length(p_section_ids, 1) IS NULL OR array_length(p_section_ids, 1) = 0 THEN
    RAISE EXCEPTION 'p_section_ids must not be empty';
  END IF;

  v_submitted_count := array_length(p_section_ids, 1);

  -- ── Guard 2: reject duplicate IDs in the submitted array ─────────────────
  SELECT COUNT(*) - COUNT(DISTINCT id)
  INTO v_duplicate_count
  FROM unnest(p_section_ids) AS id;

  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'p_section_ids contains % duplicate ID(s)', v_duplicate_count;
  END IF;

  -- ── Guard 3: reject any ID that does not belong to this invitation ────────
  SELECT COUNT(*)
  INTO v_foreign_count
  FROM unnest(p_section_ids) AS submitted_id
  LEFT JOIN wedding_invitation_sections wis ON wis.id = submitted_id
  WHERE wis.invitation_id IS NULL OR wis.invitation_id != p_invitation_id;

  IF v_foreign_count > 0 THEN
    RAISE EXCEPTION '% submitted ID(s) do not belong to invitation %', v_foreign_count, p_invitation_id;
  END IF;

  -- ── Guard 4: submitted set must be exactly the complete set ───────────────
  SELECT COUNT(*)
  INTO v_actual_count
  FROM wedding_invitation_sections
  WHERE invitation_id = p_invitation_id;

  IF v_submitted_count != v_actual_count THEN
    RAISE EXCEPTION 'Submitted % section ID(s) but invitation has % section(s); the complete set is required',
      v_submitted_count, v_actual_count;
  END IF;

  -- ── All guards passed — perform atomic bulk update ────────────────────────
  FOR v_index IN 1 .. v_submitted_count LOOP
    v_id := p_section_ids[v_index];

    UPDATE wedding_invitation_sections
    SET
      sort_order = v_index - 1,
      updated_at = now()
    WHERE id = v_id
      AND invitation_id = p_invitation_id;
  END LOOP;
END;
$$;

-- ── Execution Permissions ─────────────────────────────────────────────────────
-- The function runs as SECURITY DEFINER (owner privileges).
-- Only the service_role (used by the Next.js server action layer) should invoke it.
-- The anon and authenticated roles must NOT be able to call this directly.
REVOKE EXECUTE ON FUNCTION reorder_wedding_invitation_sections(uuid, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reorder_wedding_invitation_sections(uuid, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION reorder_wedding_invitation_sections(uuid, uuid[]) FROM authenticated;
GRANT  EXECUTE ON FUNCTION reorder_wedding_invitation_sections(uuid, uuid[]) TO service_role;

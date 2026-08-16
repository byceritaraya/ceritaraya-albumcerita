/**
 * Shared event generation utilities.
 *
 * Single source of truth for:
 *   - Event ID generation  (generateEventId)
 *   - Slug generation       (generateSlug)
 *   - Slug collision resolution (resolveSlug)
 *   - Expiry timestamp      (getExpiresAt)
 *
 * PIN generation lives in @/lib/pin — import from there.
 * These functions are intentionally pure / dependency-free where possible.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Event ID ─────────────────────────────────────────────────────────────────

/**
 * Generates an 8-character uppercase alphanumeric Event ID.
 * Omits visually ambiguous characters (O, 0, I, 1).
 *
 * Example: "ABCD2345"
 */
export function generateEventId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// ── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug: slugify(event_name) + "-" + ddMMyy(event_date).
 *
 * Examples:
 *   "Budi & Ari Wedding", "2026-02-25" → "budi-ari-wedding-250226"
 *   "Aaron's Birthday",   "2026-07-01" → "aarons-birthday-010726"
 *
 * @param name      - Event name (human-readable)
 * @param eventDate - ISO date string: "YYYY-MM-DD"
 */
export function generateSlug(name: string, eventDate: string): string {
  const [year, month, day] = eventDate.split('-');
  const suffix = `${day}${month}${year.slice(2)}`;

  const base = name
    .toLowerCase()
    .replace(/[''`]/g, '')           // strip apostrophes
    .replace(/&/g, 'and')            // & → and
    .replace(/[^a-z0-9\s]/g, ' ')   // other special chars → space
    .trim()
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
    .slice(0, 40)
    .replace(/-+$/, '');             // trim trailing hyphens after slice

  return `${base}-${suffix}`;
}

/**
 * Resolves slug collisions by appending -2, -3, etc.
 * Stops after 99 attempts.
 *
 * @param baseSlug - The initial generated slug
 * @param supabase - A Supabase client (server/service role)
 */
export async function resolveSlug(
  baseSlug: string,
  supabase: SupabaseClient
): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;
  while (counter <= 99) {
    const { data } = await supabase
      .from('events')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
  return candidate;
}

// ── Expiry ────────────────────────────────────────────────────────────────────

/**
 * Returns an ISO timestamp `retentionMonths` months from now.
 */
export function getExpiresAt(retentionMonths: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + retentionMonths);
  return date.toISOString();
}

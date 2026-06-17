/**
 * PIN flash cookie — one-time display pattern.
 *
 * Used by:
 *   - createEvent (Sprint 1B): sets cookie after insert, before redirect.
 *   - resetPin   (future):     sets cookie after update, before redirect.
 *
 * The detail page reads the cookie in a Server Component and passes the PIN
 * as a prop to <PinBanner>, which calls clearPinFlash() on mount to delete it.
 *
 * Cookie spec:
 *   Name    : pin_flash
 *   Value   : `{eventId}:{pin}`  — scoped to an event so stale cookies
 *             from a different event are ignored.
 *   httpOnly: true  — not readable by client-side JS
 *   sameSite: strict
 *   path    : /admin/events
 *   maxAge  : 300s (5 minutes) — auto-expires if page is never visited
 */

export const PIN_FLASH_COOKIE = 'pin_flash';
export const PIN_FLASH_MAX_AGE = 300; // seconds

/** Encodes eventId + raw PIN into the cookie value. */
export function encodePinFlash(eventId: string, pin: string, isReset: boolean = false): string {
  return `${eventId}:${pin}${isReset ? ':reset' : ''}`;
}

/**
 * Decodes the cookie value.
 * Returns the PIN only if the cookie belongs to the expected event.
 */
export function decodePinFlash(
  cookieValue: string | undefined,
  eventId: string
): { pin: string; isReset: boolean } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(':');
  if (parts.length < 2) return null;
  if (parts[0] !== eventId) return null;
  const pin = parts[1];
  const isReset = parts[2] === 'reset';
  return { pin, isReset };
}

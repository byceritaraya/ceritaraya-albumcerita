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

/** Encodes eventId + raw PINs into the cookie value using base64 JSON payload. */
export function encodePinFlash(eventId: string, pin: string, isReset: boolean = false, hostPin?: string, guestPin?: string): string {
  const payload = JSON.stringify({ pin, isReset, hostPin, guestPin });
  const b64 = Buffer.from(payload).toString('base64');
  return `${eventId}:${b64}`;
}

/**
 * Decodes the cookie value.
 * Returns the PINs only if the cookie belongs to the expected event.
 */
export function decodePinFlash(
  cookieValue: string | undefined,
  eventId: string
): { pin: string; isReset: boolean; hostPin?: string; guestPin?: string } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(':');
  if (parts.length < 2) return null;
  if (parts[0] !== eventId) return null;
  
  try {
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload && typeof payload === 'object' && 'pin' in payload) {
      return {
        pin: payload.pin,
        isReset: !!payload.isReset,
        hostPin: payload.hostPin,
        guestPin: payload.guestPin
      };
    }
  } catch {
    // Fallback to old format
    const pin = parts[1];
    const isReset = parts[2] === 'reset';
    return { pin, isReset };
  }
  
  return null;
}

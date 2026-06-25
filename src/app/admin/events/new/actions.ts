'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { generatePin, hashPin } from '@/lib/pin';
import {
  encodePinFlash,
  PIN_FLASH_COOKIE,
  PIN_FLASH_MAX_AGE,
} from '@/lib/pin-flash';

// ── Generators ──────────────────────────────────────────────────────────────

/** 8-char uppercase alphanumeric ID, omitting visually ambiguous chars. */
function generateEventId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

/**
 * URL-safe slug: slugify(event_name) + "-" + ddMMyy(event_date)
 *
 * Examples:
 *   "Budi & Ari Wedding", "2026-02-25" → "budi-ari-wedding-250226"
 *   "Aaron's Birthday",   "2026-07-01" → "aarons-birthday-010726"
 */
function generateSlug(name: string, eventDate: string): string {
  const [year, month, day] = eventDate.split('-');
  const suffix = `${day}${month}${year.slice(2)}`;

  const base = name
    .toLowerCase()
    .replace(/[''`]/g, '')            // strip apostrophes
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
 * Resolve slug collisions by appending -2, -3, etc.
 * Stops after 99 attempts (effectively impossible in practice).
 */
async function resolveSlug(
  baseSlug: string,
  supabase: ReturnType<typeof createServiceClient>
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

/** ISO timestamp for when the event expires, based on retention. */
function getExpiresAt(retentionMonths: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + retentionMonths);
  return date.toISOString();
}

// ── Action ───────────────────────────────────────────────────────────────────

export type CreateEventState = {
  error?: string;
};

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const name = (formData.get('name') as string)?.trim();
  const eventDate = (formData.get('event_date') as string)?.trim();
  const eventType = (formData.get('event_type') as string)?.trim();
  const retentionMonths = Number(formData.get('retention_months'));
  const maxContributors = Number(formData.get('max_contributors'));
  const photosPerGuest = Number(formData.get('photos_per_guest'));
  const hostName = (formData.get('host_name') as string)?.trim() || null;
  const theme = (formData.get('theme') as string)?.trim() || 'Sage';

  // Validation
  if (!name) return { error: 'Event name is required.' };
  if (!eventDate) return { error: 'Event date is required.' };
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { error: 'Invalid date format.' };

  const VALID_EVENT_TYPES = ['wedding', 'birthday', 'corporate', 'other'] as const;
  if (!VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number]))
    return { error: 'Invalid event type.' };
  if (![1, 3, 6, 12].includes(retentionMonths))
    return { error: 'Invalid retention months value.' };
  if (![20, 50, 100, 9999].includes(maxContributors))
    return { error: 'Invalid max contributors value.' };
  if (![5, 10, 20, 36].includes(photosPerGuest))
    return { error: 'Invalid photos per guest value.' };

  const eventId = generateEventId();
  const baseSlug = generateSlug(name, eventDate);
  const expiresAt = getExpiresAt(retentionMonths);

  // Generate PINs
  const pin = generatePin();
  const pinHash = hashPin(pin);
  const hostPin = generatePin();
  const hostPinHash = hashPin(hostPin);
  const guestPin = generatePin();
  const guestPinHash = hashPin(guestPin);

  const supabase = createServiceClient();

  // Resolve slug collisions
  const slug = await resolveSlug(baseSlug, supabase);

  const { error } = await supabase.from('events').insert({
    event_id: eventId,
    slug,
    pin_hash: pinHash,
    name,
    event_type: eventType,
    event_date: eventDate,
    state: 'draft',
    photos_per_guest: photosPerGuest,
    max_contributors: maxContributors,
    retention_months: retentionMonths,
    expires_at: expiresAt,
    host_pin_hash: hostPinHash,
    guest_pin_hash: guestPinHash,
    guest_pin: guestPin,  // kept for QR-friendly URL convenience
    host_name: hostName,
    theme,
  });

  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.set(PIN_FLASH_COOKIE, encodePinFlash(eventId, pin, false, hostPin, guestPin), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/admin/events',
    maxAge: PIN_FLASH_MAX_AGE,
  });

  redirect(`/admin/events/${eventId}`);
}

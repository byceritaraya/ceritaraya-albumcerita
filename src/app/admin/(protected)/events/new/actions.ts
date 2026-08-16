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
import {
  generateEventId,
  generateSlug,
  resolveSlug,
  getExpiresAt,
} from '@/lib/event-generators';

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
  const filmRecipeId = (formData.get('film_recipe_id') as string)?.trim();
  const autoPublishAt = (formData.get('auto_publish_at') as string)?.trim() || null;

  // Validation
  if (!name) return { error: 'Event name is required.' };
  if (!eventDate) return { error: 'Event date is required.' };
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { error: 'Invalid date format.' };
  if (!filmRecipeId) return { error: 'Film recipe is required.' };

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
    film_recipe_id: filmRecipeId,
    auto_publish_at: autoPublishAt ? new Date(autoPublishAt).toISOString() : null,
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

'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';
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

/** URL-safe slug: slugified name + event ID suffix. */
function generateSlug(name: string, eventId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return `${base}-${eventId.toLowerCase()}`;
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
  const eventType = (formData.get('event_type') as string)?.trim();
  const retentionMonths = Number(formData.get('retention_months'));
  const maxContributors = Number(formData.get('max_contributors'));
  const photosPerGuest = Number(formData.get('photos_per_guest'));

  // Basic validation
  if (!name) return { error: 'Event name is required.' };
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
  const slug = generateSlug(name, eventId);
  const expiresAt = getExpiresAt(retentionMonths);

  // Generate PIN — only the hash goes to the database.
  const pin = generatePin();
  const pinHash = hashPin(pin);

  const supabase = createServiceClient();

  const { error } = await supabase.from('events').insert({
    event_id: eventId,
    slug,
    pin_hash: pinHash,
    name,
    event_type: eventType,
    state: 'draft',
    photos_per_guest: photosPerGuest,
    max_contributors: maxContributors,
    retention_months: retentionMonths,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  // Set a one-time flash cookie so the detail page can show the PIN once.
  // The raw PIN is NEVER stored in any database column.
  const cookieStore = await cookies();
  cookieStore.set(PIN_FLASH_COOKIE, encodePinFlash(eventId, pin), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/admin/events',
    maxAge: PIN_FLASH_MAX_AGE,
  });

  redirect(`/admin/events/${eventId}`);
}

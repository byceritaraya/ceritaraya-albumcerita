'use server';

import { cookies } from 'next/headers';
import { PIN_FLASH_COOKIE, encodePinFlash, PIN_FLASH_MAX_AGE } from '@/lib/pin-flash';
import { generatePin, hashPin } from '@/lib/pin';
import { encryptText } from '@/lib/encryption';
import { createServiceClient } from '@/lib/supabase/service';
import { uploadMedia } from '@/lib/media';
import { revalidatePath } from 'next/cache';

/**
 * Clears the one-time PIN flash cookie.
 * Called by <PinBanner> on mount, after the PIN has been displayed.
 *
 * Reused by the future Reset PIN flow — no changes needed here.
 */
export async function clearPinFlash(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PIN_FLASH_COOKIE);
}

export async function resetPinAction(eventId: string, target: 'legacy' | 'host' | 'guest'): Promise<{ error?: string }> {
  const pin = generatePin();
  const pinHash = hashPin(pin);

  const supabase = createServiceClient();
  
  let updateData: Record<string, string> = {};
  if (target === 'host') updateData = { host_pin_hash: pinHash, host_pin_encrypted: encryptText(pin) };
  else if (target === 'guest') updateData = { guest_pin_hash: pinHash, guest_pin: pin };
  else updateData = { pin_hash: pinHash };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq(isUuid ? 'id' : 'event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  
  const flashValue = target === 'host' 
    ? encodePinFlash(eventId, '', true, pin, undefined)
    : target === 'guest'
      ? encodePinFlash(eventId, '', true, undefined, pin)
      : encodePinFlash(eventId, pin, true);

  cookieStore.set(PIN_FLASH_COOKIE, flashValue, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/admin/events',
    maxAge: PIN_FLASH_MAX_AGE,
  });

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function updateEventAction(
  eventId: string,
  data: {
    name: string;
    host_name: string;
    theme: string;
    retention_months: number;
    max_contributors: number;
    photos_per_guest: number;
    cover_image_url: string | null;
    film_recipe_id: string;
    auto_publish_at: string | null;
  }
): Promise<{ error?: string }> {
  if (!data.name?.trim()) return { error: 'Event name is required.' };
  if (!data.film_recipe_id?.trim()) return { error: 'Film recipe is required.' };

  const supabase = createServiceClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
  const { error } = await supabase
    .from('events')
    .update({
      name: data.name.trim(),
      host_name: data.host_name.trim() || null,
      theme: data.theme || 'Sage',
      retention_months: data.retention_months,
      max_contributors: data.max_contributors,
      photos_per_guest: data.photos_per_guest,
      cover_image_url: data.cover_image_url,
      film_recipe_id: data.film_recipe_id,
      auto_publish_at: data.auto_publish_at ? new Date(data.auto_publish_at).toISOString() : null,
    })
    .eq(isUuid ? 'id' : 'event_id', eventId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

/**
 * Uploads an event cover image directly to Cloudeka S3.
 * Returns the object key (relative path) on success, which is stored in
 * events.cover_image_url as the authoritative media reference.
 */
export async function uploadCoverImageAction(eventId: string, formData: FormData): Promise<{ error?: string; url?: string }> {
  const file = formData.get('cover_image') as File | null;
  if (!file) return { error: 'No file provided' };

  // Derive the object key using the same convention as before:
  // covers/{eventId}-{timestamp}.{ext}
  // This is backward-compatible with existing cover_image_url values in the DB.
  const ext = file.name.split('.').pop();
  const objectKey = `covers/${eventId}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadMedia({
    objectKey,
    body: buffer,
    contentType: file.type,
  });

  if ('error' in result) {
    console.error('[uploadCoverImageAction] Cloudeka upload failed:', result.error);
    return { error: result.error };
  }

  // Return the object key — the caller saves this to events.cover_image_url
  return { url: objectKey };
}

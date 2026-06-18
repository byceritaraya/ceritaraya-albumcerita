'use server';

import { cookies } from 'next/headers';
import { PIN_FLASH_COOKIE, encodePinFlash, PIN_FLASH_MAX_AGE } from '@/lib/pin-flash';
import { generatePin, hashPin } from '@/lib/pin';
import { createServiceClient } from '@/lib/supabase/service';
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
  if (target === 'host') updateData = { host_pin_hash: pinHash };
  else if (target === 'guest') updateData = { guest_pin_hash: pinHash, guest_pin: pin };
  else updateData = { pin_hash: pinHash };

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('event_id', eventId);

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
  }
): Promise<{ error?: string }> {
  if (!data.name?.trim()) return { error: 'Event name is required.' };

  const supabase = createServiceClient();
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
    })
    .eq('event_id', eventId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function uploadCoverImageAction(eventId: string, formData: FormData): Promise<{ error?: string; url?: string }> {
  const file = formData.get('cover_image') as File | null;
  if (!file) return { error: 'No file provided' };

  const supabase = createServiceClient();
  const ext = file.name.split('.').pop();
  const path = `covers/${eventId}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from('albumcerita_photos').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: error.message };

  return { url: path };
}

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

export async function resetPinAction(eventId: string): Promise<{ error?: string }> {
  const pin = generatePin();
  const pinHash = hashPin(pin);

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('events')
    .update({ pin_hash: pinHash })
    .eq('event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(PIN_FLASH_COOKIE, encodePinFlash(eventId, pin, true), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/admin/events',
    maxAge: PIN_FLASH_MAX_AGE,
  });

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

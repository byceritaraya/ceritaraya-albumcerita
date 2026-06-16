'use server';

import { cookies } from 'next/headers';
import { PIN_FLASH_COOKIE } from '@/lib/pin-flash';

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

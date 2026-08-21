'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { generatePin, hashPin } from '@/lib/pin';
import { encodePinFlash, PIN_FLASH_COOKIE, PIN_FLASH_MAX_AGE } from '@/lib/pin-flash';
import { generateEventId, generateSlug, resolveSlug, getExpiresAt } from '@/lib/event-generators';
import { encryptText } from '@/lib/encryption';

export type CreateEventState = {
  error?: string;
};

const DEFAULTS = {
  photos_per_guest: 10,
  max_contributors: 50,
  retention_months: 3,
  event_type: 'other',
} as const;

export async function deleteEventAction(eventId: string) {
  const supabase = createServiceClient();

  // Since all relations (photos, contributors, client_sessions, pin_attempts)
  // use ON DELETE CASCADE, deleting the event will clean up everything automatically.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);
  const { error } = await supabase
    .from('events')
    .delete()
    .eq(isUuid ? 'id' : 'event_id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    throw new Error(error.message);
  }

// Refresh the admin events list page
  revalidatePath('/admin/events');
}

export async function createEventAction(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const clientId = (formData.get('client_id') as string)?.trim();
  const serviceIdsRaw = formData.get('service_ids') as string;

  // ── 1. Validate client ──────────────────────────────────────────────────────
  if (!clientId) return { error: 'Client is required.' };

  // ── 2. Validate service selection ──────────────────────────────────────────
  let serviceIds: string[] = [];
  try {
    serviceIds = JSON.parse(serviceIdsRaw || '[]');
  } catch {
    return { error: 'Invalid service selection.' };
  }
  if (!Array.isArray(serviceIds) || serviceIds.length !== 1) {
    return { error: 'Exactly one service must be selected.' };
  }

  const supabase = createServiceClient();

  // ── 3. Verify client exists and is active ───────────────────────────────────
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, status')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return { error: 'Client not found.' };
  }
  if (client.status !== 'active') {
    return { error: 'Cannot create an event for an inactive client. Reactivate the client first.' };
  }

  // ── 4. Verify service exists, is active, and get its slug ──────────────────
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, slug')
    .in('id', serviceIds)
    .eq('active', true);

  if (servicesError || !services || services.length !== serviceIds.length) {
    return { error: 'One or more selected services are invalid or inactive.' };
  }

  const selectedService = services[0];
  const serviceSlug = selectedService.slug;

  // ── 5. Pick a default film recipe ──────────────────────────────────────────
  // We assign a default recipe so the event row is valid from creation.
  // The admin will select the actual recipe in the Configuration wizard.
  const { data: defaultRecipe } = await supabase
    .from('film_recipes')
    .select('id')
    .eq('active', true)
    .or('slug.eq.albumcerita-signature,name.eq.AlbumCerita Signature')
    .maybeSingle();

  const { data: fallbackRecipe } = defaultRecipe
    ? { data: defaultRecipe }
    : await supabase.from('film_recipes').select('id').eq('active', true).limit(1).single();

  if (!fallbackRecipe) {
    return { error: 'No active film recipe found. Please configure a film recipe first.' };
  }

  // ── 6. Generate IDs, slugs, PINs ───────────────────────────────────────────
  // The event name is left as a placeholder; the admin sets the real name
  // in the Disposable Camera Configuration wizard after creation.
  const placeholderName = 'Untitled Event';
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const eventId = generateEventId();
  const baseSlug = generateSlug(placeholderName, today);
  const slug = await resolveSlug(baseSlug, supabase);
  const expiresAt = getExpiresAt(DEFAULTS.retention_months);

  const pin = generatePin();
  const pinHash = hashPin(pin);
  const hostPin = generatePin();
  const hostPinHash = hashPin(hostPin);
  const hostPinEncrypted = encryptText(hostPin);
  const guestPin = generatePin();
  const guestPinHash = hashPin(guestPin);

  // ── 7. Create the event ────────────────────────────────────────────────────
  const { data: createdEventId, error: rpcError } = await supabase.rpc(
    'create_event_with_services',
    {
      p_event_id: eventId,
      p_slug: slug,
      p_name: placeholderName,
      p_event_type: DEFAULTS.event_type,
      p_event_date: today,
      p_client_id: clientId,
      p_pin_hash: pinHash,
      p_host_pin_hash: hostPinHash,
      p_host_pin_encrypted: hostPinEncrypted,
      p_guest_pin_hash: guestPinHash,
      p_guest_pin: guestPin,
      p_photos_per_guest: DEFAULTS.photos_per_guest,
      p_max_contributors: DEFAULTS.max_contributors,
      p_retention_months: DEFAULTS.retention_months,
      p_expires_at: expiresAt,
      p_film_recipe_id: fallbackRecipe.id,
      p_service_ids: serviceIds,
    }
  );

  if (rpcError || !createdEventId) {
    console.error('[createEventAction] RPC error:', rpcError);
    return {
      error: rpcError?.message?.includes('duplicate')
        ? 'An event with this name and date already exists. Please use a different name.'
        : 'Failed to create the event. Please try again.',
    };
  }

  // ── 8. Set PIN flash cookie ─────────────────────────────────────────────────
  const cookieStore = await cookies();
  cookieStore.set(
    PIN_FLASH_COOKIE,
    encodePinFlash(createdEventId, pin, false, hostPin, guestPin),
    {
      httpOnly: true,
      sameSite: 'strict',
      path: '/admin/events',
      maxAge: PIN_FLASH_MAX_AGE,
    }
  );

  // ── 9. Redirect directly into the service workspace ────────────────────────
  redirect(`/admin/events/${createdEventId}/services/${serviceSlug}`);
}

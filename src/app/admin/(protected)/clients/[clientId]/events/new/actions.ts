'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { generatePin, hashPin } from '@/lib/pin';
import { encodePinFlash, PIN_FLASH_COOKIE, PIN_FLASH_MAX_AGE } from '@/lib/pin-flash';
import { generateEventId, generateSlug, resolveSlug, getExpiresAt } from '@/lib/event-generators';
import { encryptText } from '@/lib/encryption';

// ── Types ────────────────────────────────────────────────────────────────────

export type CreateClientEventState = {
  error?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_EVENT_TYPES = ['wedding', 'birthday', 'corporate', 'other'] as const;

// Default Disposable Camera-compatible values.
// These maintain backward compatibility with the existing events schema
// and can be reconfigured per-event via the existing EditEventForm.
const DEFAULTS = {
  photos_per_guest: 10,
  max_contributors: 50,
  retention_months: 3,
} as const;

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Creates a new Event under a specific Client and associates the selected services.
 *
 * Atomicity: Uses the `create_event_with_services` PostgreSQL RPC function,
 * which wraps the event INSERT and all event_services INSERTs in a single
 * database transaction. If any step fails, the entire operation is rolled back.
 *
 * Called from the 3-step wizard at /admin/clients/[clientId]/events/new.
 */
export async function createClientEventAction(
  clientId: string,
  _prevState: CreateClientEventState,
  formData: FormData
): Promise<CreateClientEventState> {
  // ── Extract form fields ────────────────────────────────────────────────────
  const name = (formData.get('name') as string)?.trim();
  const eventDate = (formData.get('event_date') as string)?.trim();
  const eventType = (formData.get('event_type') as string)?.trim();
  // Service IDs are serialized as JSON array in a hidden input
  const serviceIdsRaw = formData.get('service_ids') as string;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!name) return { error: 'Event name is required.' };
  if (!eventDate) return { error: 'Event date is required.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { error: 'Invalid date format.' };
  if (!VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number])) {
    return { error: 'Invalid event type.' };
  }

  let serviceIds: string[] = [];
  try {
    serviceIds = JSON.parse(serviceIdsRaw || '[]');
  } catch {
    return { error: 'Invalid service selection.' };
  }
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return { error: 'At least one service must be selected.' };
  }

  const supabase = createServiceClient();

  // ── Validate Client ───────────────────────────────────────────────────────
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

  // ── Validate Services ─────────────────────────────────────────────────────
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id')
    .in('id', serviceIds)
    .eq('active', true);

  if (servicesError || !services || services.length !== serviceIds.length) {
    return { error: 'One or more selected services are invalid or inactive.' };
  }

  // ── Resolve default film recipe (Disposable Camera backward compat) ────────
  const { data: defaultRecipe } = await supabase
    .from('film_recipes')
    .select('id')
    .eq('active', true)
    .or('slug.eq.albumcerita-signature,name.eq.AlbumCerita Signature')
    .maybeSingle();

  // Fallback: any active recipe
  const { data: fallbackRecipe } = defaultRecipe
    ? { data: defaultRecipe }
    : await supabase.from('film_recipes').select('id').eq('active', true).limit(1).single();

  if (!fallbackRecipe) {
    return { error: 'No active film recipe found. Please configure a film recipe first.' };
  }

  // ── Generate Event identifiers & PINs ─────────────────────────────────────
  const eventId = generateEventId();
  const baseSlug = generateSlug(name, eventDate);
  const slug = await resolveSlug(baseSlug, supabase);
  const expiresAt = getExpiresAt(DEFAULTS.retention_months);

  const pin = generatePin();
  const pinHash = hashPin(pin);
  const hostPin = generatePin();
  const hostPinHash = hashPin(hostPin);
  const hostPinEncrypted = encryptText(hostPin);
  const guestPin = generatePin();
  const guestPinHash = hashPin(guestPin);

  // ── Atomic creation via RPC ───────────────────────────────────────────────
  const { data: createdEventId, error: rpcError } = await supabase.rpc(
    'create_event_with_services',
    {
      p_event_id: eventId,
      p_slug: slug,
      p_name: name,
      p_event_type: eventType,
      p_event_date: eventDate,
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
    console.error('[createClientEventAction] RPC error:', rpcError);
    return {
      error: rpcError?.message?.includes('duplicate')
        ? 'An event with this name and date already exists. Please use a different name.'
        : 'Failed to create the event. Please try again.',
    };
  }

  // ── Set one-time PIN flash cookie ─────────────────────────────────────────
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

  // ── Redirect to Event Detail ──────────────────────────────────────────────
  redirect(`/admin/events/${createdEventId}`);
}

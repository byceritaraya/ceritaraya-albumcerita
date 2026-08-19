'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export interface SaveDisposableCameraConfigInput {
  photos_per_guest: number;
  max_contributors: number;
  retention_months: number;
  film_recipe_id: string;
}

/**
 * Server action: persist Disposable Camera event-specific configuration.
 *
 * Validates:
 *  1. Event exists (by event_id slug).
 *  2. Disposable Camera service is enabled for this event via event_services.
 *  3. Numeric values are valid integers meeting minimum requirements.
 *  4. The selected film_recipe_id references a real, active film_recipes row.
 *
 * Updates ONLY the four camera-config columns on the events table.
 * Does NOT create new events, new event_services rows, or touch any other column.
 */
export async function saveDisposableCameraConfigAction(
  eventId: string,
  input: SaveDisposableCameraConfigInput
): Promise<{ error?: string }> {
  const supabase = createServiceClient();

  // ── 1. Validate numeric inputs ──────────────────────────────────────────────
  const photosPerGuest = Math.trunc(Number(input.photos_per_guest));
  const maxContributors = Math.trunc(Number(input.max_contributors));
  const retentionMonths = Math.trunc(Number(input.retention_months));

  if (!Number.isFinite(photosPerGuest) || photosPerGuest < 1) {
    return { error: 'Photos per guest must be a positive integer (minimum 1).' };
  }
  if (!Number.isFinite(maxContributors) || maxContributors < 1) {
    return { error: 'Maximum contributors must be a positive integer (minimum 1).' };
  }
  if (!Number.isFinite(retentionMonths) || retentionMonths < 1) {
    return { error: 'Retention period must be at least 1 month.' };
  }
  if (!input.film_recipe_id?.trim()) {
    return { error: 'A Film Recipe must be selected.' };
  }

  // ── 2. Confirm event exists ─────────────────────────────────────────────────
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found.' };
  }

  // ── 3. Confirm Disposable Camera is enabled for this event ──────────────────
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('slug', 'disposable-camera')
    .single();

  if (!service) {
    return { error: 'Disposable Camera service is not registered in the system.' };
  }

  const { data: eventService } = await supabase
    .from('event_services')
    .select('id')
    .eq('event_id', event.id)
    .eq('service_id', service.id)
    .single();

  if (!eventService) {
    return { error: 'Disposable Camera is not enabled for this event.' };
  }

  // ── 4. Confirm the selected Film Recipe exists ──────────────────────────────
  const { data: recipe } = await supabase
    .from('film_recipes')
    .select('id')
    .eq('id', input.film_recipe_id)
    .single();

  if (!recipe) {
    return { error: 'The selected Film Recipe does not exist.' };
  }

  // ── 5. Update ONLY the camera config columns ────────────────────────────────
  const { error: updateError } = await supabase
    .from('events')
    .update({
      photos_per_guest: photosPerGuest,
      max_contributors: maxContributors,
      retention_months: retentionMonths,
      film_recipe_id: input.film_recipe_id,
    })
    .eq('id', event.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // ── 6. Revalidate relevant routes ──────────────────────────────────────────
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/services/disposable-camera`);

  return {};
}

export interface SaveDcAlbumConfigInput {
  theme: string;
  auto_publish_at: string | null;
  cover_image_url: string | null;
}

export async function saveDcAlbumConfigAction(
  eventId: string,
  input: SaveDcAlbumConfigInput
): Promise<{ error?: string }> {
  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found.' };
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({
      theme: input.theme,
      auto_publish_at: input.auto_publish_at ? new Date(input.auto_publish_at).toISOString() : null,
      cover_image_url: input.cover_image_url,
    })
    .eq('id', event.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/services/disposable-camera`);

  return {};
}


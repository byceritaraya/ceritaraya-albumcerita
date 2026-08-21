'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';

export interface SaveDisposableCameraConfigInput {
  // Event Information
  name: string;
  host_name: string;
  event_date: string;
  // Camera Setup
  photos_per_guest: number;
  max_contributors: number;
  retention_months: number;
  // Film Recipe
  film_recipe_id: string;
  // Album & Cover
  cover_image_url: string | null;
  theme: string;
  is_published: boolean;
  auto_publish_at: string | null;
}

/**
 * Server action: persist all Disposable Camera event configuration.
 *
 * Validates:
 *  1. Event exists (by event_id slug).
 *  2. Disposable Camera service is the single assigned service for this event.
 *  3. Numeric values are valid integers meeting minimum requirements.
 *  4. The selected film_recipe_id references a real, active film_recipes row.
 *  5. Event name and date are present.
 *
 * Updates ONLY the relevant columns on the events table.
 * Does NOT create new events, new event_services rows, or touch any other column.
 */
export async function saveDisposableCameraConfigAction(
  eventId: string,
  input: SaveDisposableCameraConfigInput
): Promise<{ error?: string }> {
  const supabase = createServiceClient();

  // ── 1. Validate text inputs ─────────────────────────────────────────────────
  const name = input.name?.trim();
  if (!name) return { error: 'Event name is required.' };

  const eventDate = input.event_date?.trim();
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: 'A valid event date is required (YYYY-MM-DD).' };
  }

  const hostName = input.host_name?.trim() || null;

  // ── 2. Validate numeric inputs ──────────────────────────────────────────────
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

  // ── 3. Confirm event exists ─────────────────────────────────────────────────
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found.' };
  }

  // ── 4. Confirm Disposable Camera is the single assigned service ─────────────
  const { data: dcService } = await supabase
    .from('services')
    .select('id')
    .eq('slug', 'disposable-camera')
    .single();

  if (!dcService) {
    return { error: 'Disposable Camera service is not registered in the system.' };
  }

  const { data: eventServices } = await supabase
    .from('event_services')
    .select('id, service_id')
    .eq('event_id', event.id);

  if (!eventServices || eventServices.length === 0) {
    return { error: 'No service is assigned to this event.' };
  }
  if (eventServices.length > 1) {
    return { error: 'This event has multiple services — violates one-event-one-service architecture.' };
  }
  if (eventServices[0].service_id !== dcService.id) {
    return { error: 'The assigned service is not Disposable Camera.' };
  }

  // ── 5. Confirm the selected Film Recipe exists and is active ────────────────
  const { data: recipe } = await supabase
    .from('film_recipes')
    .select('id')
    .eq('id', input.film_recipe_id)
    .eq('active', true)
    .single();

  if (!recipe) {
    return { error: 'The selected Film Recipe does not exist or is no longer active.' };
  }

  // ── 6. Update the event row ─────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('events')
    .update({
      name,
      host_name: hostName,
      event_date: eventDate,
      photos_per_guest: photosPerGuest,
      max_contributors: maxContributors,
      retention_months: retentionMonths,
      film_recipe_id: input.film_recipe_id,
      cover_image_url: input.cover_image_url ?? null,
      theme: input.theme || 'Sage',
      is_published: input.is_published ?? false,
      auto_publish_at: input.auto_publish_at
        ? new Date(input.auto_publish_at).toISOString()
        : null,
    })
    .eq('id', event.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // ── 7. Revalidate relevant routes ───────────────────────────────────────────
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/services/disposable-camera`);

  return {};
}

'use server';

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'crypto';

export type UploadPhotoState = {
  error?: string;
  success?: string;
};

// ─── Internal helper ─────────────────────────────────────────────────────────

/**
 * Resolves the contributor and event from the current session cookie.
 * Returns an error string if the session is invalid or the contributor
 * does not belong to the event.
 */
async function resolveSession(eventId: string) {
  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  if (!contributorId) {
    return { error: 'Contributor session not found. Please rejoin the event.' } as const;
  }

  const supabase = createServiceClient();

  const { data: contributor, error: contributorError } = await supabase
    .from('contributors')
    .select('id, display_name, event_id, roll_developed_at')
    .eq('id', contributorId)
    .single();

  if (contributorError || !contributor) {
    return { error: 'Invalid contributor session.' } as const;
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event || contributor.event_id !== event.id) {
    return { error: 'Event mismatch.' } as const;
  }

  return { contributor, event, supabase };
}

// ─── developRoll ─────────────────────────────────────────────────────────────

export type DevelopRollState = {
  error?: string;
  success?: boolean;
};

/**
 * Marks a contributor's film roll as developed.
 * Must be called BEFORE the first uploadPhoto in a development session.
 *
 * This is the server-side gate that enforces single development.
 * The update uses a WHERE condition to atomically check that the roll
 * has not already been developed. If zero rows are updated, the roll
 * was already developed and the request is rejected.
 *
 * The Film Recipe is applied exactly once during development.
 * After development, the gallery always displays the stored processed image
 * and never re-applies the Film Recipe.
 */
export async function developRoll(eventId: string): Promise<DevelopRollState> {
  const session = await resolveSession(eventId);
  if ('error' in session) return { error: session.error };

  const { contributor, supabase } = session;

  // Atomic guard: only update if roll_developed_at is still NULL.
  // This prevents a race condition where two simultaneous requests
  // could both see NULL and both proceed.
  const { data, error } = await supabase
    .from('contributors')
    .update({ roll_developed_at: new Date().toISOString() })
    .eq('id', contributor.id)
    .is('roll_developed_at', null)
    .select('id')
    .single();

  if (error || !data) {
    // Either the DB rejected it or zero rows matched (already developed).
    return {
      error:
        'This film roll has already been developed. The Film Recipe is applied exactly once. Please rejoin to start a new roll.',
    };
  }

  return { success: true };
}

// ─── uploadPhoto ─────────────────────────────────────────────────────────────

export async function uploadPhoto(
  eventId: string,
  _prevState: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) {
    return { error: 'Please select a valid photo.' };
  }

  const session = await resolveSession(eventId);
  if ('error' in session) return { error: session.error };

  const { contributor, event, supabase } = session;

  // ── Backend development gate ────────────────────────────────────────────────
  // Reject the upload if this contributor's roll has NOT been marked as
  // developed. developRoll() must have been called successfully first.
  // This prevents raw (unprocessed) files from bypassing the film pipeline.
  if (!contributor.roll_developed_at) {
    return {
      error:
        'Roll has not been developed yet. Call developRoll() before uploading.',
    };
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${event.id}/${fileName}`;
  const bucketName = 'albumcerita_photos';

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return { error: 'Failed to upload photo to storage.' };
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  const { error: insertError } = await supabase
    .from('photos')
    .insert({
      event_id: event.id,
      guest_token: contributor.id,
      guest_name: contributor.display_name,
      storage_path: storagePath,
      original_url: publicUrlData.publicUrl,
      file_size_bytes: file.size,
      width: null,
      height: null,
    });

  if (insertError) {
    console.error('Photo insert error:', insertError);
    return { error: 'Failed to record photo in database.' };
  }

  return { success: 'Photo uploaded successfully.' };
}

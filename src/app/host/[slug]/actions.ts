'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyPin } from '@/lib/pin';
import crypto from 'crypto';

export type HostAuthResult = {
  error?: string;
};

// ── Host Authentication ───────────────────────────────────────────────────────

export async function authenticateHost(
  _prevState: HostAuthResult,
  formData: FormData
): Promise<HostAuthResult> {
  const slug = formData.get('slug') as string;
  const pin = formData.get('pin') as string;

  if (!slug || !pin) {
    return { error: 'Slug and PIN are required' };
  }

  const supabase = createServiceClient();

  // Look up event by unified slug
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, host_pin_hash')
    .eq('slug', slug)
    .single();

  if (eventError || !event || !event.host_pin_hash) {
    return { error: 'Invalid link or PIN' };
  }

  const isValid = verifyPin(pin, event.host_pin_hash);
  if (!isValid) {
    return { error: 'Invalid PIN' };
  }

  // Create session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: sessionError } = await supabase.from('client_sessions').insert({
    event_id: event.id,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    const msg =
      process.env.NODE_ENV === 'development'
        ? `Failed to create session: ${sessionError.message} (code: ${sessionError.code})`
        : 'Failed to create session';
    return { error: msg };
  }

  const cookieKey = `host_session_${slug}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set(`show_host_welcome_${slug}`, '1', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  console.log('--- HOST AUTH ACTION DEBUG ---');
  console.log('Host slug:', slug);
  console.log('Cookie key set:', cookieKey);
  console.log('Session created in DB:', sessionToken ? '[REDACTED]' : null);

  revalidatePath(`/host/${slug}`);
  redirect(`/host/${slug}`);
}

// ── Photo Visibility ──────────────────────────────────────────────────────────

export async function togglePhotoVisibility(
  photoId: string,
  currentHiddenStatus: boolean,
  slug: string
) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(`host_session_${slug}`)?.value;
  if (!sessionToken) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from('client_sessions')
    .select('event_id')
    .eq('session_token', sessionToken)
    .single();

  if (!session) throw new Error('Unauthorized');

  // Verify photo belongs to this event
  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .eq('event_id', session.event_id)
    .single();

  if (!photo) throw new Error('Photo not found');

  const { error } = await supabase
    .from('photos')
    .update({ is_hidden: !currentHiddenStatus })
    .eq('id', photoId);

  if (error) throw new Error(error.message);
}

// ── Publish Helpers ───────────────────────────────────────────────────────────

/** Verifies the host session cookie and returns the event_id. */
async function verifyHostSession(slug: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(`host_session_${slug}`)?.value;
  if (!sessionToken) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from('client_sessions')
    .select('event_id')
    .eq('session_token', sessionToken)
    .single();

  if (!session) throw new Error('Unauthorized');
  return { supabase, eventId: session.event_id };
}

// ── Publish Album ─────────────────────────────────────────────────────────────

export async function publishAlbum(slug: string): Promise<{ error?: string }> {
  try {
    const { supabase, eventId } = await verifyHostSession(slug);

    const { error } = await supabase
      .from('events')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Unpublish Album ───────────────────────────────────────────────────────────

/**
 * Sets is_published = false.
 * Does NOT modify the slug — the same public URL remains reusable
 * when the album is published again in the future.
 */
export async function unpublishAlbum(slug: string): Promise<{ error?: string }> {
  try {
    const { supabase, eventId } = await verifyHostSession(slug);

    const { error } = await supabase
      .from('events')
      .update({ is_published: false })
      .eq('id', eventId);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ── Bulk Photo Visibility ─────────────────────────────────────────────────────

export async function bulkHidePhotos(photoIds: string[], slug: string) {
  if (!photoIds || photoIds.length === 0) return;
  const { supabase, eventId } = await verifyHostSession(slug);

  const { error } = await supabase
    .from('photos')
    .update({ is_hidden: true })
    .in('id', photoIds)
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);
}

export async function bulkUnhidePhotos(photoIds: string[], slug: string) {
  if (!photoIds || photoIds.length === 0) return;
  const { supabase, eventId } = await verifyHostSession(slug);

  const { error } = await supabase
    .from('photos')
    .update({ is_hidden: false })
    .in('id', photoIds)
    .eq('event_id', eventId);

  if (error) throw new Error(error.message);
}

export async function clearHostWelcomeModal(slug: string) {
  const cookieStore = await cookies();
  cookieStore.delete(`show_host_welcome_${slug}`);
}

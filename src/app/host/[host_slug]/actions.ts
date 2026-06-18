'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyPin } from '@/lib/pin';
import crypto from 'crypto';

export type HostAuthResult = {
  error?: string;
};

export async function authenticateHost(
  _prevState: HostAuthResult,
  formData: FormData
): Promise<HostAuthResult> {
  const hostSlug = formData.get('host_slug') as string;
  const pin = formData.get('pin') as string;

  // Step 1 — Input validation
  if (!hostSlug || !pin) {
    return { error: 'Slug and PIN are required' };
  }

  const supabase = createServiceClient();

  // Step 2 — Event lookup
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, host_pin_hash')
    .eq('host_slug', hostSlug)
    .single();

  if (eventError || !event || !event.host_pin_hash) {
    return { error: 'Invalid link or PIN' };
  }

  // Step 3 — PIN verification
  const isValid = verifyPin(pin, event.host_pin_hash);
  if (!isValid) {
    return { error: 'Invalid PIN' };
  }

  // Step 4 — Session creation
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: sessionError } = await supabase.from('client_sessions').insert({
    event_id: event.id,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    const msg = process.env.NODE_ENV === 'development'
      ? `Failed to create session: ${sessionError.message} (code: ${sessionError.code})`
      : 'Failed to create session';
    return { error: msg };
  }

  // Step 5 — Set cookie and redirect
  const cookieStore = await cookies();
  cookieStore.set(`host_session_${hostSlug}`, sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(`/host/${hostSlug}`);
}

export async function togglePhotoVisibility(photoId: string, currentHiddenStatus: boolean, hostSlug: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(`host_session_${hostSlug}`)?.value;
  if (!sessionToken) throw new Error("Unauthorized");

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from('client_sessions')
    .select('event_id')
    .eq('session_token', sessionToken)
    .single();

  if (!session) throw new Error("Unauthorized");

  // Verify photo belongs to event
  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .eq('event_id', session.event_id)
    .single();
    
  if (!photo) throw new Error("Photo not found");

  const { error } = await supabase
    .from('photos')
    .update({ is_hidden: !currentHiddenStatus })
    .eq('id', photoId);

  if (error) throw new Error(error.message);
  
  // No need to return anything, Server Action mutation can just refresh or client can handle state optimistically
}

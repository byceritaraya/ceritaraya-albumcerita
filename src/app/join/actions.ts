'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyPin } from '@/lib/pin';

export type JoinEventState = {
  error?: string;
};

export async function joinEvent(
  _prevState: JoinEventState,
  formData: FormData
): Promise<JoinEventState> {
  const eventId = (formData.get('event_id') as string)?.trim().toUpperCase();
  const pin = (formData.get('pin') as string)?.trim();
  const displayName = (formData.get('display_name') as string)?.trim();

  if (!eventId || !pin || !displayName) {
    return { error: 'Invalid Event ID, PIN, or Name' };
  }

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('id, event_id, pin_hash')
    .eq('event_id', eventId)
    .single();

  if (error || !event) {
    return { error: 'Invalid Event ID or PIN' };
  }

  const isValid = verifyPin(pin, event.pin_hash);

  if (!isValid) {
    return { error: 'Invalid Event ID or PIN' };
  }

  // Create contributor record
  const { data: contributor, error: contributorError } = await supabase
    .from('contributors')
    .insert({ event_id: event.id, display_name: displayName })
    .select('id')
    .single();

  if (contributorError || !contributor) {
    console.error('Contributor insert error:', contributorError);
    return { error: contributorError?.message || 'Failed to join event. Please try again.' };
  }

  // Set contributor_id cookie
  const cookieStore = await cookies();
  cookieStore.set('contributor_id', contributor.id, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Redirect to event page on success
  redirect(`/event/${eventId}`);
}

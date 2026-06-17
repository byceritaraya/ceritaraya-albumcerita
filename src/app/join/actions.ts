'use server';

import { redirect } from 'next/navigation';
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

  if (!eventId || !pin) {
    return { error: 'Invalid Event ID or PIN' };
  }

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('event_id, pin_hash')
    .eq('event_id', eventId)
    .single();

  if (error || !event) {
    return { error: 'Invalid Event ID or PIN' };
  }

  const isValid = verifyPin(pin, event.pin_hash);

  if (!isValid) {
    return { error: 'Invalid Event ID or PIN' };
  }

  // Redirect to event page on success
  redirect(`/event/${eventId}`);
}

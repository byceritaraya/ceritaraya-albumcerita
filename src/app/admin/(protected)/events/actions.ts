'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

export async function deleteEventAction(eventId: string) {
  const supabase = createServiceClient();

  // Since all relations (photos, contributors, client_sessions, pin_attempts)
  // use ON DELETE CASCADE, deleting the event will clean up everything automatically.
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('event_id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    throw new Error(error.message);
  }

  // Refresh the admin events list page
  revalidatePath('/admin/events');
}

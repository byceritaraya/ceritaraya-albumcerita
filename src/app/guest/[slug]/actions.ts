'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyPin } from '@/lib/pin';

export type GuestAuthResult = {
  error?: string;
  step?: 'pin' | 'name';
};

export async function authenticateGuest(
  _prevState: GuestAuthResult,
  formData: FormData
): Promise<GuestAuthResult> {
  const slug = formData.get('slug') as string;
  const step = formData.get('step') as string;
  const pin = formData.get('pin') as string;
  const displayName = formData.get('display_name') as string;

  if (!slug || !pin) {
    return { error: 'Slug and PIN are required', step: 'pin' };
  }

  const supabase = createServiceClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('id, guest_pin_hash')
    .eq('slug', slug)
    .single();

  if (error || !event || !event.guest_pin_hash) {
    return { error: 'Invalid link or PIN', step: 'pin' };
  }

  const isValid = verifyPin(pin, event.guest_pin_hash);
  if (!isValid) {
    return { error: 'Invalid PIN', step: 'pin' };
  }

  if (step === 'pin') {
    return { step: 'name' };
  }

  if (step === 'name') {
    if (!displayName?.trim()) {
      return { error: 'Name is required', step: 'name' };
    }

    // Create contributor record
    const { data: contributor, error: contributorError } = await supabase
      .from('contributors')
      .insert({ event_id: event.id, display_name: displayName.trim() })
      .select('id')
      .single();

    if (contributorError || !contributor) {
      console.error('Contributor insert error:', contributorError);
      return { error: 'Failed to join event. Please try again.', step: 'name' };
    }

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('contributor_id', contributor.id, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Also set a flag to show the welcome modal
    cookieStore.set(`show_welcome_${contributor.id}`, 'true', {
      httpOnly: false,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect(`/guest/${slug}`);
  }

  return { error: 'Invalid step' };
}

export async function clearWelcomeModal(contributorId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(`show_welcome_${contributorId}`);
}

// ── Photo Deletion ──────────────────────────────────────────────────────────

export async function deletePhoto(photoId: string, slug: string) {
  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;
  if (!contributorId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Look up event and verify it's not published
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, is_published')
    .eq('slug', slug)
    .single();

  if (eventError || !event) throw new Error('Event not found');
  if (event.is_published) throw new Error('Cannot delete photos in a published album');

  // Verify photo belongs to this contributor
  const { data: photo, error: photoError } = await supabase
    .from('photos')
    .select('id')
    .eq('id', photoId)
    .eq('guest_token', contributorId)
    .eq('event_id', event.id)
    .single();

  if (photoError || !photo) throw new Error('Photo not found or unauthorized');

  // Soft delete
  const { error } = await supabase
    .from('photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', photoId);

  if (error) throw new Error(error.message);
}

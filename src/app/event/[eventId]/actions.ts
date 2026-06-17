'use server';

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import crypto from 'crypto';

export type UploadPhotoState = {
  error?: string;
  success?: string;
};

export async function uploadPhoto(
  eventId: string,
  _prevState: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) {
    return { error: 'Please select a valid photo.' };
  }

  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  if (!contributorId) {
    return { error: 'Contributor session not found. Please rejoin the event.' };
  }

  const supabase = createServiceClient();

  const { data: contributor, error: contributorError } = await supabase
    .from('contributors')
    .select('id, display_name, event_id')
    .eq('id', contributorId)
    .single();

  if (contributorError || !contributor) {
    return { error: 'Invalid contributor session.' };
  }

  // Ensure contributor belongs to the current event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event || contributor.event_id !== event.id) {
    return { error: 'Event mismatch.' };
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${event.id}/${fileName}`;
  const bucketName = 'albumcerita_photos';

  // Read file as ArrayBuffer
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

  // Get original public URL (if convenient, but storage_path is the source of truth)
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  // Insert to photos table
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

import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';
import { GuestAuth } from './guest-auth';
import { GuestWelcome } from './guest-welcome';

interface PageProps {
  params: Promise<{ guest_slug: string }>;
}

export default async function GuestPage({ params }: PageProps) {
  const { guest_slug } = await params;

  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('id, event_id, name, event_type, photos_per_guest, theme, cover_image_url, host_name, expires_at')
    .eq('guest_slug', guest_slug)
    .single();

  if (error || !event) notFound();

  // No contributor session → show PIN / Name auth
  if (!contributorId) {
    return <GuestAuth guestSlug={guest_slug} />;
  }

  const { data: contributor } = await supabase
    .from('contributors')
    .select('display_name, event_id')
    .eq('id', contributorId)
    .single();

  // Contributor session belongs to a different event → re-auth
  if (!contributor || contributor.event_id !== event.id) {
    return <GuestAuth guestSlug={guest_slug} initialStep="name" />;
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [
    { count: photosUsed },
    { data: rawPhotos },
    { count: totalPhotos },
    { count: totalContributors },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('guest_token', contributorId),
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name')
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .order('uploaded_at', { ascending: false })
      .limit(24),
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false),
    supabase
      .from('photos')
      .select('guest_token', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false),
  ]);

  // ── Signed URLs ────────────────────────────────────────────────────────────
  const photos: AlbumPhoto[] = [];
  if (rawPhotos && rawPhotos.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('albumcerita_photos')
      .createSignedUrls(rawPhotos.map(p => p.storage_path), 3600);

    for (const p of rawPhotos) {
      const signed = signedData?.find(s => s.path === p.storage_path);
      photos.push({ ...p, original_url: signed?.signedUrl ?? p.original_url });
    }
  }

  let finalCoverUrl = event.cover_image_url ?? undefined;
  if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
    const { data } = await supabase.storage.from('albumcerita_photos').createSignedUrl(finalCoverUrl, 3600);
    if (data) finalCoverUrl = data.signedUrl;
  }

  const showWelcome = cookieStore.has(`show_welcome_${contributorId}`);

  return (
    <>
      {showWelcome && (
        <GuestWelcome
          contributorId={contributorId}
          contributorName={contributor.display_name}
          eventName={event.name}
          hostName={event.host_name ? event.host_name.split('&')[0].trim() : 'the host'}
        />
      )}
      <AlbumView
        role="guest"
        eventId={event.event_id}
        eventName={event.name}
        hostName={event.host_name ?? undefined}
        coverImageUrl={finalCoverUrl}
        theme={event.theme ?? undefined}
        photos={photos}
        totalPhotos={totalPhotos ?? 0}
        totalContributors={totalContributors ?? 0}
        contributorName={contributor.display_name}
        photosUsed={photosUsed ?? 0}
        photosPerGuest={event.photos_per_guest}
      />
    </>
  );
}

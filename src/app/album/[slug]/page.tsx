import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicAlbumPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, host_name, event_type, cover_image_url, theme, is_published')
    .eq('slug', slug)
    .single();

  if (eventError || !event) notFound();

  // ONLY show if it is published
  if (!event.is_published) notFound();

  // ── Data fetching (only non-hidden photos) ───────────────────────────
  const [
    { data: rawPhotos },
    { count: totalPhotos },
    { data: rawContributorTokens },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name')
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .is('deleted_at', null),
    supabase
      .from('photos')
      .select('guest_token')
      .eq('event_id', event.id)
      .is('deleted_at', null),
  ]);

  const totalContributors = new Set(rawContributorTokens?.map(r => r.guest_token) ?? []).size;

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

  let finalCoverUrl: string | undefined = undefined;
  const rawCover = event.cover_image_url;
  if (rawCover) {
    if (rawCover.startsWith('http')) {
      finalCoverUrl = rawCover;
    } else {
      const { data: signedData } = await supabase.storage
        .from('albumcerita_photos')
        .createSignedUrl(rawCover, 3600);
      if (signedData?.signedUrl) finalCoverUrl = signedData.signedUrl;
    }
  }

  return (
    <AlbumView
      role="public"
      eventId={event.event_id}
      eventName={event.name}
      hostName={event.host_name ?? undefined}
      coverImageUrl={finalCoverUrl}
      theme={event.theme ?? undefined}
      photos={photos}
      totalPhotos={totalPhotos ?? 0}
      totalContributors={totalContributors ?? 0}
      isPublished={event.is_published}
    />
  );
}

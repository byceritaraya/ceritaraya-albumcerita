import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';
import { type FilmRecipe } from '@/lib/film/types';
import { getMediaUrl, getMediaUrls } from '@/lib/media';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicAlbumPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, event_type, photos_per_guest, theme, cover_image_url, host_name, is_published, auto_publish_at, film_recipes (*)')
    .eq('slug', slug)
    .single();

  if (eventError || !event) notFound();

  // ONLY show if it is published
  const isActuallyPublished = event.is_published || (event.auto_publish_at && new Date() >= new Date(event.auto_publish_at));
  if (!isActuallyPublished) notFound();

  // ── Data fetching (only non-hidden photos) ───────────────────────────
  const [
    { data: rawPhotos },
    { count: totalPhotos },
    { data: rawContributorTokens },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name, is_hidden')
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
      .eq('is_hidden', false)
      .is('deleted_at', null),
  ]);

  const totalContributors = new Set(rawContributorTokens?.map(r => r.guest_token) ?? []).size;

  // ── Resolve media URLs from Cloudeka ──────────────────────────────────────
  const photos: AlbumPhoto[] = [];
  if (rawPhotos && rawPhotos.length > 0) {
    const urlMap = await getMediaUrls(rawPhotos.map(p => p.storage_path));
    for (const p of rawPhotos) {
      photos.push({
        ...p,
        original_url: urlMap.get(p.storage_path) ?? p.original_url,
        is_hidden: p.is_hidden ?? false,
      });
    }
  }

  // ── Resolve cover image from Cloudeka ─────────────────────────────────────
  const finalCoverUrl = event.cover_image_url
    ? await getMediaUrl(event.cover_image_url)
    : undefined;

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
      filmRecipe={(event.film_recipes as unknown as FilmRecipe | null) ?? null}
      isPublished={isActuallyPublished}
    />
  );
}

import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';
import { GuestAuth } from './guest-auth';
import { GuestWelcome } from './guest-welcome';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuestPage({ params }: PageProps) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('id, event_id, name, event_type, photos_per_guest, theme, cover_image_url, host_name, expires_at, is_published')
    .eq('slug', slug)
    .single();

  if (error || !event) notFound();

  let finalCoverUrl: string | undefined = undefined;
  const rawCover = event.cover_image_url;
  if (rawCover) {
    if (rawCover.startsWith('http')) {
      // Already a full URL (legacy or public bucket)
      finalCoverUrl = rawCover;
    } else {
      // Storage path → generate signed URL
      const { data: signedData } = await supabase.storage
        .from('albumcerita_photos')
        .createSignedUrl(rawCover, 3600);
      if (signedData?.signedUrl) finalCoverUrl = signedData.signedUrl;
      // If signing fails, finalCoverUrl stays undefined → fallback gradient shown
    }
  }

  // No contributor session → show PIN / Name auth
  if (!contributorId) {
    return <GuestAuth slug={slug} eventName={event.name} hostName={event.host_name ?? undefined} theme={event.theme ?? undefined} coverImageUrl={finalCoverUrl} />;
  }

  const { data: contributor } = await supabase
    .from('contributors')
    .select('display_name, event_id')
    .eq('id', contributorId)
    .single();

  // Contributor session belongs to a different event → re-auth
  if (!contributor || contributor.event_id !== event.id) {
    return <GuestAuth slug={slug} initialStep="name" eventName={event.name} hostName={event.host_name ?? undefined} theme={event.theme ?? undefined} coverImageUrl={finalCoverUrl} />;
  }

  // If published, event is closed for new contributions and becomes a view-only album
  if (event.is_published) {
    redirect(`/album/${slug}`);
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [
    { count: photosUsed },
    { data: rawPhotos },
    { data: rawOwnPhotos },
    { count: totalPhotos },
    { data: rawContributorTokens },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('guest_token', contributorId)
      .is('deleted_at', null),
    // All non-hidden photos from others
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name, guest_token, is_hidden')
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .neq('guest_token', contributorId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(24),
    // Guest's own photos (including hidden) so they can delete them
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name, guest_token, is_hidden')
      .eq('event_id', event.id)
      .eq('guest_token', contributorId)
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

  // Merge own + others, dedup by id (own photos take precedence)
  const allRaw = [...(rawOwnPhotos ?? []), ...(rawPhotos ?? [])].reduce<typeof rawPhotos>((acc, p) => {
    if (!acc) return [p];
    if (!acc.find(x => x.id === p.id)) acc.push(p);
    return acc;
  }, []);

  if (allRaw && allRaw.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('albumcerita_photos')
      .createSignedUrls(allRaw.map(p => p.storage_path), 3600);

    for (const p of allRaw) {
      const signed = signedData?.find(s => s.path === p.storage_path);
      photos.push({ ...p, original_url: signed?.signedUrl ?? p.original_url });
    }
  }


  const showWelcome = cookieStore.has(`show_welcome_${contributorId}`);

  return (
    <>
      {showWelcome && (
        <GuestWelcome
          contributorId={contributorId}
          contributorName={contributor.display_name}
          eventName={event.name}
          hostName={event.host_name ?? 'the host'}
          theme={event.theme ?? undefined}
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
        currentContributorToken={contributorId}
        slug={slug}
      />
    </>
  );
}

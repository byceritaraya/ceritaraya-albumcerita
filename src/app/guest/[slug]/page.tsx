import { notFound } from 'next/navigation';
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

  // If published, event is closed for new contributions
  if (event.is_published) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-12 text-center">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] p-8 shadow-sm border border-[var(--bg-tertiary)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-[var(--theme-primary)]">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-[var(--text-primary)] mb-3">
            Album Published
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
            This album has been published and is now closed for new contributions.
            <br/><br/>
            Thank you for being part of this story.
          </p>
          <Link
            href={`/album/${slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--theme-secondary)]"
          >
            View Published Album
          </Link>
        </div>
      </div>
    );
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [
    { count: photosUsed },
    { data: rawPhotos },
    { count: totalPhotos },
    { data: rawContributorTokens },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('guest_token', contributorId)
      .is('deleted_at', null),
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name, guest_token')
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(24),
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
      />
    </>
  );
}

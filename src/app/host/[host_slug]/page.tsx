import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';
import { HostAuth } from './host-auth';

interface PageProps {
  params: Promise<{ host_slug: string }>;
}

export default async function HostPage({ params }: PageProps) {
  const { host_slug } = await params;

  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, host_name, event_type, expires_at, cover_image_url, theme, guest_slug, guest_pin')
    .eq('host_slug', host_slug)
    .single();

  if (eventError || !event) notFound();

  // ── Session check ──────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(`host_session_${host_slug}`)?.value;

  let isAuthenticated = false;
  if (sessionToken) {
    const { data: session } = await supabase
      .from('client_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('event_id', event.id)
      .single();
    if (session) isAuthenticated = true;
  }

  if (!isAuthenticated) {
    return <HostAuth hostSlug={host_slug} />;
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [
    { data: rawPhotos },
    { count: totalPhotos },
    { count: totalContributors },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name, is_hidden')
      .eq('event_id', event.id)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false),
    supabase
      .from('contributors')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id),
  ]);

  // ── Signed URLs ────────────────────────────────────────────────────────────
  const photos: AlbumPhoto[] = [];
  if (rawPhotos && rawPhotos.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('albumcerita_photos')
      .createSignedUrls(rawPhotos.map(p => p.storage_path), 3600);

    for (const p of rawPhotos) {
      const signed = signedData?.find(s => s.path === p.storage_path);
      photos.push({
        ...p,
        original_url: signed?.signedUrl ?? p.original_url,
        is_hidden: p.is_hidden ?? false,
      });
    }
  }

  let finalCoverUrl = event.cover_image_url ?? undefined;
  if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
    const { data } = await supabase.storage.from('albumcerita_photos').createSignedUrl(finalCoverUrl, 3600);
    if (data) finalCoverUrl = data.signedUrl;
  }

  // ── Build guest URL ────────────────────────────────────────────────────────
  const headersList = await headers();
  const hostHeader = headersList.get('host') || 'localhost:3000';
  const protocol = hostHeader.includes('localhost') ? 'http' : 'https';
  let guestUrl = event.guest_slug ? `${protocol}://${hostHeader}/guest/${event.guest_slug}` : undefined;
  if (guestUrl && event.guest_pin) {
    guestUrl += `?pin=${event.guest_pin}`;
  }

  return (
    <AlbumView
      role="host"
      eventId={event.event_id}
      eventName={event.name}
      hostName={event.host_name ?? undefined}
      coverImageUrl={finalCoverUrl}
      theme={event.theme ?? undefined}
      photos={photos}
      totalPhotos={totalPhotos ?? 0}
      totalContributors={totalContributors ?? 0}
      guestUrl={guestUrl}
      hostSlug={host_slug}
    />
  );
}

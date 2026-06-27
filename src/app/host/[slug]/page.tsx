import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { AlbumView, type AlbumPhoto } from '@/app/_components/album-view';
import { HostAuth } from './host-auth';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HostPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = createServiceClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, host_name, event_type, expires_at, cover_image_url, theme, is_published, guest_pin')
    .eq('slug', slug)
    .single();

  if (eventError && eventError.code !== 'PGRST116') {
    console.error('Event lookup error:', eventError);
    throw new Error(eventError.message);
  }

  if (!event) {
    console.log('Host slug param:', slug);
    console.log('Event lookup result:', event);
    console.log('Event lookup error:', eventError);
    notFound();
  }

  // ── Session check ──────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const cookieKey = `host_session_${slug}`;
  const sessionToken = cookieStore.get(cookieKey)?.value;

  console.log('--- HOST AUTH DEBUG ---');
  console.log('Host slug:', slug);
  console.log('Cookie key:', cookieKey);
  console.log('Session cookie found:', sessionToken ? '[REDACTED]' : null);

  let isAuthenticated = false;
  if (sessionToken) {
    const { data: session, error: sessionLookupError } = await supabase
      .from('client_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('event_id', event.id)
      .single();
    if (session) {
      isAuthenticated = true;
      console.log('Session valid in DB:', session.id);
    } else {
      console.log('Session INVALID in DB. Error:', sessionLookupError);
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

  if (!isAuthenticated) {
    return <HostAuth slug={slug} eventName={event.name} hostName={event.host_name ?? undefined} theme={event.theme ?? undefined} coverImageUrl={finalCoverUrl} />;
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



  // ── Build URLs ────────────────────────────────────────────────────────
  const headersList = await headers();
  const hostHeader = headersList.get('host') || 'localhost:3000';
  const protocol = hostHeader.includes('localhost') ? 'http' : 'https';
  
  let guestUrl = `${protocol}://${hostHeader}/guest/${slug}`;
  if (event.guest_pin) {
    guestUrl += `?pin=${event.guest_pin}`;
  }
  
  const publicUrl = `${protocol}://${hostHeader}/album/${slug}`;

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
      slug={slug}
      isPublished={event.is_published}
      publicUrl={publicUrl}
    />
  );
}

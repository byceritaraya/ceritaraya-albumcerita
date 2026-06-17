import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { type GalleryPhoto } from './gallery';
import { EventPageClient } from './event-page-client';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params;

  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  if (!contributorId) {
    redirect('/join');
  }

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('id, event_id, name, event_type, photos_per_guest')
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      notFound();
    }
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  const { data: contributor } = await supabase
    .from('contributors')
    .select('display_name, event_id')
    .eq('id', contributorId)
    .single();

  if (!contributor || contributor.event_id !== event.id) {
    redirect('/join');
  }

  // ── Parallel data fetching ────────────────────────────────────────────────
  const [
    { count: photosUsed },
    { data: photos },
    { count: totalPhotos },
    { count: totalContributors },
  ] = await Promise.all([
    // Quota: photos uploaded by this contributor
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('guest_token', contributorId),

    // Gallery: recent 24 visible photos
    supabase
      .from('photos')
      .select('id, original_url, storage_path, uploaded_at, guest_name')
      .eq('event_id', event.id)
      .eq('is_hidden', false)
      .order('uploaded_at', { ascending: false })
      .limit(24),

    // Stat: total photos for the event
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false),

    // Stat: unique contributors who uploaded at least one photo
    supabase
      .from('photos')
      .select('guest_token', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('is_hidden', false),
  ]);

  // ── Generate signed URLs for gallery photos ───────────────────────────────
  const bucketName = 'albumcerita_photos';
  const galleryPhotos: GalleryPhoto[] = [];

  if (photos && photos.length > 0) {
    const storagePaths = photos.map((p) => p.storage_path);
    const { data: signedData } = await supabase.storage
      .from(bucketName)
      .createSignedUrls(storagePaths, 3600); // 1 hour expiry

    for (const photo of photos) {
      const signed = signedData?.find((s) => s.path === photo.storage_path);
      galleryPhotos.push({
        ...photo,
        original_url: signed?.signedUrl ?? photo.original_url,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ── Event header ── */}
        <div className="p-8 text-center border-b border-gray-100">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase bg-gray-100 rounded-full">
            {event.event_type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{event.name}</h1>
          <p className="mt-4 text-gray-500">
            Welcome, {contributor.display_name}! We are so excited to celebrate with you.
          </p>
        </div>

        {/* ── Client-side interactive sections ── */}
        <EventPageClient
          eventId={eventId}
          photosUsed={photosUsed ?? 0}
          photosPerGuest={event.photos_per_guest}
          galleryPhotos={galleryPhotos}
          totalPhotos={totalPhotos ?? 0}
          totalContributors={totalContributors ?? 0}
        />
      </div>
    </div>
  );
}

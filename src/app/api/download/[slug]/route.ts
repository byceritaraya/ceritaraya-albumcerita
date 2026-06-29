import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { ZipArchive } from 'archiver';
import { Readable, PassThrough } from 'stream';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const contributor = searchParams.get('contributor');

  const supabase = createServiceClient();
  const cookieStore = await cookies();

  // 1. Fetch Event
  const { data: event } = await supabase
    .from('events')
    .select('id, name, is_published')
    .eq('slug', slug)
    .single();

  if (!event) {
    return new NextResponse('Event not found', { status: 404 });
  }

  // 2. Check Host Authentication
  const hostCookieKey = `host_session_${slug}`;
  const hostSessionToken = cookieStore.get(hostCookieKey)?.value;
  let isHost = false;

  if (hostSessionToken) {
    const { data: session } = await supabase
      .from('client_sessions')
      .select('id')
      .eq('session_token', hostSessionToken)
      .eq('event_id', event.id)
      .single();
    if (session) {
      isHost = true;
    }
  }

  // 3. Verify Permissions
  if (contributor && !isHost) {
    return new NextResponse('Unauthorized: Only hosts can download by contributor', { status: 403 });
  }

  if (!event.is_published && !isHost) {
    return new NextResponse('Unauthorized: Album is not published', { status: 403 });
  }

  // 4. Fetch Photos
  let query = supabase
    .from('photos')
    .select('id, storage_path, guest_name')
    .eq('event_id', event.id)
    .eq('is_hidden', false)
    .is('deleted_at', null);

  if (contributor) {
    query = query.eq('guest_name', contributor);
  }

  const { data: photos, error: photosError } = await query.order('uploaded_at', { ascending: true });

  if (photosError || !photos || photos.length === 0) {
    return new NextResponse('No photos found', { status: 404 });
  }

  // 5. Generate Signed URLs for the photos
  const { data: signedData, error: signError } = await supabase.storage
    .from('albumcerita_photos')
    .createSignedUrls(photos.map(p => p.storage_path), 3600);

  if (signError || !signedData) {
    return new NextResponse('Failed to generate URLs', { status: 500 });
  }

  const urlMap = new Map<string, string>();
  signedData.forEach(s => {
    if (s.signedUrl) {
      urlMap.set(s.path, s.signedUrl);
    }
  });

  // 6. Setup Archiver & Stream
  const archive = new ZipArchive({
    zlib: { level: 0 } // No compression for images to reduce CPU and increase speed
  });

  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  const readableWebStream = new ReadableStream({
    start(controller) {
      passThrough.on('data', chunk => controller.enqueue(new Uint8Array(chunk)));
      passThrough.on('end', () => controller.close());
      passThrough.on('error', err => controller.error(err));
    }
  });

  const sanitize = (name: string) => name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const safeEvent = sanitize(event.name);
  const zipFilename = contributor 
    ? `${safeEvent}_${sanitize(contributor)}.zip`
    : `${safeEvent}.zip`;

  (async () => {
    let index = 1;
    for (const photo of photos) {
      const signedUrl = urlMap.get(photo.storage_path);
      if (!signedUrl) continue;

      try {
        const res = await fetch(signedUrl);
        if (res.ok) {
          const safeContributor = sanitize(photo.guest_name);
          const safeNumber = index.toString().padStart(3, '0');
          const ext = photo.storage_path.split('.').pop() || 'jpg';
          const filename = `${safeEvent}_${safeContributor}_${safeNumber}.${ext}`;
          
          archive.append(Buffer.from(await res.arrayBuffer()), { name: filename });
          index++;
        }
      } catch (err) {
        console.error(`Failed to fetch photo ${photo.id}:`, err);
      }
    }
    archive.finalize();
  })();

  return new NextResponse(readableWebStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getMediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  const filename = searchParams.get('filename') || 'download.jpg';

  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  try {
    // getMediaUrl automatically resolves legacy prefixes and returns a presigned URL
    const url = await getMediaUrl(key);
    
    if (!url) {
      return NextResponse.json({ error: 'Failed to generate media URL' }, { status: 404 });
    }

    // Fetch the binary directly from Cloudeka S3 (server-to-server)
    // This entirely bypasses browser CORS restrictions
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream storage error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const isDownload = searchParams.get('download') === '1';

    // Only copy safe headers to prevent stream corruption
    // Do not copy Transfer-Encoding, Content-Encoding, or AWS-specific headers
    const headers = new Headers();
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      headers.set('Content-Type', 'image/jpeg');
    }
    
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Set caching headers
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    // Use attachment ONLY if requested, otherwise inline to allow <img> tag loading
    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[media/download] GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

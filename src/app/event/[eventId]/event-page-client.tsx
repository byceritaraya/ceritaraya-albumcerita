'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { UploadForm } from './upload-form';
import { Gallery, type GalleryPhoto } from './gallery';

interface EventPageClientProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  galleryPhotos: GalleryPhoto[];
  totalPhotos: number;
  totalContributors: number;
}

export function EventPageClient({
  eventId,
  photosUsed,
  photosPerGuest,
  galleryPhotos,
  totalPhotos,
  totalContributors,
}: EventPageClientProps) {
  const router = useRouter();

  // Called by UploadForm after all uploads finish — re-fetches server data
  const handleUploadComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {/* ── Upload / Queue section ── */}
      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <UploadForm
          eventId={eventId}
          photosUsed={photosUsed}
          photosPerGuest={photosPerGuest}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* ── Gallery section ── */}
      <div className="p-6">
        <Gallery
          photos={galleryPhotos}
          totalPhotos={totalPhotos}
          totalContributors={totalContributors}
        />
      </div>
    </>
  );
}

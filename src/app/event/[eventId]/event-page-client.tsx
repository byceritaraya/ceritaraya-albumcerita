'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { UploadForm } from './upload-form';
import { Gallery, type GalleryPhoto } from './gallery';

import { FilmRecipe } from '@/lib/film/types';

interface EventPageClientProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  galleryPhotos: GalleryPhoto[];
  totalPhotos: number;
  totalContributors: number;
  filmRecipe?: FilmRecipe | null;
  coverImageUrl?: string;
  theme?: string;
}

export function EventPageClient({
  eventId,
  photosUsed,
  photosPerGuest,
  galleryPhotos,
  totalPhotos,
  totalContributors,
  filmRecipe,
  coverImageUrl,
  theme,
}: EventPageClientProps) {
  const router = useRouter();

  // Called by UploadForm after all uploads finish — re-fetches server data
  const handleUploadComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {/* ── Upload / Queue section ── */}
      <div className="p-6 bg-[var(--bg-primary)] border-b border-[var(--bg-tertiary)]">
        <UploadForm
          eventId={eventId}
          photosUsed={photosUsed}
          photosPerGuest={photosPerGuest}
          onUploadComplete={handleUploadComplete}
          filmRecipe={filmRecipe}
          coverImageUrl={coverImageUrl}
          theme={theme}
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

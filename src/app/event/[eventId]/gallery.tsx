'use client';

import { useState, useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n/use-t';

export interface GalleryPhoto {
  id: string;
  original_url: string;
  storage_path: string;
  uploaded_at: string;
  guest_name: string;
}

interface GalleryProps {
  photos: GalleryPhoto[];
  totalPhotos: number;
  totalContributors: number;
}

// ─── Photo Modal ─────────────────────────────────────────────────────────────
function PhotoModal({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { t } = useT();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
        aria-label={t.lightbox.close}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          aria-label={t.lightbox.prev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          aria-label={t.lightbox.next}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <div className="relative max-h-[90dvh] max-w-[90dvw]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.original_url}
          alt={`Photo by ${photo.guest_name}`}
          className="max-h-[90dvh] max-w-[90dvw] rounded-xl object-contain shadow-2xl ac-modal-enter"
        />
      </div>
    </div>
  );
}

// ─── Main Gallery ─────────────────────────────────────────────────────────────
export function Gallery({ photos, totalPhotos, totalContributors }: GalleryProps) {
  const { t } = useT();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openModal = useCallback((index: number) => setSelectedIndex(index), []);
  const closeModal = useCallback(() => setSelectedIndex(null), []);
  const goPrev = useCallback(() => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(
    () => setSelectedIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length]
  );

  return (
    <section className="mt-6 w-full text-left">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-[var(--text-primary)]">{t.gallery.title}</h2>
        {photos.length > 0 && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t.gallery.shown(photos.length)}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-8 flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-[var(--text-primary)] leading-none">{totalPhotos}</span>
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] mt-1">{t.gallery.totalPhotos}</span>
        </div>
        <div className="h-8 w-px bg-[var(--bg-tertiary)]" />
        <div className="flex flex-col">
          <span className="text-3xl font-heading text-[var(--text-primary)] leading-none">{totalContributors}</span>
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] mt-1">{t.gallery.momentTakers}</span>
        </div>
      </div>

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--bg-tertiary)] bg-white py-14 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="mb-4 h-10 w-10 text-[var(--text-muted)]/40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm2.25-4.5h.008v.008H15.75V7.5z" />
          </svg>
          <p className="text-base font-semibold text-[var(--text-primary)] mb-1">{t.gallery.emptyTitle}</p>
          <p className="text-sm text-[var(--text-muted)] max-w-[220px] leading-relaxed">{t.gallery.emptyBody}</p>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => openModal(index)}
              className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.original_url}
                alt={`Photo by ${photo.guest_name}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <PhotoModal
          photo={photos[selectedIndex]}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
        />
      )}
    </section>
  );
}

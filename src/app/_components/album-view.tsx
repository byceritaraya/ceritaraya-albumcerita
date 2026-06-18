'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadForm } from '@/app/event/[eventId]/upload-form';
import { togglePhotoVisibility } from '@/app/host/[host_slug]/actions';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlbumPhoto {
  id: string;
  original_url: string;
  storage_path: string;
  uploaded_at: string;
  guest_name: string;
  is_hidden?: boolean;
}

export interface AlbumViewProps {
  role: 'host' | 'guest';
  eventId: string;          // legacy event_id for upload actions
  eventName: string;
  hostName?: string;
  coverImageUrl?: string;
  theme?: string;
  photos: AlbumPhoto[];
  totalPhotos: number;
  totalContributors: number;
  // Guest-only
  contributorName?: string;
  photosUsed?: number;
  photosPerGuest?: number;
  // Host-only
  guestUrl?: string;
  hostSlug?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUsers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577A11.217 11.217 0 0 1 12 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113ZM15.75 12c0 .068-.006.135-.018.2l-3.482-3.481A3.75 3.75 0 0 1 15.75 12ZM21.25 17.25l-2.493-2.493a11.249 11.249 0 0 1-2.517 2.049l-1.06-1.06a9.753 9.753 0 0 0 2.234-1.783l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L4.129 1.24a11.217 11.217 0 0 0-2.804 1.987L.47 1.72a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-1.22-1.22Z" />
    </svg>
  );
}

// ─── Vine Divider ─────────────────────────────────────────────────────────────

function VineDivider() {
  return (
    <div className="flex items-center justify-center my-3 opacity-40">
      <svg width="120" height="16" viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 8 C50 4, 40 12, 30 8 C20 4, 10 12, 0 8" stroke="currentColor" strokeWidth="1" fill="none" className="text-[var(--text-muted)]"/>
        <path d="M60 8 C70 4, 80 12, 90 8 C100 4, 110 12, 120 8" stroke="currentColor" strokeWidth="1" fill="none" className="text-[var(--text-muted)]"/>
        <circle cx="60" cy="8" r="2" fill="currentColor" className="text-[var(--text-muted)]"/>
      </svg>
    </div>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[64px]">
      <div className="text-[var(--theme-primary)]">{icon}</div>
      <span className="text-lg font-bold text-[var(--text-primary)] leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Photo Modal ──────────────────────────────────────────────────────────────

function PhotoModal({ photo, onClose, onPrev, onNext, hasPrev, hasNext }: {
  photo: AlbumPhoto; onClose: () => void; onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {hasPrev && <button onClick={e => { e.stopPropagation(); onPrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition" aria-label="Previous"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" /></svg></button>}
      {hasNext && <button onClick={e => { e.stopPropagation(); onNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition" aria-label="Next"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" /></svg></button>}
      <div className="relative max-h-[92dvh] max-w-[94dvw]" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.original_url} alt={`Photo by ${photo.guest_name}`} className="max-h-[85dvh] max-w-[94dvw] rounded-2xl object-contain shadow-2xl" />
        <p className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Taken by {photo.guest_name}
        </p>
      </div>
    </div>
  );
}

// ─── Album View ───────────────────────────────────────────────────────────────

export function AlbumView(props: AlbumViewProps) {
  const {
    role, eventId, eventName, hostName, coverImageUrl, theme,
    photos: initialPhotos, totalPhotos, totalContributors,
    contributorName, photosUsed = 0, photosPerGuest = 0,
    guestUrl, hostSlug,
  } = props;

  const router = useRouter();
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initialPhotos);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'contributor'>('latest');

  const themeClass = `theme-${(theme || 'Sage').toLowerCase()}`;
  const shotsLeft = photosPerGuest > 0 ? Math.max(0, photosPerGuest - photosUsed) : null;
  const baseVisiblePhotos = role === 'host' ? photos : photos.filter(p => !p.is_hidden);
  const hiddenPhotosCount = photos.filter(p => p.is_hidden).length;
  
  const visiblePhotos = [...baseVisiblePhotos].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else {
      return a.guest_name.localeCompare(b.guest_name);
    }
  });

  const openModal = useCallback((i: number) => setSelectedIndex(i), []);
  const closeModal = useCallback(() => setSelectedIndex(null), []);
  const goPrev = useCallback(() => setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(() => setSelectedIndex(i => (i !== null && i < visiblePhotos.length - 1 ? i + 1 : i)), [visiblePhotos.length]);

  async function handleToggle(photo: AlbumPhoto) {
    if (!hostSlug) return;
    setTogglingId(photo.id);
    try {
      await togglePhotoVisibility(photo.id, photo.is_hidden ?? false, hostSlug);
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_hidden: !p.is_hidden } : p));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  function handleUploadComplete() {
    router.refresh();
  }

  async function shareGuestLink() {
    if (!guestUrl) return;
    try {
      await navigator.share({ title: eventName, url: guestUrl });
    } catch {
      await navigator.clipboard.writeText(guestUrl);
    }
  }

  return (
    <div className={`min-h-[100dvh] bg-[var(--bg-primary)] ${themeClass}`}>
      {/* ── Top bar ── */}
      <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-[var(--theme-primary)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">AlbumCerita</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
            <IconUsers className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
          </div>
          <span className="font-medium text-xs text-[var(--text-secondary)]">
            {role === 'host' ? (hostName?.split('&')[0].trim() || 'Host') : (contributorName || 'Guest')}
          </span>
          <span className="text-[var(--text-muted)] text-xs">
            {role === 'host' ? '· Host' : '· Guest'}
          </span>
        </div>
      </div>

      {/* ── Cover Hero ── */}
      <div className="relative w-full h-[52dvh] bg-[var(--theme-primary)]/10 overflow-hidden pt-0">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Event Cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--theme-primary)]/20 via-transparent to-black/40" />
      </div>

      {/* ── Content ── */}
      <div className="relative bg-[var(--bg-primary)] -mt-4 rounded-t-[24px] px-5 pt-6 pb-12">

        {/* Event title */}
        <h1 className="font-heading text-3xl leading-tight text-[var(--text-primary)]">
          {eventName}
        </h1>
        <p className="mt-1 mb-6 text-sm text-[var(--text-muted)]">
          By AlbumCerita
        </p>

        {role === 'host' && hostName && (
          <div className="mb-6 rounded-xl bg-[var(--theme-primary)]/5 p-5 border border-[var(--theme-primary)]/10">
            <h2 className="text-lg font-heading text-[var(--text-primary)] mb-1">
              Welcome to your own moments, {hostName.split('&')[0].trim()}.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This is where memories captured by your guests come together. Review, curate, and share the best moments.
            </p>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className={`flex items-center ${role === 'host' ? 'justify-center gap-8' : 'justify-between'} overflow-x-auto py-2 no-scrollbar`}>
          <StatItem icon={<IconUsers className="h-4 w-4" />} value={totalContributors} label="Guests" />
          <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
          <StatItem icon={<IconImage className="h-4 w-4" />} value={totalPhotos} label="Moments" />
          
          {role === 'guest' && shotsLeft !== null && (
            <>
              <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
              <StatItem icon={<IconGrid className="h-4 w-4" />} value={shotsLeft} label="Shots Left" />
            </>
          )}

          {role === 'host' && (
            <>
              <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
              <StatItem icon={<IconEyeOff className="h-4 w-4" />} value={hiddenPhotosCount} label="Hidden" />
            </>
          )}
        </div>

        {/* ── Action buttons / Upload Panel ── */}
        <div className="mt-5">
          {role === 'guest' ? (
            <UploadForm
              eventId={eventId}
              photosUsed={photosUsed}
              photosPerGuest={photosPerGuest}
              onUploadComplete={handleUploadComplete}
            />
          ) : (
            <div className="flex items-center gap-3">
              {/* Host: Share Guest Link */}
              {guestUrl && (
                <button
                  onClick={shareGuestLink}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
                >
                  <IconShare className="h-4 w-4" />
                  Share Guest Link
                </button>
              )}
              <button
                disabled
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-tertiary)] px-5 py-3 text-sm font-semibold text-[var(--text-muted)] cursor-not-allowed"
              >
                Publish Album (Soon)
              </button>
            </div>
          )}
        </div>

        {/* ── Captured Moments ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-[var(--text-primary)]">Captured Moments</h2>
            {role === 'host' && visiblePhotos.length > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'contributor')}
                className="text-xs text-[var(--text-secondary)] font-medium bg-transparent outline-none focus:ring-0 border-none cursor-pointer py-1 pl-2 pr-6 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="latest">Sort by Latest</option>
                <option value="contributor">Sort by Contributor</option>
              </select>
            )}
          </div>

          {/* Empty state */}
          {visiblePhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconCamera className="h-10 w-10 text-[var(--theme-primary)]/30 mb-3" />
              <p className="text-sm font-medium text-[var(--text-muted)]">No moments yet</p>
              {role === 'guest' && <p className="text-xs text-[var(--text-muted)] mt-1">Be the first to capture a moment!</p>}
            </div>
          )}

          {/* Photo grid */}
          {visiblePhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {visiblePhotos.map((photo, index) => (
                <div key={photo.id} className="relative aspect-square group">
                  <button
                    onClick={() => openModal(index)}
                    className={`relative w-full h-full overflow-hidden rounded-2xl bg-[var(--theme-primary)]/10 focus:outline-none ${photo.is_hidden ? 'opacity-40' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.original_url}
                      alt={`Photo by ${photo.guest_name}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* "Taken by" label */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[var(--theme-primary)]/80 via-[var(--theme-primary)]/30 to-transparent pt-8 pb-2 px-2.5 rounded-b-2xl">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-white/40 flex-shrink-0 flex items-center justify-center">
                          <IconUsers className="h-2.5 w-2.5 text-white" />
                        </div>
                        <p className="text-[10px] font-medium text-white truncate">Taken by {photo.guest_name}</p>
                      </div>
                    </div>
                  </button>

                  {/* Host-only: Hide/Show toggle */}
                  {role === 'host' && (
                    <button
                      onClick={() => handleToggle(photo)}
                      disabled={togglingId === photo.id}
                      className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-white backdrop-blur-sm transition disabled:opacity-50 ${photo.is_hidden ? 'bg-[var(--text-muted)]/80 hover:bg-[var(--text-muted)]' : 'bg-[var(--theme-primary)]/80 hover:bg-[var(--theme-primary)]'}`}
                      title={photo.is_hidden ? 'Show photo' : 'Hide photo'}
                    >
                      {togglingId === photo.id ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                      ) : photo.is_hidden ? (
                        <IconEyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <IconEye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 flex items-end justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] italic leading-relaxed max-w-[200px]">
            Every photo you share becomes part of our beautiful story.
          </p>
          <IconHeart className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
        </div>
      </div>

      {/* ── Lightbox modal ── */}
      {selectedIndex !== null && visiblePhotos[selectedIndex] && (
        <PhotoModal
          photo={visiblePhotos[selectedIndex]}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < visiblePhotos.length - 1}
        />
      )}
    </div>
  );
}

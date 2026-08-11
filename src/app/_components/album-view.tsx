'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadForm } from '@/app/event/[eventId]/upload-form';
import { PhotoLightbox } from './photo-lightbox';
import { useT } from '@/lib/i18n/use-t';
import { LangSwitcher } from '@/app/_components/lang-switcher';
import { FilmRecipe, FilmRecipeSettings } from '@/lib/film/types';
import { FilmImage } from '@/lib/film/FilmImage';
import { FilmRenderer } from '@/lib/film/FilmRenderer';

function AutoPublishCountdown({ autoPublishAt, t }: { autoPublishAt: string; t: ReturnType<typeof useT>['t'] }) {
  const [timeLeft, setTimeLeft] = useState('');
  const hasReloaded = useRef(false);

  useEffect(() => {
    const target = new Date(autoPublishAt).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        if (!hasReloaded.current) {
          hasReloaded.current = true;
          setTimeout(() => window.location.reload(), 1000);
        }
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPublishAt]);

  return (
    <div className="flex flex-col items-center gap-1 mb-6">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-medium">
        {t.albumView.autoPublishCountdown}
      </span>
      <span className="text-3xl font-light tabular-nums tracking-tight text-[var(--text-primary)] leading-none">
        {timeLeft || '00:00:00'}
      </span>
    </div>
  );
}

export interface AlbumPhoto {
  id: string;
  original_url: string;
  storage_path: string;
  uploaded_at: string;
  guest_name: string;
  guest_token?: string;
  is_hidden?: boolean;
}

export interface AlbumViewProps {
  role: 'host' | 'guest' | 'public';
  eventId: string;          // legacy event_id for upload actions
  eventName: string;
  eventDate?: string;
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
  currentContributorToken?: string;
  guestUrl?: string;
  slug?: string;
  isPublished?: boolean;
  publicUrl?: string;
  filmRecipe?: FilmRecipe | null;
  autoPublishAt?: string | null;
  rollDevelopedAt?: string | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
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

// ─── Editorial Stat Item ──────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-3xl font-light tracking-tight text-[var(--text-primary)] leading-none tabular-nums">{value}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-medium">{label}</span>
    </div>
  );
}

// ─── Photo Card (shared grid item) ───────────────────────────────────────────

interface PhotoCardProps {
  photo: AlbumPhoto;
  index: number;
  isSelectMode: boolean;
  selectedPhotoIds: Set<string>;
  stableFilmRecipe: FilmRecipeSettings | null;
  role: string;
  isPublished?: boolean;
  currentContributorToken?: string;
  togglingId: string | null;
  onOpen: (i: number) => void;
  onToggleSelection: (id: string) => void;
  onToggleVisibility: (photo: AlbumPhoto) => void;
  onDeleteRequest: (photo: AlbumPhoto) => void;
  rollDevelopedAt?: string | null;
}

function PhotoCard({
  photo,
  index,
  isSelectMode,
  selectedPhotoIds,
  stableFilmRecipe,
  role,
  isPublished,
  currentContributorToken,
  togglingId,
  onOpen,
  onToggleSelection,
  onToggleVisibility,
  onDeleteRequest,
  rollDevelopedAt,
}: PhotoCardProps) {
  const { t } = useT();
  const isSelected = selectedPhotoIds.has(photo.id);

  return (
    <div className="relative aspect-square group">
      <button
        onClick={() => {
          if (isSelectMode) onToggleSelection(photo.id);
          else onOpen(index);
        }}
        className={`relative w-full h-full overflow-hidden rounded-2xl bg-[var(--theme-primary)]/10 focus:outline-none ${photo.is_hidden ? 'opacity-40' : ''} ${isSelectMode && isSelected ? 'ring-4 ring-[var(--theme-primary)] ring-inset' : ''}`}
      >
        {stableFilmRecipe ? (
          <FilmImage
            photoId={photo.id}
            src={photo.original_url}
            recipeSettings={stableFilmRecipe}
            alt={`Photo by ${photo.guest_name}`}
            className={`w-full h-full object-cover transition-transform duration-300 ${isSelectMode && isSelected ? 'scale-90 rounded-xl' : 'group-hover:scale-105'}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.original_url}
            alt={`Photo by ${photo.guest_name}`}
            className={`w-full h-full object-cover transition-transform duration-300 ${isSelectMode && isSelected ? 'scale-90 rounded-xl' : 'group-hover:scale-105'}`}
            loading="lazy"
          />
        )}
      </button>

      {/* Checkbox for Select Mode */}
      {isSelectMode && (
        <div className="absolute top-2 left-2 pointer-events-none">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]' : 'border-white/80 bg-black/20'}`}>
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Host-only: Hide/Show toggle */}
      {role === 'host' && !isSelectMode && (
        <button
          onClick={() => onToggleVisibility(photo)}
          disabled={togglingId === photo.id}
          className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-white backdrop-blur-sm transition disabled:opacity-50 ${photo.is_hidden ? 'bg-[var(--text-muted)]/80 hover:bg-[var(--text-muted)]' : 'bg-[var(--theme-primary)]/80 hover:bg-[var(--theme-primary)]'}`}
          title={photo.is_hidden ? t.albumView.unhide : t.albumView.hide}
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

      {/* Guest-only: Delete own photo */}
      {role === 'guest' && !isPublished && !rollDevelopedAt && photo.guest_token === currentContributorToken && (
        <button
          onClick={() => onDeleteRequest(photo)}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          title={t.deleteModal.title}
        >
          <IconTrash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Album View ───────────────────────────────────────────────────────────────

export function AlbumView({
  role,
  eventId,
  eventName,
  eventDate,
  hostName,
  coverImageUrl,
  theme,
  photos: initialPhotos,
  totalPhotos,
  totalContributors,
  contributorName,
  photosUsed = 0,
  photosPerGuest = 0,
  currentContributorToken,
  guestUrl,
  slug,
  isPublished,
  publicUrl,
  filmRecipe,
  autoPublishAt,
  rollDevelopedAt,
}: AlbumViewProps) {
  const { t } = useT();

  const router = useRouter();
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initialPhotos);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Extract settings from the full recipe for rendering logic.
  // This keeps FilmRenderer and FilmImage decoupled from recipe metadata.
  const stableFilmRecipe = useMemo<FilmRecipeSettings | null>(
    () => filmRecipe?.settings ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filmRecipe?.settings)],
  );

  // Revoke all rendered Blob URLs when AlbumView unmounts.
  useEffect(() => {
    return () => {
      FilmRenderer.clearCache();
    };
  }, []);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'contributor'>('latest');

  // Bulk selection states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Deletion states
  const [photoToDelete, setPhotoToDelete] = useState<AlbumPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localPhotosUsed, setLocalPhotosUsed] = useState(photosUsed);

  useEffect(() => {
    setLocalPhotosUsed(photosUsed);
  }, [photosUsed]);

  // Publish states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingContributor, setDownloadingContributor] = useState<string | null>(null);

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Onyx', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;
  const shotsLeft = photosPerGuest > 0 ? Math.max(0, photosPerGuest - localPhotosUsed) : null;

  // Hosts see all photos. Guests see non-hidden photos from others + all their own.
  const baseVisiblePhotos = role === 'host'
    ? photos
    : photos.filter(p => !p.is_hidden || p.guest_token === currentContributorToken);

  const hiddenPhotosCount = photos.filter(p => p.is_hidden).length;

  const visiblePhotos = [...baseVisiblePhotos].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else {
      return a.guest_name.localeCompare(b.guest_name);
    }
  });

  const myPhotos = role === 'guest'
    ? [...baseVisiblePhotos].filter(p => p.guest_token === currentContributorToken).sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    : [];

  const openModal = useCallback((i: number) => setSelectedIndex(i), []);
  const closeModal = useCallback(() => setSelectedIndex(null), []);
  const goPrev = useCallback(() => setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(() => setSelectedIndex(i => (i !== null && i < visiblePhotos.length - 1 ? i + 1 : i)), [visiblePhotos.length]);

  function toggleSelection(id: string) {
    const next = new Set(selectedPhotoIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPhotoIds(next);
  }

  function clearSelection() {
    setSelectedPhotoIds(new Set());
    setIsSelectMode(false);
  }

  async function handleBulkHide() {
    if (!slug) return;
    const ids = Array.from(selectedPhotoIds);
    try {
      await import('@/app/host/[slug]/actions').then(m => m.bulkHidePhotos(ids, slug));
      setPhotos(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_hidden: true } : p));
      clearSelection();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleBulkUnhide() {
    if (!slug) return;
    const ids = Array.from(selectedPhotoIds);
    try {
      await import('@/app/host/[slug]/actions').then(m => m.bulkUnhidePhotos(ids, slug));
      setPhotos(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_hidden: false } : p));
      clearSelection();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleConfirmDelete() {
    if (!slug || !photoToDelete) return;
    setIsDeleting(true);
    try {
      await import('@/app/guest/[slug]/actions').then(m => m.deletePhoto(photoToDelete.id, slug));
      setPhotos(prev => prev.filter(p => p.id !== photoToDelete.id));
      setLocalPhotosUsed(prev => Math.max(0, prev - 1));
      setPhotoToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  }

  const groupedPhotos = sortBy === 'contributor'
    ? visiblePhotos.reduce((acc, photo) => {
        if (!acc[photo.guest_name]) acc[photo.guest_name] = [];
        acc[photo.guest_name].push(photo);
        return acc;
      }, {} as Record<string, AlbumPhoto[]>)
    : null;

  const sortedGroups = groupedPhotos
    ? Object.entries(groupedPhotos).sort((a, b) => {
        const aLatest = Math.max(...a[1].map(p => new Date(p.uploaded_at).getTime()));
        const bLatest = Math.max(...b[1].map(p => new Date(p.uploaded_at).getTime()));
        return bLatest - aLatest;
      })
    : null;

  async function handleToggle(photo: AlbumPhoto) {
    if (!slug) return;
    setTogglingId(photo.id);
    try {
      await import('@/app/host/[slug]/actions').then(m => m.togglePhotoVisibility(photo.id, photo.is_hidden ?? false, slug));
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_hidden: !p.is_hidden } : p));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  async function handlePublish() {
    if (!slug) return;
    setIsPublishing(true);
    try {
      const m = await import('@/app/host/[slug]/actions');
      await m.publishAlbum(slug);
      router.refresh();
      setShowPublishModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!slug) return;
    setIsPublishing(true);
    try {
      const m = await import('@/app/host/[slug]/actions');
      await m.unpublishAlbum(slug);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
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

  async function copyPublicLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handleDownloadAlbum() {
    if (!slug) return;
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = `/api/download/${slug}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsDownloading(false), 3000);
    }
  }

  async function handleDownloadContributor(guestName: string) {
    if (!slug) return;
    setDownloadingContributor(guestName);
    try {
      const a = document.createElement('a');
      a.href = `/api/download/${slug}?contributor=${encodeURIComponent(guestName)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDownloadingContributor(null), 3000);
    }
  }

  // Shared photo card props
  const sharedCardProps = {
    isSelectMode,
    selectedPhotoIds,
    stableFilmRecipe,
    role,
    isPublished,
    currentContributorToken,
    togglingId,
    onOpen: openModal,
    onToggleSelection: toggleSelection,
    onToggleVisibility: handleToggle,
    onDeleteRequest: setPhotoToDelete,
    rollDevelopedAt,
  };

  return (
    <div className={`relative min-h-[100dvh] bg-[var(--bg-primary)] ${themeClass}`}>

      {/* ── Utility Bar (top-right) ── */}
      {selectedIndex === null && (
        <div className="fixed top-6 right-6 z-30">
          <LangSwitcher />
        </div>
      )}

      {/* ── Cover Hero ── */}
      <div className="relative w-full h-[65dvh] shrink-0 pointer-events-none">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Event Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-50" />
        )}

        {/* Gradient: strong bottom fade to background color for smooth transition */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 75%, rgba(var(--theme-bg-rgb),0.4) 88%, rgba(var(--theme-bg-rgb),1) 100%)'
          }}
        />

        {/* Event Identity (Title, Date, Stats) overlaid on hero */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-0 translate-y-24 pointer-events-none flex flex-col items-center text-center">
          <h1 className="font-heading text-3xl font-light leading-tight tracking-tight text-[var(--text-primary)] text-balance">
            {eventName}
          </h1>
          {eventDate && (
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] font-medium">
              {eventDate}
            </p>
          )}
          
          {/* Editorial Stats (inside hero) */}
          <div className="mt-4 flex items-center justify-center gap-14 pointer-events-auto">
            <StatItem value={totalContributors} label={t.albumView.stats.momentTakers} />
            <StatItem value={totalPhotos} label={t.albumView.stats.moments} />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 px-5 pb-12 flex-1 pt-28">

        {/* ── Auto Publish Countdown ── */}
        {!isPublished && autoPublishAt && ((role === 'guest' && rollDevelopedAt) || role === 'host') && (
          <AutoPublishCountdown autoPublishAt={autoPublishAt} t={t} />
        )}

        {/* ── Action buttons / Upload Panel ── */}
        <div>
          {isPublished ? (
            <button
              onClick={handleDownloadAlbum}
              disabled={isDownloading}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? t.albumView.preparingDownload : t.albumView.downloadAlbum}
            </button>
          ) : role === 'guest' && !rollDevelopedAt ? (
            <UploadForm
              eventId={eventId}
              photosUsed={localPhotosUsed}
              photosPerGuest={photosPerGuest}
              onUploadComplete={handleUploadComplete}
              filmRecipe={filmRecipe}
              coverImageUrl={coverImageUrl}
              theme={safeTheme.toLowerCase()}
            />
          ) : role === 'host' ? (
            !isPublished ? (
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
              >
                {t.albumView.publishNow}
              </button>
            ) : null
          ) : null}
        </div>

        {/* ── Roll Developed Notice (Guest Only) ── */}
        {role === 'guest' && rollDevelopedAt && !isPublished && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-medium text-center">{t.filmRoll.rollShared}</p>
        )}

        {/* ── Publish Notice (Host Only, inline) ── */}
        {role === 'host' && isPublished && publicUrl && (
          <div className="mt-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-primary)] flex-shrink-0" />
              <span className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--theme-primary)]">{t.albumView.published}</span>
            </div>
            <p className="font-mono text-sm text-[var(--text-secondary)] mb-3 pl-3.5 truncate">{publicUrl}</p>
            <div className="flex items-center gap-4 pl-3.5">
              <button
                onClick={copyPublicLink}
                className="text-sm font-medium text-[var(--theme-primary)] underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                {copiedLink ? t.albumView.linkCopied : t.albumView.copyLink}
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                {isPublishing ? t.albumView.saving : t.albumView.unpublish}
              </button>
            </div>
          </div>
        )}

        {/* ── Gallery ── */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            {role === 'host' && visiblePhotos.length > 0 && (
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'contributor')}
                  className="text-xs text-[var(--text-secondary)] font-medium bg-transparent outline-none focus:ring-0 border-none cursor-pointer py-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                  style={{ WebkitAppearance: 'none' }}
                >
                  <option value="latest">{t.albumView.sortLatest}</option>
                  <option value="contributor">{t.albumView.sortContributor}</option>
                </select>
                <button
                  onClick={() => {
                    if (isSelectMode) clearSelection();
                    else setIsSelectMode(true);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${isSelectMode ? 'bg-[var(--theme-primary)] text-white' : 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20'}`}
                >
                  {isSelectMode ? t.albumView.cancelSelect : t.albumView.select}
                </button>
              </div>
            )}
          </div>

          {/* Empty state */}
          {visiblePhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <IconCamera className="h-9 w-9 text-[var(--theme-primary)]/20 mb-5" />
              <p className="text-base font-semibold text-[var(--text-primary)] mb-1">{t.albumView.emptyTitle}</p>
              {role === 'guest' && <p className="text-sm text-[var(--text-muted)] max-w-[220px] leading-relaxed">{t.albumView.emptyGuest}</p>}
              {role === 'host' && <p className="text-sm text-[var(--text-muted)] max-w-[220px] leading-relaxed">{t.albumView.emptyHost}</p>}
            </div>
          )}

          {/* Photo grid or groups */}
          {visiblePhotos.length > 0 && (
            <>
              {role === 'guest' ? (
                <div className="space-y-10">
                  {myPhotos.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)] font-medium mb-4">{t.albumView.yourMoments}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {myPhotos.map((photo) => {
                          const index = visiblePhotos.findIndex(p => p.id === photo.id);
                          return (
                            <PhotoCard key={photo.id} photo={photo} index={index} {...sharedCardProps} />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : sortBy === 'latest' ? (
                <div className="grid grid-cols-2 gap-2">
                  {visiblePhotos.map((photo, index) => (
                    <PhotoCard key={photo.id} photo={photo} index={index} {...sharedCardProps} />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedGroups?.map(([guestName, groupPhotos]) => (
                    <div key={guestName} className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-heading text-lg text-[var(--text-primary)] leading-none">{guestName}</h3>
                          <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">
                            {t.albumView.moment(groupPhotos.length)}
                          </span>
                        </div>
                        {role === 'host' && (
                          <button
                            onClick={() => handleDownloadContributor(guestName)}
                            disabled={downloadingContributor === guestName}
                            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--theme-primary)] transition-colors disabled:opacity-50"
                          >
                            {downloadingContributor === guestName ? t.albumView.preparingDownload : t.albumView.download}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {groupPhotos.map((photo) => {
                          const index = visiblePhotos.findIndex(p => p.id === photo.id);
                          return (
                            <PhotoCard key={photo.id} photo={photo} index={index} {...sharedCardProps} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom breathing room */}
        <div className="h-16" />
      </div>

      {/* ── Lightbox modal ── */}
      {selectedIndex !== null && visiblePhotos[selectedIndex] && (
        <PhotoLightbox
          photoId={visiblePhotos[selectedIndex].id}
          photoUrl={visiblePhotos[selectedIndex].original_url}
          guestName={visiblePhotos[selectedIndex].guest_name}
          uploadedAt={visiblePhotos[selectedIndex].uploaded_at}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < visiblePhotos.length - 1}
          eventName={eventName}
          photoNumber={selectedIndex + 1}
          filmRecipe={stableFilmRecipe}
          isPublished={isPublished}
          theme={safeTheme.toLowerCase()}
          onDelete={
            (role === 'guest' && !isPublished && !rollDevelopedAt && visiblePhotos[selectedIndex].guest_token === currentContributorToken)
            ? () => setPhotoToDelete(visiblePhotos[selectedIndex])
            : undefined
          }
        />
      )}

      {/* ── Publish Confirmation Modal ── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl border border-[var(--bg-tertiary)] ac-modal-enter">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t.publishModal.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed whitespace-pre-line">
              {t.publishModal.body}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="flex-1 rounded-xl border border-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {t.publishModal.cancel}
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 rounded-xl bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--theme-secondary)] disabled:opacity-50"
              >
                {isPublishing ? t.publishModal.publishing : t.publishModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guest Delete Modal ── */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl text-center border border-[var(--bg-tertiary)] ac-modal-enter">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
              <IconTrash className="h-6 w-6 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t.deleteModal.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {t.deleteModal.body}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPhotoToDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {t.deleteModal.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--theme-secondary)] disabled:opacity-50"
              >
                {isDeleting ? t.deleteModal.removing : t.deleteModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Host Moderation Bar ── */}
      {isSelectMode && selectedPhotoIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--text-primary)] p-2 shadow-2xl backdrop-blur-md">
            <div className="px-3 py-1">
              <span className="text-sm font-medium text-white">{t.modBar.selected(selectedPhotoIds.size)}</span>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <button
              onClick={handleBulkHide}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <IconEyeOff className="h-4 w-4" />
              {t.modBar.hide}
            </button>
            <button
              onClick={handleBulkUnhide}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <IconEye className="h-4 w-4" />
              {t.modBar.show}
            </button>
            <button
              onClick={clearSelection}
              className="ml-1 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label={t.albumView.cancelSelect}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

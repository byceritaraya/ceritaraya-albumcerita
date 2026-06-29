'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadForm } from '@/app/event/[eventId]/upload-form';
import { PhotoLightbox } from './photo-lightbox';

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
  // Host-only
  guestUrl?: string;
  slug?: string;
  isPublished?: boolean;
  publicUrl?: string;
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

function IconFilmRoll({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2h-17ZM3.5 4h3v3h-3V4Zm0 5h3v3h-3V9Zm0 5h3v3h-3v-3Zm13.5 3h3v-3h-3v3Zm0-5h3V9h-3v3Zm0-5h3V4h-3v3ZM9 4v16h6V4H9Z" clipRule="evenodd" />
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

// ─── Album View ───────────────────────────────────────────────────────────────

export function AlbumView(props: AlbumViewProps) {
  const {
    role, eventId, eventName, hostName, coverImageUrl, theme,
    photos: initialPhotos, totalPhotos, totalContributors,
    contributorName, photosUsed = 0, photosPerGuest = 0,
    guestUrl, slug, isPublished = false, publicUrl,
  } = props;

  const router = useRouter();
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initialPhotos);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

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

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;
  const shotsLeft = photosPerGuest > 0 ? Math.max(0, photosPerGuest - localPhotosUsed) : null;
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

  const myPhotos = role === 'guest' ? [...baseVisiblePhotos].filter(p => p.guest_token === props.currentContributorToken).sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()) : [];
  const otherPhotos = role === 'guest' ? [...baseVisiblePhotos].filter(p => p.guest_token !== props.currentContributorToken).sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()) : [];

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
      // Small timeout to allow the browser to start download
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
          {role !== 'public' && (
            <>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
                <IconUsers className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
              </div>
              <span className="font-medium text-xs text-[var(--text-secondary)]">
                {role === 'host' ? (hostName || 'Host') : (contributorName || 'Guest')}
              </span>
              <span className="text-[var(--text-muted)] text-xs">
                {role === 'host' ? '· Host' : '· Guest'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Cover Hero ── */}
      <div className="absolute top-0 inset-x-0 h-[60dvh] pointer-events-none">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Event Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-50" />
        )}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.20) 40%, rgba(var(--theme-bg-rgb),0.85) 80%, rgba(var(--theme-bg-rgb),1) 100%)'
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 px-5 pt-[40dvh] pb-12">

        {/* Event title */}
        <h1 className="font-heading text-3xl leading-tight text-[var(--text-primary)]">
          {eventName}
        </h1>
        <p className="mt-1 mb-6 text-sm text-[var(--text-muted)]">
          By AlbumCerita
        </p>


        {/* ── Stats row ── */}
        <div className={`flex items-center ${role === 'host' ? 'justify-center gap-8' : 'justify-between'} overflow-x-auto py-2 no-scrollbar`}>
          <StatItem icon={<IconUsers className="h-4 w-4 text-[var(--theme-primary)]" />} value={totalContributors} label="Moment Takers" />
          <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
          <StatItem icon={<IconImage className="h-4 w-4 text-[var(--theme-primary)]" />} value={totalPhotos} label="Moments" />
          
          {role === 'guest' && shotsLeft !== null && (
            <>
              <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
              <StatItem icon={<IconFilmRoll className="h-4 w-4 text-[var(--theme-primary)]" />} value={shotsLeft} label="Shots Left" />
            </>
          )}

          {role === 'host' && (
            <>
              <div className="w-px h-10 bg-[var(--theme-secondary)] opacity-30 self-center" />
              <StatItem icon={<IconEyeOff className="h-4 w-4" />} value={hiddenPhotosCount} label="Hidden" />
            </>
          )}
        </div>

        {/* ── Publish Notice (Host Only) ── */}
        {role === 'host' && isPublished && publicUrl && (
          <div className="mt-6 rounded-xl border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-md p-5 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-primary)]/10 px-3 py-1 mb-3">
              <span className="h-2 w-2 rounded-full bg-[var(--theme-primary)]"></span>
              <span className="text-xs font-semibold text-[var(--theme-primary)]">Published</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Public Album</p>
            <p className="font-mono text-sm font-medium text-[var(--text-primary)] mb-4">{publicUrl}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={copyPublicLink}
                className="flex items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--theme-secondary)]"
              >
                {copiedLink ? 'Copied!' : 'Copy Public Link'}
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="flex items-center gap-2 rounded-lg border border-[var(--bg-tertiary)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {isPublishing ? 'Updating...' : 'Unpublish Album'}
              </button>
            </div>
          </div>
        )}

        {/* ── Action buttons / Upload Panel ── */}
        <div className="mt-5">
          {isPublished ? (
            <button
              onClick={handleDownloadAlbum}
              disabled={isDownloading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
              </svg>
              {isDownloading ? 'Preparing your album...' : 'Download Curated Album'}
            </button>
          ) : role === 'guest' ? (
            <UploadForm
              eventId={eventId}
              photosUsed={photosUsed}
              photosPerGuest={photosPerGuest}
              onUploadComplete={handleUploadComplete}
            />
          ) : role === 'host' ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Host: Share Guest Link */}
              {guestUrl ? (
                <button
                  onClick={shareGuestLink}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
                >
                  <IconShare className="h-4 w-4" />
                  Share Guest Link
                </button>
              ) : (
                <div />
              )}
              {!isPublished ? (
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-6 text-sm font-semibold text-[var(--theme-primary)] transition hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
                >
                  Publish Album
                </button>
              ) : (
                <div />
              )}
            </div>
          ) : null}
        </div>

        {/* ── Captured Moments ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            {role === 'host' && (
              <h2 className="font-heading text-xl text-[var(--text-primary)]">Captured Moments</h2>
            )}
            {role === 'host' && visiblePhotos.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'contributor')}
                  className="text-xs text-[var(--text-secondary)] font-medium bg-transparent outline-none focus:ring-0 border-none cursor-pointer py-1 pl-2 pr-6 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                  style={{ WebkitAppearance: 'none' }}
                >
                  <option value="latest">Sort by Latest</option>
                  <option value="contributor">Sort by Contributor</option>
                </select>
                <button
                  onClick={() => {
                    if (isSelectMode) clearSelection();
                    else setIsSelectMode(true);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${isSelectMode ? 'bg-[var(--theme-primary)] text-white' : 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20'}`}
                >
                  {isSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
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

          {/* Photo grid or Groups */}
          {visiblePhotos.length > 0 && (
            <>
              {role === 'guest' ? (
                <div className="space-y-8">
                  {myPhotos.length > 0 && (
                    <div>
                      <h3 className="font-heading text-lg text-[var(--text-primary)] mb-3">Your Captured Moments</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {myPhotos.map((photo) => {
                          const index = visiblePhotos.findIndex(p => p.id === photo.id);
                          return (
                            
                <div key={photo.id} className="relative aspect-square group">
                  <button
                    onClick={() => {
                      if (isSelectMode) toggleSelection(photo.id);
                      else openModal(index);
                    }}
                    className={`relative w-full h-full overflow-hidden rounded-2xl bg-[var(--theme-primary)]/10 focus:outline-none ${photo.is_hidden ? 'opacity-40' : ''} ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'ring-4 ring-[var(--theme-primary)] ring-inset' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.original_url}
                      alt={`Photo by ${photo.guest_name}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'scale-90 rounded-xl' : 'group-hover:scale-105'}`}
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

                  {/* Checkbox for Select Mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${selectedPhotoIds.has(photo.id) ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]' : 'border-white/80 bg-black/20'}`}>
                        {selectedPhotoIds.has(photo.id) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Host-only: Hide/Show toggle (hidden in select mode) */}
                  {(role as string) === 'host' && !isSelectMode && (
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

                  {/* Guest-only: Delete own photo */}
                  {(role as string) === 'guest' && !isPublished && photo.guest_token === props.currentContributorToken && (
                    <button
                      onClick={() => setPhotoToDelete(photo)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                      title="Delete photo"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>

                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : sortBy === 'latest' ? (
                <div className="grid grid-cols-2 gap-2">
                  {visiblePhotos.map((photo, index) => (
                    
                <div key={photo.id} className="relative aspect-square group">
                  <button
                    onClick={() => {
                      if (isSelectMode) toggleSelection(photo.id);
                      else openModal(index);
                    }}
                    className={`relative w-full h-full overflow-hidden rounded-2xl bg-[var(--theme-primary)]/10 focus:outline-none ${photo.is_hidden ? 'opacity-40' : ''} ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'ring-4 ring-[var(--theme-primary)] ring-inset' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.original_url}
                      alt={`Photo by ${photo.guest_name}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'scale-90 rounded-xl' : 'group-hover:scale-105'}`}
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

                  {/* Checkbox for Select Mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${selectedPhotoIds.has(photo.id) ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]' : 'border-white/80 bg-black/20'}`}>
                        {selectedPhotoIds.has(photo.id) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Host-only: Hide/Show toggle (hidden in select mode) */}
                  {(role as string) === 'host' && !isSelectMode && (
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

                  {/* Guest-only: Delete own photo */}
                  {(role as string) === 'guest' && !isPublished && photo.guest_token === props.currentContributorToken && (
                    <button
                      onClick={() => setPhotoToDelete(photo)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                      title="Delete photo"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>

                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedGroups?.map(([guestName, groupPhotos]) => (
                    <div key={guestName} className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--theme-primary)]">
                          <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                        </svg>
                        <h3 className="font-heading text-lg text-[var(--text-primary)] leading-none">{guestName}</h3>
                        <span className="text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full ml-1">
                          {groupPhotos.length} {groupPhotos.length === 1 ? 'Moment' : 'Moments'}
                        </span>
                        {role === 'host' && (
                          <button
                            onClick={() => handleDownloadContributor(guestName)}
                            disabled={downloadingContributor === guestName}
                            className="ml-auto text-xs flex items-center gap-1 font-semibold bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--theme-primary)]/20 transition disabled:opacity-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                            </svg>
                            {downloadingContributor === guestName ? 'Preparing...' : 'Download'}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {groupPhotos.map((photo) => {
                          const index = visiblePhotos.findIndex(p => p.id === photo.id);
                          return (
                            
                <div key={photo.id} className="relative aspect-square group">
                  <button
                    onClick={() => {
                      if (isSelectMode) toggleSelection(photo.id);
                      else openModal(index);
                    }}
                    className={`relative w-full h-full overflow-hidden rounded-2xl bg-[var(--theme-primary)]/10 focus:outline-none ${photo.is_hidden ? 'opacity-40' : ''} ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'ring-4 ring-[var(--theme-primary)] ring-inset' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.original_url}
                      alt={`Photo by ${photo.guest_name}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${isSelectMode && selectedPhotoIds.has(photo.id) ? 'scale-90 rounded-xl' : 'group-hover:scale-105'}`}
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

                  {/* Checkbox for Select Mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${selectedPhotoIds.has(photo.id) ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]' : 'border-white/80 bg-black/20'}`}>
                        {selectedPhotoIds.has(photo.id) && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Host-only: Hide/Show toggle (hidden in select mode) */}
                  {(role as string) === 'host' && !isSelectMode && (
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

                  {/* Guest-only: Delete own photo */}
                  {(role as string) === 'guest' && !isPublished && photo.guest_token === props.currentContributorToken && (
                    <button
                      onClick={() => setPhotoToDelete(photo)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                      title="Delete photo"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>

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
        <PhotoLightbox
          photo={visiblePhotos[selectedIndex]}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < visiblePhotos.length - 1}
          eventName={eventName}
          photoNumber={selectedIndex + 1}
        />
      )}


      {/* ── Publish Confirmation Modal ── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl border border-[var(--bg-tertiary)]">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Publish Album?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Only visible photos will appear in the public gallery.
              <br/><br/>
              Guests will no longer need a PIN to view the published memories.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="flex-1 rounded-lg border border-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 rounded-lg bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--theme-secondary)] disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guest Delete Modal ── */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl text-center border border-[var(--bg-tertiary)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
              <IconTrash className="h-6 w-6 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Delete this moment?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPhotoToDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--theme-secondary)] disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
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
              <span className="text-sm font-medium text-white">{selectedPhotoIds.size} selected</span>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <button
              onClick={handleBulkHide}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <IconEyeOff className="h-4 w-4" />
              Hide
            </button>
            <button
              onClick={handleBulkUnhide}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <IconEye className="h-4 w-4" />
              Unhide
            </button>
            <button
              onClick={clearSelection}
              className="ml-1 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Cancel"
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

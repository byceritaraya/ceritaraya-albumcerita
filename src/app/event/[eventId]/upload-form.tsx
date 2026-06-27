'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { uploadPhoto } from './actions';

// ─── Types ────────────────────────────────────────────────────────────────────

type ShotStatus = 'pending' | 'uploading' | 'done' | 'error';

interface QueuedShot {
  id: string;
  file: File;
  previewUrl: string; // object URL — must be revoked on cleanup
  status: ShotStatus;
  errorMsg?: string;
}

export interface UploadFormProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number; // 0 = unlimited
  onUploadComplete: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

function IconCamera({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

function IconGallery({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.44 3.44-1.44-1.44a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
    </svg>
  );
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Shot thumbnail card ───────────────────────────────────────────────────────

function ShotCard({
  shot,
  onRemove,
  onPreview,
}: {
  shot: QueuedShot;
  onRemove: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.previewUrl}
        alt="Captured moment"
        className="h-full w-full object-cover"
        onClick={() => onPreview(shot.id)}
      />

      {/* Status overlay */}
      {shot.status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <IconSpinner className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
      {shot.status === 'done' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <IconCheck className="h-7 w-7 text-white" />
        </div>
      )}
      {shot.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center p-2">
            <span className="text-xs font-semibold text-white">Failed</span>
            {shot.errorMsg && (
              <span className="text-[10px] leading-tight text-white/80 line-clamp-2">{shot.errorMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Remove button — only when not actively uploading */}
      {(shot.status === 'pending' || shot.status === 'error') && (
        <button
          type="button"
          onClick={() => onRemove(shot.id)}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          aria-label="Remove this shot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Preview modal (local object URL) ─────────────────────────────────────────

function PreviewModal({
  previewUrl,
  onClose,
}: {
  previewUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
        aria-label="Close preview"
      >
        <IconX className="h-5 w-5" />
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Preview"
          className="max-h-[90dvh] max-w-[90dvw] rounded-xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

// ─── Main UploadForm ──────────────────────────────────────────────────────────

export function UploadForm({
  eventId,
  photosUsed,
  photosPerGuest,
  onUploadComplete,
}: UploadFormProps) {
  const [queue, setQueue] = useState<QueuedShot[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quota math ──────────────────────────────────────────────────────────────
  const unlimited = photosPerGuest === 0;
  const activeInQueue = queue.filter((s) => s.status !== 'done').length;
  const remainingSlots = unlimited ? Infinity : photosPerGuest - photosUsed - activeInQueue;
  const capturedCount = queue.length;
  const canCapture = remainingSlots > 0;

  // ── Enqueue files ────────────────────────────────────────────────────────────
  const enqueueFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setGlobalMessage(null);

      const toAdd = Array.from(files).slice(0, unlimited ? files.length : Math.max(0, remainingSlots));
      const skipped = files.length - toAdd.length;

      if (skipped > 0) {
        setGlobalMessage({
          type: 'error',
          text: `Only ${toAdd.length} photo${toAdd.length !== 1 ? 's' : ''} added — ${skipped} skipped (quota reached).`,
        });
      }

      const newShots: QueuedShot[] = toAdd.map((file) => ({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      }));

      setQueue((prev) => [...prev, ...newShots]);
    },
    [remainingSlots, unlimited]
  );

  // ── Remove a shot ────────────────────────────────────────────────────────────
  const removeShot = useCallback((id: string) => {
    setQueue((prev) => {
      const shot = prev.find((s) => s.id === id);
      if (shot) URL.revokeObjectURL(shot.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  // ── Upload all pending/error shots ───────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    const toUpload = queue.filter((s) => s.status === 'pending' || s.status === 'error');
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setGlobalMessage(null);

    let successCount = 0;
    let failCount = 0;

    for (const shot of toUpload) {
      // Mark as uploading
      setQueue((prev) =>
        prev.map((s) => (s.id === shot.id ? { ...s, status: 'uploading', errorMsg: undefined } : s))
      );

      try {
        const formData = new FormData();
        formData.append('photo', shot.file);
        const result = await uploadPhoto(eventId, {}, formData);

        if (result.error) {
          setQueue((prev) =>
            prev.map((s) => (s.id === shot.id ? { ...s, status: 'error', errorMsg: result.error } : s))
          );
          failCount++;
        } else {
          // Success — revoke object URL and mark done
          URL.revokeObjectURL(shot.previewUrl);
          setQueue((prev) =>
            prev.map((s) => (s.id === shot.id ? { ...s, status: 'done' } : s))
          );
          successCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setQueue((prev) =>
          prev.map((s) => (s.id === shot.id ? { ...s, status: 'error', errorMsg: msg } : s))
        );
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setGlobalMessage({
        type: failCount > 0 ? 'error' : 'success',
        text:
          failCount > 0
            ? `${successCount} uploaded, ${failCount} failed. Retry the failed shots below.`
            : `${successCount} moment${successCount !== 1 ? 's' : ''} shared! ✨`,
      });
      
      if (failCount === 0) {
        setTimeout(() => {
          setGlobalMessage(null);
          onUploadComplete();
        }, 1500);
      } else {
        onUploadComplete();
      }
    } else if (failCount > 0) {
      setGlobalMessage({ type: 'error', text: 'All uploads failed. Tap to retry.' });
    }
  }, [queue, eventId, onUploadComplete]);

  // ── Derived state ────────────────────────────────────────────────────────────
  const pendingCount = queue.filter((s) => s.status === 'pending' || s.status === 'error').length;
  const doneCount = queue.filter((s) => s.status === 'done').length;
  const showUploadCta = pendingCount > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Shot counter (Removed — redundant with AlbumView stats) ── */}

      {/* ── Global status message ── */}
      {globalMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            globalMessage.type === 'success'
              ? 'border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
              : 'border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
          }`}
        >
          {globalMessage.text}
        </div>
      )}

      {/* ── Queued shots grid ── */}
      {queue.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Captured Moments
            </h3>
            {pendingCount > 0 && (
              <span className="text-xs text-[var(--text-secondary)]">{pendingCount} ready to upload</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {queue.map((shot) => (
              <ShotCard
                key={shot.id}
                shot={shot}
                onRemove={removeShot}
                onPreview={(id) => {
                  const s = queue.find((q) => q.id === id);
                  if (s) setPreviewUrl(s.previewUrl);
                }}
              />
            ))}

            {/* Add-more slots (visual hint) */}
            {canCapture && queue.length > 0 && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed border-[var(--theme-secondary)]/50 bg-[var(--theme-primary)]/5 text-[var(--theme-primary)]/60 transition hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
                aria-label="Capture another moment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Upload CTA ── */}
      {showUploadCta && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--theme-primary)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {isUploading ? (
            <>
              <IconSpinner className="h-4 w-4 animate-spin" />
              Sharing Moments…
            </>
          ) : (
            <>
              <IconUpload className="h-4 w-4" />
              Share {pendingCount} Captured Moment{pendingCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {/* ── Capture / gallery buttons ── */}
      {canCapture && (
        <div className="flex items-center gap-3">
          {/* Primary: camera */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            <IconCamera className="h-4 w-4" />
            Take Photo
          </button>

          {/* Secondary: gallery */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-5 py-3 text-sm font-semibold text-[var(--theme-primary)] transition hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            <IconGallery className="h-4 w-4 text-[var(--theme-primary)]" />
            From Gallery
          </button>
        </div>
      )}

      {/* Quota full */}
      {!canCapture && pendingCount === 0 && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          {unlimited
            ? 'All moments have been uploaded.'
            : "You've used all your shots for this event."}
        </p>
      )}

      {/* ── Hidden file inputs ── */}
      <input
        ref={cameraInputRef}
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          enqueueFiles(e.target.files);
          e.target.value = ''; // reset so same file can be recaptured
        }}
      />
      <input
        ref={galleryInputRef}
        id="gallery-input"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          enqueueFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* ── Local preview modal ── */}
      {previewUrl && (
        <PreviewModal previewUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}

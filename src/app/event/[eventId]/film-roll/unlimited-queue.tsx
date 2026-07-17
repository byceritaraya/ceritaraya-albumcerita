import { useT } from '@/lib/i18n/use-t';
import { FilmFrame, GlobalMessage } from './types';

// Shared Icons
export function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.44 3.44-1.44-1.44a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export function IconX({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
    </svg>
  );
}

export function IconUpload({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

export function IconCamera({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

export function IconGallery({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
    </svg>
  );
}

export function IconRefreshCcw({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21v-5h5" />
    </svg>
  );
}

export function IconFilmRoll({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2h-17ZM3.5 4h3v3h-3V4Zm0 5h3v3h-3V9Zm0 5h3v3h-3v-3Zm13.5 3h3v-3h-3v3Zm0-5h3V9h-3v3Zm0-5h3V4h-3v3ZM9 4v16h6V4H9Z" clipRule="evenodd" />
    </svg>
  );
}

interface UnlimitedQueueProps {
  unlimitedQueue: FilmFrame[];
  isUploading: boolean;
  globalMessage: GlobalMessage;
  onRemoveShot: (id: string) => void;
  onUploadBatch: () => void;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}

export function UnlimitedQueue({
  unlimitedQueue,
  isUploading,
  globalMessage,
  onRemoveShot,
  onUploadBatch,
  onCameraClick,
  onGalleryClick,
}: UnlimitedQueueProps) {
  const { t } = useT();
  const pendingCount = unlimitedQueue.filter((s) => s.status === 'queued' || s.status === 'error').length;

  return (
    <div className="flex flex-col gap-4">
      {globalMessage && (
        <div className="rounded-xl border px-4 py-3 text-sm border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] ac-toast-enter">
          {globalMessage.text}
        </div>
      )}

      {unlimitedQueue.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {t.upload.capturedMomentsTitle}
            </h3>
            {pendingCount > 0 && (
              <span className="text-xs text-[var(--text-secondary)]">{t.upload.readyToShare(pendingCount)}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {unlimitedQueue.map((shot) => (
              <div key={shot.id} className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--bg-tertiary)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.previewUrl} alt="Captured moment" className="h-full w-full object-cover" />
                
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
                      <span className="text-xs font-semibold text-white">{t.upload.statusFailed}</span>
                    </div>
                  </div>
                )}

                {(shot.status === 'queued' || shot.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => onRemoveShot(shot.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Remove"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <button
          type="button"
          onClick={onUploadBatch}
          disabled={isUploading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {isUploading ? (
            <><IconSpinner className="h-4 w-4 animate-spin" /> {t.upload.shareBtnActive}</>
          ) : (
            <><IconUpload className="h-4 w-4" /> {t.upload.shareBtn(pendingCount)}</>
          )}
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCameraClick}
          disabled={isUploading}
          className="flex h-14 flex-[1.5] items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
        >
          <IconCamera className="h-4 w-4" />
          {t.filmRoll.takePhoto}
        </button>
        <button
          type="button"
          onClick={onGalleryClick}
          disabled={isUploading}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-6 text-sm font-semibold text-[var(--theme-primary)] transition-all hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
        >
          <IconGallery className="h-4 w-4 text-[var(--theme-primary)]" />
          {t.filmRoll.fromGallery}
        </button>
      </div>
    </div>
  );
}

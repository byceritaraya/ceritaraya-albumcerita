import { useState, useCallback } from 'react';
import { useT } from '@/lib/i18n/use-t';
import { FilmFrame, GlobalMessage } from './types';
import { IconSpinner, IconCheck, IconRefreshCcw, IconUpload } from './film-roll-queue';
import { PhotoLightbox } from '@/app/_components/photo-lightbox';

interface FilmRollReviewProps {
  frames: FilmFrame[];
  developmentState: 'idle' | 'review' | 'developing' | 'processed';
  isUploading: boolean;
  globalMessage: GlobalMessage;
  retakeJustCompleted: number | null;
  onRetake: (index: number) => void;
  onUploadBatch: () => void;
  onDevelop: () => void;
  theme?: string;
}

export function FilmRollReview({
  frames,
  developmentState,
  isUploading,
  globalMessage,
  retakeJustCompleted,
  onRetake,
  onUploadBatch,
  onDevelop,
  theme,
}: FilmRollReviewProps) {
  const { t } = useT();

  const isProcessed = developmentState === 'processed';

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const openModal = useCallback((i: number) => setSelectedIndex(i), []);
  const closeModal = useCallback(() => setSelectedIndex(null), []);
  const goPrev = useCallback(() => setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(() => setSelectedIndex(i => (i !== null && i < frames.length - 1 ? i + 1 : i)), [frames.length]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl text-[var(--text-primary)]">{t.filmRoll.reviewTitle}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t.filmRoll.reviewSubtitle(frames.length)}</p>
      </div>

      {globalMessage && (
        <div className="rounded-xl border px-4 py-3 text-sm border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] ac-toast-enter">
          {globalMessage.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            role="button"
            tabIndex={0}
            className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[var(--bg-tertiary)] block focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-left ${
              isProcessed ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={() => setSelectedIndex(index)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedIndex(index); }}
          >
            {isProcessed ? (
              frame.processedUrl ? (
                /* Show the already-rendered processed blob directly — this is the exact
                   same pixel data that was uploaded. No re-rendering, no original flash. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={frame.processedUrl}
                  alt={`Frame ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                /* processedUrl not yet available — render is still in progress.
                   Show original at low opacity with a shimmer overlay. */
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.previewUrl}
                    alt={`Frame ${index + 1}`}
                    className="h-full w-full object-cover opacity-40 blur-sm"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconSpinner className="h-6 w-6 animate-spin text-white" />
                  </div>
                </>
              )
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={frame.previewUrl} alt={`Frame ${index + 1}`} className="h-full w-full object-cover" />
            )}
            
            {/* Retake ✓ animation if just retaken */}
            {retakeJustCompleted === index && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 ac-toast-enter z-20 pointer-events-none">
                <div className="bg-[var(--theme-primary)] rounded-full p-2">
                  <IconCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            )}

            {/* Status overlays */}
            {frame.status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                <IconSpinner className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            {frame.status === 'done' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                <IconCheck className="h-7 w-7 text-white" />
              </div>
            )}
            {frame.status === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <span className="text-xs font-semibold text-white">{t.upload.statusFailed}</span>
              </div>
            )}

            {/* Retake Button (only if not uploading/done and not processed) */}
            {(frame.status === 'queued' || frame.status === 'error') && !isUploading && !isProcessed && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRetake(index); }}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:opacity-80 active:scale-95"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 70%, transparent)' }}
                aria-label={t.filmRoll.retakeFrame(index + 1)}
              >
                <IconRefreshCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2">
        {isProcessed ? (
          <button
            type="button"
            onClick={onUploadBatch}
            disabled={isUploading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isUploading ? (
              <><IconSpinner className="h-4 w-4 animate-spin" /> {t.filmRoll.sharingRoll}</>
            ) : (
              <><IconUpload className="h-4 w-4" /> {t.filmRoll.shareRoll}</>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onDevelop}
            disabled={isUploading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {t.filmProcessing.developMyFilm}
          </button>
        )}
      </div>

      {selectedIndex !== null && frames[selectedIndex] && (
        <PhotoLightbox
          photoId={frames[selectedIndex].id}
          photoUrl={frames[selectedIndex].processedUrl || frames[selectedIndex].previewUrl}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < frames.length - 1}
          eventName="Roll Review"
          photoNumber={selectedIndex + 1}
          filmRecipe={null}
          theme={theme}
          onRetake={
            (frames[selectedIndex].status === 'queued' || frames[selectedIndex].status === 'error') && !isUploading && !isProcessed
            ? () => { onRetake(selectedIndex); closeModal(); }
            : undefined
          }
        />
      )}
    </div>
  );
}

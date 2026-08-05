'use client';

import { useT } from '@/lib/i18n/use-t';
import { useFilmRoll } from './film-roll/hooks/use-film-roll';
import { FilmRollQueue } from './film-roll/film-roll-queue';
import { FilmRollReview } from './film-roll/film-roll-review';
import { FilmRecipe } from '@/lib/film/types';
import { FilmRenderer } from '@/lib/film/FilmRenderer';
import { FilmProcessing } from './film-roll/film-processing';
import { IconCamera } from './film-roll/film-roll-queue';
import { useCallback, useState, useEffect } from 'react';

export interface UploadFormProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  onUploadComplete: () => void;
  /** Full recipe metadata (id, name, settings). Only `settings` is forwarded to rendering logic. */
  filmRecipe?: FilmRecipe | null;
  coverImageUrl?: string;
  theme?: string;
}

export function UploadForm(props: UploadFormProps) {
  const { t } = useT();
  const filmRoll = useFilmRoll({
    ...props,
    filmRecipe: props.filmRecipe?.settings ?? null,
  });
  const [isLabOpen, setIsLabOpen] = useState(false);

  // Called when the guest taps "Develop My Film".
  // Kicks off rendering all frames concurrently in the background so that
  // by the time FilmProcessing animation completes the processed blobs are
  // ready and written back into each frame's processedUrl field.
  const handleDevelop = useCallback(() => {
    filmRoll.setDevelopmentState('developing');
    if (props.filmRecipe?.settings) {
      filmRoll.frames.forEach(frame => {
        // Skip frames that are already processed from a previous develop action
        if (!frame.processedUrl) {
          FilmRenderer.render(frame.id, frame.previewUrl, props.filmRecipe!.settings)
            .catch(() => {
              // silently ignore — the upload phase will retry and surface the error
            });
        }
      });
    }
  }, [filmRoll, props.filmRecipe]);

  const handleOpenLab = useCallback(() => setIsLabOpen(true), []);
  const handleCloseLab = useCallback(() => setIsLabOpen(false), []);

  const percent = Math.min(100, Math.max(0, ((props.photosUsed + filmRoll.activeFrames) / props.photosPerGuest) * 100));
  const frames = filmRoll.unlimited ? filmRoll.unlimitedQueue : filmRoll.frames;

  // Prevent background scrolling when Lab is open
  useEffect(() => {
    if (isLabOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLabOpen]);

  return (
    <>
      {/* ── Landing View CTAs ── */}
      <div className="w-full flex flex-col items-center gap-4 mt-2">
        <button
          type="button"
          onClick={() => filmRoll.cameraInputRef.current?.click()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
        >
          <IconCamera className="h-5 w-5" />
          {t.filmRoll.takePhoto}
        </button>
        <button
          type="button"
          onClick={handleOpenLab}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.97]"
        >
          {filmRoll.isRollComplete 
            ? t.filmRoll.viewFilmRoll 
            : filmRoll.activeFrames === 0 
              ? t.filmRoll.goToFilmLab 
              : t.filmRoll.continueToFilmLab}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* ── Film Lab Overlay ── */}
      {isLabOpen && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] overflow-y-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 pb-4 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--bg-tertiary)] pt-[calc(max(env(safe-area-inset-top),16px))]">
            <button onClick={handleCloseLab} className="flex items-center gap-1.5 -ml-2 p-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative z-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t.filmRoll.captureMore}
            </button>
          </div>
          
          <div className="px-5 py-8 pb-32 min-h-full">
            <div className="mb-6 flex flex-col items-center text-center">
              <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
                Film Lab
              </h1>
              {props.filmRecipe && (
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  {props.filmRecipe.name}
                </p>
              )}
            </div>
            {filmRoll.developmentState === 'developing' ? (
              <FilmProcessing
                onComplete={() => filmRoll.setDevelopmentState('processed')}
                coverImageUrl={props.coverImageUrl}
                theme={props.theme}
                filmRecipeName={props.filmRecipe?.name}
              />
            ) : filmRoll.developmentState === 'review' || filmRoll.developmentState === 'processed' ? (
              <FilmRollReview
                frames={filmRoll.frames}
                developmentState={filmRoll.developmentState}
                isUploading={filmRoll.isUploading}
                globalMessage={filmRoll.globalMessage}
                retakeJustCompleted={filmRoll.retakeJustCompleted}
                onRetake={filmRoll.triggerRetake}
                onUploadBatch={() => filmRoll.handleUploadBatch(false)}
                onDevelop={handleDevelop}
                theme={props.theme}
              />
            ) : (
              <FilmRollQueue
                frames={frames}
                isUnlimited={filmRoll.unlimited}
                isRollComplete={filmRoll.isRollComplete}
                remainingSlots={filmRoll.remainingSlots}
                percent={percent}
                isUploading={filmRoll.isUploading}
                globalMessage={filmRoll.globalMessage}
                onRemoveShot={filmRoll.unlimited ? filmRoll.removeUnlimitedShot : filmRoll.removeShot}
                onUploadBatch={() => filmRoll.handleUploadBatch(true)}
                onDevelop={handleDevelop}
                onCameraClick={() => filmRoll.cameraInputRef.current?.click()}
                onGalleryClick={() => filmRoll.galleryInputRef.current?.click()}
                theme={props.theme}
              />
            )}
          </div>
        </div>
      )}

      {/* Hidden Inputs for Native File Access */}
      <input
        ref={filmRoll.cameraInputRef}
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={filmRoll.handleNativeCapture}
      />
      <input
        ref={filmRoll.galleryInputRef}
        id="gallery-input"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={filmRoll.handleGalleryImport}
      />

      {/* Capture Toast */}
      {filmRoll.captureToast.show && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[110] pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-[var(--bg-primary)] border border-[var(--bg-tertiary)] rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--theme-primary)]/10">
              <IconCamera className="h-5 w-5 text-[var(--theme-primary)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{t.filmRoll.momentCaptured}</p>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                {filmRoll.captureToast.remaining === 0 ? t.filmRoll.rollFullSubtitle : t.filmRoll.framesRemaining(filmRoll.captureToast.remaining)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

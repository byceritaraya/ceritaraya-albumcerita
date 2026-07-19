'use client';

import { useT } from '@/lib/i18n/use-t';
import { useFilmRoll } from './film-roll/hooks/use-film-roll';
import { UnlimitedQueue } from './film-roll/unlimited-queue';
import { FilmRollDashboard } from './film-roll/film-roll-dashboard';
import { FilmRollReview } from './film-roll/film-roll-review';
import { FilmRecipeSettings } from '@/lib/film/types';
import { FilmRenderer } from '@/lib/film/FilmRenderer';
import { FilmProcessing } from './film-roll/film-processing';
import { IconCamera } from './film-roll/unlimited-queue';

export interface UploadFormProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  onUploadComplete: () => void;
  filmRecipe?: FilmRecipeSettings | null;
  coverImageUrl?: string;
  theme?: string;
}

export function UploadForm(props: UploadFormProps) {
  const { t } = useT();
  const filmRoll = useFilmRoll(props);

  return (
    <>
      <div className="w-full">
        {filmRoll.unlimited ? (
          <UnlimitedQueue
            unlimitedQueue={filmRoll.unlimitedQueue}
            isUploading={filmRoll.isUploading}
            globalMessage={filmRoll.globalMessage}
            onRemoveShot={filmRoll.removeUnlimitedShot}
            onUploadBatch={() => filmRoll.handleUploadBatch(true)}
            onCameraClick={() => filmRoll.cameraInputRef.current?.click()}
            onGalleryClick={() => filmRoll.galleryInputRef.current?.click()}
            filmRecipe={props.filmRecipe}
          />
        ) : filmRoll.developmentState === 'developing' ? (
          <FilmProcessing
            onComplete={() => filmRoll.setDevelopmentState('processed')}
            coverImageUrl={props.coverImageUrl}
            theme={props.theme}
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
            onDevelop={() => {
              // Start rendering immediately — in parallel with the animation.
              // When FilmProcessing completes and FilmRollReview mounts,
              // FilmImage will find the results already in cache.
              if (props.filmRecipe) {
                filmRoll.frames.forEach(f =>
                  FilmRenderer.preload(f.id, f.previewUrl, props.filmRecipe!)
                );
              }
              filmRoll.setDevelopmentState('developing');
            }}
            filmRecipe={props.filmRecipe}
          />
        ) : (
          <FilmRollDashboard
            globalMessage={filmRoll.globalMessage}
            isRollComplete={filmRoll.isRollComplete}
            remainingSlots={filmRoll.remainingSlots}
            percent={Math.min(100, Math.max(0, ((props.photosUsed + filmRoll.activeFrames) / props.photosPerGuest) * 100))}
            onCameraClick={() => filmRoll.cameraInputRef.current?.click()}
            onGalleryClick={() => filmRoll.galleryInputRef.current?.click()}
            onReviewClick={() => filmRoll.setDevelopmentState('review')}
          />
        )}
      </div>

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
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-50 pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-300">
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

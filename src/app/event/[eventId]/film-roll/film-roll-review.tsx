import { useT } from '@/lib/i18n/use-t';
import { FilmFrame, GlobalMessage } from './types';
import { IconFilmRoll, IconSpinner, IconCheck, IconRefreshCcw, IconUpload } from './unlimited-queue';

interface FilmRollReviewProps {
  frames: FilmFrame[];
  isUploading: boolean;
  globalMessage: GlobalMessage;
  retakeJustCompleted: number | null;
  onRetake: (index: number) => void;
  onUploadBatch: () => void;
}

export function FilmRollReview({
  frames,
  isUploading,
  globalMessage,
  retakeJustCompleted,
  onRetake,
  onUploadBatch,
}: FilmRollReviewProps) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-[var(--text-primary)]">{t.filmRoll.reviewTitle}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t.filmRoll.reviewSubtitle(frames.length)}</p>
        </div>
        <IconFilmRoll className="h-8 w-8 text-[var(--theme-primary)] opacity-20" />
      </div>

      {globalMessage && (
        <div className="rounded-xl border px-4 py-3 text-sm border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] ac-toast-enter">
          {globalMessage.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {frames.map((frame, index) => (
          <div key={frame.id} className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame.previewUrl} alt={`Frame ${index + 1}`} className="h-full w-full object-cover" />
            
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

            {/* Retake Button (only if not uploading/done) */}
            {(frame.status === 'queued' || frame.status === 'error') && !isUploading && (
              <button
                type="button"
                onClick={() => onRetake(index)}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition hover:bg-black/50 active:scale-95"
                aria-label={t.filmRoll.retakeFrame(index + 1)}
              >
                <IconRefreshCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2">
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
      </div>
    </div>
  );
}

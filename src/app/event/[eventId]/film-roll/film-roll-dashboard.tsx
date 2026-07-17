import { useT } from '@/lib/i18n/use-t';
import { GlobalMessage } from './types';
import { IconFilmRoll, IconCamera, IconGallery } from './unlimited-queue';

interface FilmRollDashboardProps {
  globalMessage: GlobalMessage;
  isRollComplete: boolean;
  remainingSlots: number;
  percent: number;
  onCameraClick: () => void;
  onGalleryClick: () => void;
  onReviewClick: () => void;
}

export function FilmRollDashboard({
  globalMessage,
  isRollComplete,
  remainingSlots,
  percent,
  onCameraClick,
  onGalleryClick,
  onReviewClick,
}: FilmRollDashboardProps) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-6">
      {globalMessage && (
        <div className="rounded-xl border px-4 py-3 text-sm border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] ac-toast-enter">
          {globalMessage.text}
        </div>
      )}

      {/* Film Roll Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/10 p-6 flex flex-col items-center text-center">
        <IconFilmRoll className="h-8 w-8 text-[var(--theme-primary)] mb-3" />
        
        <h3 className="font-heading text-2xl text-[var(--text-primary)] mb-1">
          {t.filmRoll.title}
        </h3>
        
        {isRollComplete ? (
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            {t.filmRoll.rollFullSubtitle}
          </p>
        ) : (
          <p className={`text-sm font-medium ${remainingSlots === 1 ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'}`}>
            {remainingSlots === 1 ? t.filmRoll.lastFrame : t.filmRoll.framesRemaining(remainingSlots)}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-6 w-full max-w-[200px] h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--theme-primary)] transition-all duration-500 ease-out" 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {isRollComplete ? (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] rounded-full text-xs font-bold tracking-widest uppercase">
              {t.filmRoll.rollFull}
            </span>
          </div>
          <button
            type="button"
            onClick={onReviewClick}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.98]"
          >
            {t.filmRoll.viewFilmRoll}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCameraClick}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
          >
            <IconCamera className="h-4 w-4" />
            {t.filmRoll.takePhoto}
          </button>
          <button
            type="button"
            onClick={onGalleryClick}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-6 text-sm font-semibold text-[var(--theme-primary)] transition-all hover:bg-[var(--bg-secondary)] active:scale-[0.97]"
          >
            <IconGallery className="h-4 w-4 text-[var(--theme-primary)]" />
            {t.filmRoll.fromGallery}
          </button>
        </div>
      )}
    </div>
  );
}

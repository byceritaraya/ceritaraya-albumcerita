'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/use-t';

interface SplashScreenProps {
  /** Event theme class (e.g. 'theme-sage'). Defaults to 'theme-sage'. */
  themeClass?: string;
  /** Called when the splash finishes and should be dismissed. */
  onDone: () => void;
  /** Minimum display duration in ms. Default 700ms. */
  minDuration?: number;
}

/**
 * Branded splash screen shown once per session when first entering AlbumCerita.
 * Respects the event theme. Fades out smoothly after minDuration.
 */
export function SplashScreen({ themeClass = 'theme-sage', onDone, minDuration = 700 }: SplashScreenProps) {
  const { t } = useT();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      // Allow fade-out animation to complete before removing
      const exitTimer = setTimeout(onDone, 400);
      return () => clearTimeout(exitTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-primary)] ${themeClass} transition-opacity duration-400 ease-in-out ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, var(--theme-primary), transparent)',
        }}
      />

      {/* Branding */}
      <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo mark */}
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[var(--theme-primary)]/10 backdrop-blur-sm border border-[var(--theme-primary)]/20 shadow-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 text-[var(--theme-primary)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-heading text-2xl text-[var(--text-primary)] tracking-tight">
            AlbumCerita
          </h1>
          <p className="text-xs text-[var(--text-muted)]">{t.brand.tagline}</p>
        </div>

        {/* Tagline */}
        <p className="mt-2 text-sm text-[var(--text-secondary)] italic">
          {t.splash.tagline}
        </p>
      </div>

      {/* Subtle loading indicator */}
      <div className="absolute bottom-12 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-[var(--theme-primary)]/40 animate-pulse" />
        <span className="h-1 w-1 rounded-full bg-[var(--theme-primary)]/60 animate-pulse [animation-delay:150ms]" />
        <span className="h-1 w-1 rounded-full bg-[var(--theme-primary)]/40 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}

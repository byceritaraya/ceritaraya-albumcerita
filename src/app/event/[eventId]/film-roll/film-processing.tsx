'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/use-t';

export interface FilmProcessingProps {
  onComplete: () => void;
  coverImageUrl?: string;
  theme?: string;
}

const APPROVED_THEMES = ['sage', 'blush', 'slate', 'onyx', 'mauve', 'ivory'];

export function FilmProcessing({ onComplete, coverImageUrl, theme }: FilmProcessingProps) {
  const { t } = useT();
  const [step, setStep] = useState(0);

  const steps = [
    t.filmProcessing.preparing,
    t.filmProcessing.developing,
    t.filmProcessing.applying,
    t.filmProcessing.finalizing,
    t.filmProcessing.ready,
  ];

  useEffect(() => {
    const intervalTime = 800;

    if (step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(s => s + 1);
      }, intervalTime);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, onComplete]);

  const progressPct = Math.max(10, ((step + 1) / steps.length) * 100);

  const safeThemeName = theme && APPROVED_THEMES.includes(theme.toLowerCase()) ? theme.toLowerCase() : 'sage';
  const themeClass = `theme-${safeThemeName}`;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ac-modal-enter ${themeClass}`}>

      {/* ── Blurred cover photo background ──────────────────────────────── */}
      {coverImageUrl ? (
        <>
          {/* The blurred background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover scale-110"
            style={{ filter: 'blur(24px)', transform: 'scale(1.15)' }}
          />
          {/* Theme background overlay for readability (light mode) */}
          <div
            className="absolute inset-0 bg-[var(--bg-primary)]/85 backdrop-blur-sm"
          />
        </>
      ) : (
        /* Fallback: rich gradient using theme colours */
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)]"
        />
      )}

      {/* ── Content (above the overlays) ─────────────────────────────────── */}
      <div className="relative flex flex-col items-center">

        {/* Animated spinner ring */}
        <div className="relative flex h-24 w-24 items-center justify-center mb-8">
          {/* Track */}
          <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-tertiary)]" />
          {/* Progress arc — theme accent colour */}
          <div className="absolute inset-0 rounded-full border-4 border-[var(--theme-primary)] border-t-transparent animate-spin" />
          {/* Soft glow ring */}
          <div
            className="absolute inset-[-6px] rounded-full opacity-10 animate-pulse"
            style={{ boxShadow: '0 0 24px 8px var(--theme-primary)' }}
          />

          {/* Camera icon */}
          <svg
            className="h-9 w-9 text-[var(--text-primary)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.4}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </div>

        {/* Animated step text — slides up through steps */}
        <div className="h-10 relative overflow-hidden flex items-center justify-center w-72">
          {steps.map((text, idx) => (
            <div
              key={idx}
              className={`absolute w-full text-center font-heading text-xl md:text-2xl tracking-wide text-[var(--text-primary)] transition-all duration-500 ease-out ${
                idx === step
                  ? 'opacity-100 translate-y-0'
                  : idx < step
                    ? 'opacity-0 -translate-y-8'
                    : 'opacity-0 translate-y-8'
              }`}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Subtitle hint */}
        <p className="mt-3 text-sm text-[var(--text-muted)] tracking-wider font-light">
          AlbumCerita
        </p>

        {/* Progress bar — theme accent */}
        <div className="mt-8 h-[3px] w-52 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-[800ms] ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
            }}
          />
        </div>

        {/* Step dots */}
        <div className="mt-4 flex items-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === step ? '20px' : '6px',
                height: '6px',
                background: idx <= step ? 'var(--theme-primary)' : 'var(--bg-tertiary)',
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

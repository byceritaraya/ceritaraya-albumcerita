'use client';

import { useEffect, useState } from 'react';



export interface FilmProcessingProps {
  onComplete: () => void;
  coverImageUrl?: string;
  theme?: string;
  filmRecipeName?: string;
}

const APPROVED_THEMES = ['sage', 'blush', 'slate', 'onyx', 'mauve', 'ivory'];

export function FilmProcessing({ onComplete, coverImageUrl, theme, filmRecipeName }: FilmProcessingProps) {
  const [step, setStep] = useState(0);

  const steps = [
    'Preparing Negatives...',
    'Balancing Exposure...',
    filmRecipeName ? `Applying ${filmRecipeName}...` : 'Applying Film Recipe...',
    'Rendering Film Grain...',
    'Recovering Highlights...',
    'Final Touches...',
    'Almost Ready...',
  ];

  useEffect(() => {
    const intervalTime = 1200;

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

  const progressPct = Math.max(5, ((step + 1) / steps.length) * 100);

  const safeThemeName = theme && APPROVED_THEMES.includes(theme.toLowerCase()) ? theme.toLowerCase() : 'sage';
  const themeClass = `theme-${safeThemeName}`;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ac-modal-enter ${themeClass}`}>

      {/* ── Blurred cover photo background ──────────────────────────────── */}
      {coverImageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover scale-110"
            style={{ filter: 'blur(32px)', transform: 'scale(1.15)' }}
          />
          <div
            className="absolute inset-0 bg-[var(--bg-primary)]/85 backdrop-blur-md"
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)]"
        />
      )}

      {/* ── Content (above the overlays) ─────────────────────────────────── */}
      <div className="relative flex flex-col items-center w-full max-w-sm justify-between h-[45dvh]">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Animated step text */}
          <div className="h-20 relative overflow-hidden flex items-center justify-center w-full px-4 mb-8">
            {steps.map((text, idx) => (
              <div
                key={idx}
                className={`absolute w-full text-center font-heading text-xl md:text-2xl font-light tracking-wide text-[var(--text-primary)] transition-all duration-700 ease-in-out ${
                  idx === step
                    ? 'opacity-100 translate-y-0'
                    : idx < step
                      ? 'opacity-0 -translate-y-6'
                      : 'opacity-0 translate-y-6'
                }`}
              >
                {text}
              </div>
            ))}
          </div>

          {/* Static Typography */}
          <div className="flex flex-col items-center text-center space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-medium">
              Applying Film Recipe
            </p>
            <p className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">
              {filmRecipeName ?? 'Standard Processing'}
            </p>
          </div>
        </div>

        {/* Minimal Progress bar */}
        <div className="h-[2px] w-48 bg-[var(--text-primary)]/10 overflow-hidden rounded-full mt-auto">
          <div
            className="h-full rounded-full transition-all duration-[1200ms] ease-in-out"
            style={{
              width: `${progressPct}%`,
              background: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

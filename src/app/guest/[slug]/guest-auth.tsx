'use client';

import { useActionState, useState, useEffect, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { authenticateGuest } from './actions';
import { useT } from '@/lib/i18n/use-t';
import { SplashScreen } from '@/app/_components/splash-screen';
import { LangSwitcher } from '@/app/_components/lang-switcher';

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  const { t } = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:opacity-50 active:scale-[0.97]"
    >
      {pending ? t.guestAuth.pending : text}
    </button>
  );
}

export function GuestAuth({
  slug,
  initialStep = 'pin',
  eventName,
  hostName,
  theme,
  coverImageUrl,
}: {
  slug: string;
  initialStep?: 'pin' | 'name';
  eventName?: string;
  hostName?: string;
  theme?: string;
  coverImageUrl?: string;
}) {
  const { t } = useT();
  const searchParams = useSearchParams();
  const urlPin = searchParams.get('pin');

  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState<'pin' | 'name'>(urlPin ? 'name' : initialStep);
  const [pin, setPin] = useState(urlPin || '');
  const [state, formAction] = useActionState(authenticateGuest, {});

  if (state?.step === 'name' && step === 'pin') {
    setStep('name');
  }

  useEffect(() => {
    if (state?.error && state.error.includes('PIN')) {
      setStep('pin');
      setPin('');
    }
  }, [state?.error]);

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Onyx', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  return (
    <div className={`min-h-[100dvh] bg-[var(--bg-primary)] ${themeClass} relative flex flex-col`}>
      {/* Splash — only on first entry */}
      {showSplash && (
        <SplashScreen themeClass={themeClass} onDone={handleSplashDone} />
      )}

      {/* ── Cover Hero ── */}
      <div className="relative w-full h-[50dvh] shrink-0 pointer-events-none">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-50" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(var(--theme-bg-rgb),1) 100%)'
          }}
        />
      </div>

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LangSwitcher variant="dark" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-8 -mt-16">
        <div className="w-full max-w-sm mx-auto">
          {step === 'pin' ? (
            <div className="text-center space-y-3 mb-8">
              <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">
                {t.guestAuth.roleLabel}
              </p>
              <h1 className="font-heading text-3xl text-[var(--text-primary)] leading-tight text-balance text-center">
                {t.guestAuth.pinTitle(eventName || 'Event')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {t.guestAuth.pinSubtitle(hostName || 'the host')}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3 mb-8">
              <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">
                {t.guestAuth.roleLabel}
              </p>
              <h1 className="font-heading text-2xl text-[var(--text-primary)] text-center">
                {t.guestAuth.nameTitle}
              </h1>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-5" suppressHydrationWarning>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="step" value={step} />

            {state?.error && (
              <div className="rounded-xl bg-[var(--theme-primary)]/10 p-3 text-sm text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 ac-toast-enter">
                {state.error}
              </div>
            )}

            {step === 'pin' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pin" className="sr-only">{t.guestAuth.pinLabel}</label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-xl border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors"
                  placeholder={t.guestAuth.pinPlaceholder}
                  suppressHydrationWarning
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <input type="hidden" name="pin" value={pin} />
                <label htmlFor="display_name" className="sr-only">{t.guestAuth.nameLabel}</label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors"
                  placeholder={t.guestAuth.namePlaceholder}
                />
              </div>
            )}

            <SubmitButton text={step === 'pin' ? t.guestAuth.submitPin : t.guestAuth.submitName} />
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 mt-auto text-center">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
          {t.brand.name}<br />{t.brand.tagline}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useActionState, useState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticateHost } from './actions';
import { useT } from '@/lib/i18n/use-t';
import { SplashScreen } from '@/app/_components/splash-screen';
import { LangSwitcher } from '@/app/_components/lang-switcher';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--theme-secondary)] disabled:opacity-50 active:scale-[0.97]"
    >
      {pending ? t.hostAuth.pending : t.hostAuth.submit}
    </button>
  );
}

export function HostAuth({
  slug,
  hostName,
  theme,
  coverImageUrl,
}: {
  slug: string;
  hostName?: string;
  theme?: string;
  coverImageUrl?: string;
}) {
  const { t } = useT();
  const [state, formAction] = useActionState(authenticateHost, {});
  const [showSplash, setShowSplash] = useState(true);

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
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
          <div className="text-center space-y-3 mb-8">
            <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">
              {t.hostAuth.roleLabel}
            </p>
            <h1 className="font-heading text-3xl text-[var(--text-primary)] leading-tight text-balance">
              {t.hostAuth.title(hostName || 'Host')}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.hostAuth.subtitle}
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="slug" value={slug} />

            {state?.error && (
              <div className="rounded-xl bg-[var(--theme-primary)]/10 p-3 text-sm text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 ac-toast-enter">
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pin" className="sr-only">{t.hostAuth.pinLabel}</label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                className="w-full rounded-xl border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors"
                placeholder={t.hostAuth.pinPlaceholder}
              />
            </div>

            <SubmitButton />
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

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticateHost } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--theme-secondary)] disabled:opacity-50"
    >
      {pending ? 'Processing...' : 'Masuk ke Album'}
    </button>
  );
}

export function HostAuth({ slug, eventName, hostName, theme, coverImageUrl }: { slug: string, eventName?: string, hostName?: string, theme?: string, coverImageUrl?: string }) {
  const [state, formAction] = useActionState(authenticateHost, {});

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  return (
    <div className={`min-h-[100dvh] bg-[var(--bg-primary)] ${themeClass} relative flex flex-col`}>
      {/* Absolute Hero Background */}
      <div className="absolute top-0 inset-x-0 h-[60dvh] pointer-events-none">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-50" />
        )}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.20) 40%, rgba(var(--theme-bg-rgb),0.85) 80%, rgba(var(--theme-bg-rgb),1) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pt-[30dvh] pb-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center space-y-4 mb-8">
            <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">Host</p>
            <h1 className="font-heading text-3xl text-[var(--text-primary)] leading-tight">
              Selamat Datang,<br/>{hostName || 'Host'}!
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Masukkan Host PIN untuk<br/>mengelola album.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="slug" value={slug} />
            
            {state?.error && (
              <div className="rounded-lg bg-[var(--theme-primary)]/10 p-3 text-sm text-[var(--theme-primary)] border border-[var(--theme-primary)]/20">
                {state.error}
              </div>
            )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pin" className="sr-only">
              Event PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
              placeholder="••••••"
            />
          </div>

          <SubmitButton />
        </form>
      </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 mt-auto text-center">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
          AlbumCerita<br/>by Cerita Raya
        </p>
      </div>
    </div>
  );
}

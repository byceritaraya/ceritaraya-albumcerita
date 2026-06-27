'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { authenticateGuest } from './actions';

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--theme-secondary)] disabled:opacity-50"
    >
      {pending ? 'Processing...' : text}
    </button>
  );
}

export function GuestAuth({ slug, initialStep = 'pin', eventName, hostName, theme, coverImageUrl }: { slug: string, initialStep?: 'pin' | 'name', eventName?: string, hostName?: string, theme?: string, coverImageUrl?: string }) {
  const searchParams = useSearchParams();
  const urlPin = searchParams.get('pin');

  const [step, setStep] = useState<'pin' | 'name'>(urlPin ? 'name' : initialStep);
  const [pin, setPin] = useState(urlPin || '');
  const [state, formAction] = useActionState(authenticateGuest, {});

  // If the server action returns a success for PIN, we move to name step
  if (state?.step === 'name' && step === 'pin') {
    setStep('name');
  }

  // If there's a state error (e.g. wrong PIN from URL), we might want to drop back to PIN step
  useEffect(() => {
    if (state?.error && state.error.includes('PIN')) {
      setStep('pin');
      setPin('');
    }
  }, [state?.error]);

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
          {step === 'pin' ? (
            <div className="text-center space-y-4 mb-8">
              <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">Guest</p>
              <h1 className="font-heading text-3xl text-[var(--text-primary)] leading-tight">{eventName || 'Event'}</h1>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Kamu diundang oleh {hostName || 'Host'}<br/>
                untuk menjadi salah satu moment taker.<br/><br/>
                Masukkan Event PIN untuk memulai.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 mb-8">
              <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase drop-shadow-md">Guest</p>
              <h1 className="font-heading text-2xl text-[var(--text-primary)]">Siapa nama kamu?</h1>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="step" value={step} />
            
            {state?.error && (
              <div className="rounded-lg bg-[var(--theme-primary)]/10 p-3 text-sm text-[var(--theme-primary)] border border-[var(--theme-primary)]/20">
                {state.error}
              </div>
            )}

          {step === 'pin' ? (
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
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                placeholder="••••••"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <input type="hidden" name="pin" value={pin} />
              <label htmlFor="display_name" className="sr-only">
                Your Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-white/60 backdrop-blur-sm px-4 py-3 text-center text-lg text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                placeholder="Nama Kamu"
              />
            </div>
          )}

          <SubmitButton text={step === 'pin' ? 'Accept Invitation' : 'Capture Their Moments'} />
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

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

export function GuestAuth({ slug, initialStep = 'pin' }: { slug: string, initialStep?: 'pin' | 'name' }) {
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

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-[var(--text-primary)]">Join Event</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {step === 'pin' 
              ? 'Enter the event PIN to join.' 
              : 'What should we call you?'}
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="step" value={step} />
          
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-100">
              {state.error}
            </div>
          )}

          {step === 'pin' ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pin" className="text-sm font-medium text-[var(--text-secondary)]">
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
                className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                placeholder="••••••"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <input type="hidden" name="pin" value={pin} />
              <label htmlFor="display_name" className="text-sm font-medium text-[var(--text-secondary)]">
                Your Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                required
                className="w-full rounded-lg border border-[var(--bg-tertiary)] bg-white px-4 py-3 text-center text-lg text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                placeholder="e.g. Budi"
              />
            </div>
          )}

          <SubmitButton text={step === 'pin' ? 'Next' : 'Join Event'} />
        </form>
      </div>
    </div>
  );
}

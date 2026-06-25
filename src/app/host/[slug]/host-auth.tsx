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
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? 'Verifying...' : 'Enter Dashboard'}
    </button>
  );
}

export function HostAuth({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(authenticateHost, {});

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-[var(--text-primary)]">Host Access</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Enter your Host PIN to view and curate your event&apos;s captured moments.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="slug" value={slug} />
          
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-100">
              {state.error}
            </div>
          )}

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
              className="w-full rounded-lg border border-[#EFE8DD] bg-white px-4 py-3 text-center text-lg tracking-[0.5em] text-[var(--text-primary)] shadow-sm focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
              placeholder="••••••"
            />
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

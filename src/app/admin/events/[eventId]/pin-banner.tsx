'use client';

import { useState } from 'react';
import { clearPinFlash } from './actions';

interface PinModalProps {
  eventId: string;
  pin: string;
  isReset?: boolean;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={`Copy ${value}`}
      className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M11.986 3H12a2 2 0 0 1 2 2v6a2 2 0 0 1-1.5 1.937V7A2.5 2.5 0 0 0 10 4.5H4.063A2 2 0 0 1 6 3h.014A2.25 2.25 0 0 1 8.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM10.5 4v-.175a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z"
              clipRule="evenodd"
            />
            <path d="M3 6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H3Z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

/**
 * Modal that displays the generated Event ID and PIN after event creation.
 *
 * Cookie is cleared ONLY when the admin explicitly dismisses the modal.
 * No auto-hide. No auto-clear on mount.
 *
 * Reused as-is by the future Reset PIN flow.
 */
export function PinBanner({ eventId, pin, isReset }: PinModalProps) {
  const [dismissed, setDismissed] = useState(false);

  async function handleDismiss() {
    await clearPinFlash();
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="pin-modal-title"
    >
      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        {/* Body */}
        <div className="px-8 pb-8 pt-8 text-center">
          {/* Success icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 text-white"
            >
              <path
                fillRule="evenodd"
                d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Title */}
          <h2
            id="pin-modal-title"
            className="text-lg font-bold text-gray-900"
          >
            {isReset ? 'PIN Reset Successfully' : 'Event Created Successfully'}
          </h2>

          {/* Subtitle */}
          <p className="mt-1.5 text-sm text-gray-500">
            Save the Event ID and PIN below.
            <br />
            You will not be able to see the PIN again.
          </p>

          {/* Credential cards */}
          <div className="mt-6 flex flex-col gap-3 text-left">
            {/* Event ID card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Event ID
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xl font-bold tracking-widest text-gray-900">
                  {eventId}
                </p>
                <CopyButton value={eventId} />
              </div>
            </div>

            {/* PIN card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                PIN
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xl font-bold tracking-widest text-gray-900">
                  {pin}
                </p>
                <CopyButton value={pin} />
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="mt-4 text-xs text-gray-400">
            Share the Event ID and PIN with your client securely.
            <br />
            Do not store or share the PIN publicly.
          </p>

          {/* Primary action */}
          <button
            id="confirm-pin-saved"
            onClick={handleDismiss}
            className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 active:bg-gray-800"
          >
            I&apos;ve Saved This Information
          </button>
        </div>
      </div>
    </div>
  );
}

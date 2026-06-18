'use client';

import { useState, useTransition } from 'react';
import { resetPinAction } from './actions';

export function ResetPinButton({ eventId, target = 'legacy' }: { eventId: string, target?: 'legacy' | 'host' | 'guest' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const labels = {
    legacy: 'Reset PIN',
    host: 'Reset Host PIN',
    guest: 'Reset Guest PIN',
  };

  const title = labels[target];

  function handleConfirm() {
    startTransition(async () => {
      await resetPinAction(eventId, target);
      setIsOpen(false);
    });
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={target === 'legacy' 
          ? "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          : "text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors ml-auto"
        }
      >
        {title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-left">
            <h2 id="reset-pin-modal-title" className="text-lg font-bold text-gray-900">{title}?</h2>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>The current PIN will stop working.</p>
              <p>Existing sessions and uploaded photos will not be affected.</p>
              <p>New {target === 'host' ? 'hosts' : target === 'guest' ? 'guests' : 'contributors'} must use the new PIN.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

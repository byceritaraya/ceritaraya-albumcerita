'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { joinEvent, type JoinEventState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {pending ? 'Joining…' : 'Join Event'}
    </button>
  );
}

const initialState: JoinEventState = {};

export default function JoinPage() {
  const [state, formAction] = useActionState(joinEvent, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Join Event
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your Event ID and PIN below
          </p>
        </div>
        
        <form action={formAction} className="mt-8 space-y-6">
          {state?.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="event_id" className="block text-sm font-medium text-gray-700">
                Event ID
              </label>
              <input
                id="event_id"
                name="event_id"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm uppercase"
                placeholder="e.g. A1B2C3D4"
              />
            </div>
            
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
                placeholder="6-digit PIN"
                maxLength={6}
              />
            </div>
          </div>

          <div>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { createEvent, type CreateEventState } from './actions';

// ── Submit button — reads pending state from the nearest form ────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      id="submit-create-event"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      {pending ? 'Creating event…' : 'Create Event'}
    </button>
  );
}

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors';

const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors';

// ── Page ──────────────────────────────────────────────────────────────────────
const initialState: CreateEventState = {};

export default function NewEventPage() {
  const [state, formAction] = useActionState(createEvent, initialState);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-gray-600 transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">New Event</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below. An Event ID, PIN, and slug will be generated automatically.
        </p>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Event Details
          </h2>
        </div>

        <form action={formAction} className="px-6 py-6 flex flex-col gap-5">
          {/* Error banner */}
          {state?.error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              <span className="font-medium">Error:</span> {state.error}
            </div>
          )}

          {/* Event Name */}
          <Field label="Event Name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Pernikahan Budi & Ani"
              className={inputClass}
            />
          </Field>

          {/* Event Type */}
          <Field label="Event Type" htmlFor="event_type">
            <select
              id="event_type"
              name="event_type"
              defaultValue="wedding"
              className={selectClass}
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </Field>

          {/* Retention Months */}
          <Field label="Retention" htmlFor="retention_months">
            <select
              id="retention_months"
              name="retention_months"
              defaultValue="3"
              className={selectClass}
            >
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </Field>

          {/* Max Contributors */}
          <Field label="Max Contributors" htmlFor="max_contributors">
            <select
              id="max_contributors"
              name="max_contributors"
              defaultValue="50"
              className={selectClass}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="9999">Unlimited</option>
            </select>
          </Field>

          {/* Photos Per Guest */}
          <Field label="Photos Per Guest" htmlFor="photos_per_guest">
            <select
              id="photos_per_guest"
              name="photos_per_guest"
              defaultValue="10"
              className={selectClass}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="36">36</option>
            </select>
          </Field>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-3">
            <SubmitButton />
            <Link
              href="/admin/events"
              className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

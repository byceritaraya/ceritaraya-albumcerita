'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { createEvent, type CreateEventState } from './actions';
import { useT } from '@/lib/i18n/use-t';
import { LangSwitcher } from '@/app/_components/lang-switcher';

const THEMES = ['Sage', 'Blush', 'Slate', 'Onyx', 'Mauve', 'Ivory'];

// ── Submit button — reads pending state from the nearest form ────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useT();
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
      {pending ? t.adminNewEvent.creatingBtn : t.adminNewEvent.createBtn}
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

// ── Form Component ──────────────────────────────────────────────────────────────────────
const initialState: CreateEventState = {};

export function NewEventForm({ availableRecipes }: { availableRecipes: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createEvent, initialState);
  const { t } = useT();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 relative">
      <div className="absolute top-6 right-6">
        <LangSwitcher className="!bg-gray-100 !border-gray-200 !text-gray-600 hover:!text-gray-900 !backdrop-blur-none" />
      </div>
      {/* Breadcrumb */}
      <nav className="mb-6 mt-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-gray-600 transition-colors">
          {t.adminEventDetail.eventsBreadcrumb}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t.adminNewEvent.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.adminNewEvent.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t.adminNewEvent.subtitle}
        </p>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t.adminNewEvent.eventDetails}
          </h2>
        </div>

        <form action={formAction} className="px-6 py-6 flex flex-col gap-5">
          {/* Error banner */}
          {state?.error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              <span className="font-medium">{t.adminNewEvent.error}</span> {state.error}
            </div>
          )}

          {/* Event Name */}
          <Field label={t.adminNewEvent.eventName} htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={t.adminNewEvent.eventNamePlaceholder}
              className={inputClass}
            />
          </Field>

          {/* Event Date — required for slug generation (ddMMyy suffix) */}
          <Field label={t.adminNewEvent.eventDate} htmlFor="event_date">
            <input
              id="event_date"
              name="event_date"
              type="date"
              required
              className={inputClass}
            />
            <p className="text-xs text-gray-400">
              {t.adminNewEvent.eventDateHelper}{' '}
              <span className="font-mono">budi-ari-wedding-250226</span>
            </p>
          </Field>

          {/* Host Name */}
          <Field label={t.adminNewEvent.hostName} htmlFor="host_name">
            <input
              id="host_name"
              name="host_name"
              type="text"
              placeholder={t.adminNewEvent.hostNamePlaceholder}
              className={inputClass}
            />
          </Field>

          {/* Event Type */}
          <Field label={t.adminNewEvent.eventType} htmlFor="event_type">
            <select
              id="event_type"
              name="event_type"
              defaultValue="wedding"
              className={selectClass}
            >
              <option value="wedding">{t.adminNewEvent.types.wedding}</option>
              <option value="birthday">{t.adminNewEvent.types.birthday}</option>
              <option value="corporate">{t.adminNewEvent.types.corporate}</option>
              <option value="other">{t.adminNewEvent.types.other}</option>
            </select>
          </Field>

          {/* Theme */}
          <Field label={t.adminNewEvent.theme} htmlFor="theme">
            <select
              id="theme"
              name="theme"
              defaultValue="Sage"
              className={selectClass}
            >
              <option value="Sage">Sage</option>
              <option value="Blush">Blush</option>
              <option value="Slate">Slate</option>
              <option value="Onyx">Onyx</option>
              <option value="Mauve">Mauve</option>
              <option value="Ivory">Ivory</option>
            </select>
          </Field>

          {/* Film Recipe */}
          <Field label="Film Recipe" htmlFor="film_recipe_id">
            <select
              id="film_recipe_id"
              name="film_recipe_id"
              required
              defaultValue={availableRecipes.find(r => r.name === 'AlbumCerita Signature')?.id || availableRecipes[0]?.id}
              className={selectClass}
            >
              {availableRecipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
          </Field>

          {/* Auto Publish At */}
          <Field label={t.adminEditEvent.autoPublishAt} htmlFor="auto_publish_at">
            <input
              id="auto_publish_at"
              name="auto_publish_at"
              type="datetime-local"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">
              {t.adminEditEvent.autoPublishHelper}
            </p>
          </Field>

          {/* Retention Months */}
          <Field label={t.adminNewEvent.retention} htmlFor="retention_months">
            <select
              id="retention_months"
              name="retention_months"
              defaultValue="3"
              className={selectClass}
            >
              <option value="1">{t.adminEditEvent.months(1)}</option>
              <option value="3">{t.adminEditEvent.months(3)}</option>
              <option value="6">{t.adminEditEvent.months(6)}</option>
              <option value="12">{t.adminEditEvent.months(12)}</option>
            </select>
          </Field>

          {/* Max Contributors */}
          <Field label={t.adminNewEvent.maxContributors} htmlFor="max_contributors">
            <select
              id="max_contributors"
              name="max_contributors"
              defaultValue="50"
              className={selectClass}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="9999">{t.adminEditEvent.unlimited}</option>
            </select>
          </Field>

          {/* Photos Per Guest */}
          <Field label={t.adminNewEvent.photosPerGuest} htmlFor="photos_per_guest">
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
              {t.adminNewEvent.cancel}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

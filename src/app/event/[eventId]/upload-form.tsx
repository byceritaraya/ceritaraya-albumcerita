'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadPhoto, type UploadPhotoState } from './actions';

// ─── Submit button (reused for both flows) ───────────────────────────────────
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? 'Uploading…' : label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface UploadFormProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
}

const initialState: UploadPhotoState = {};

// ─── Camera flow form (capture="environment") ─────────────────────────────────
function CameraForm({
  formAction,
  formRef,
}: {
  formAction: (payload: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  return (
    <form ref={formRef} action={formAction} className="contents">
      {/* Hidden file input that opens the rear camera */}
      <input
        id="camera-input"
        type="file"
        name="photo"
        accept="image/*"
        capture="environment"
        required
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            e.target.form?.requestSubmit();
          }
        }}
      />
      {/* Visible primary CTA — clicking it triggers the hidden input */}
      <label
        htmlFor="camera-input"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 active:scale-[0.98]"
      >
        {/* Camera icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
          <path
            fillRule="evenodd"
            d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
        Take Photo
      </label>
      {/* Hidden real submit button so requestSubmit() works */}
      <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
    </form>
  );
}

// ─── Gallery flow form (standard file picker) ─────────────────────────────────
function GalleryForm({
  formAction,
  formRef,
}: {
  formAction: (payload: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  return (
    <form ref={formRef} action={formAction} className="contents">
      <input
        id="gallery-input"
        type="file"
        name="photo"
        accept="image/*"
        required
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) {
            e.target.form?.requestSubmit();
          }
        }}
      />
      <label
        htmlFor="gallery-input"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
      >
        {/* Photo stack icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-500">
          <path
            fillRule="evenodd"
            d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
            clipRule="evenodd"
          />
        </svg>
        Upload From Gallery
      </label>
      <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function UploadForm({ eventId, photosUsed, photosPerGuest }: UploadFormProps) {
  const cameraFormRef = useRef<HTMLFormElement>(null);
  const galleryFormRef = useRef<HTMLFormElement>(null);

  const uploadAction = uploadPhoto.bind(null, eventId);
  const [state, formAction] = useActionState(uploadAction, initialState);

  // Clear both forms on success
  if (state.success) {
    cameraFormRef.current?.reset();
    galleryFormRef.current?.reset();
  }

  const quotaReached = photosUsed >= photosPerGuest;
  const quotaPercent = Math.min(100, Math.round((photosUsed / photosPerGuest) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Quota pill ── */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
          <span>Photos Used</span>
          <span className={quotaReached ? 'font-bold text-red-500' : 'font-bold text-gray-700'}>
            {photosUsed} / {photosPerGuest}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quotaReached ? 'bg-red-400' : quotaPercent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        {quotaReached && (
          <p className="mt-2 text-center text-xs text-red-500">
            You&apos;ve reached your photo limit for this event.
          </p>
        )}
      </div>

      {/* ── Status messages ── */}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      {/* ── Action buttons ── */}
      {!quotaReached && (
        <div className="flex flex-col gap-3">
          {/* Primary: Take Photo (camera) */}
          <CameraForm formAction={formAction} formRef={cameraFormRef} />

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Secondary: Upload from gallery */}
          <GalleryForm formAction={formAction} formRef={galleryFormRef} />
        </div>
      )}
    </div>
  );
}

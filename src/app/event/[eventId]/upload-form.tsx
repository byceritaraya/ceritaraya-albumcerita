'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadPhoto, type UploadPhotoState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      {pending ? 'Uploading…' : 'Upload'}
    </button>
  );
}

const initialState: UploadPhotoState = {};

export function UploadForm({ eventId }: { eventId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  
  // Bind eventId to the server action
  const uploadAction = uploadPhoto.bind(null, eventId);
  const [state, formAction] = useActionState(uploadAction, initialState);

  // If success, we can clear the form
  if (state.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <form ref={formRef} action={formAction} className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-white text-center transition-colors hover:border-gray-400">
      <div className="w-12 h-12 mb-4 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </div>
      
      {state.error && (
        <div className="mb-4 w-full rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
          {state.error}
        </div>
      )}
      
      {state.success && (
        <div className="mb-4 w-full rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
          {state.success}
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-900 mb-2">Upload Photo</h3>
      
      <input 
        type="file" 
        name="photo" 
        accept="image/*" 
        required 
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
      />
      
      <SubmitButton />
    </form>
  );
}

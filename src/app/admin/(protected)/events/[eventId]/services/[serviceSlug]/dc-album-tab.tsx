'use client';

import { useState, useTransition } from 'react';
import { useT } from '@/lib/i18n/use-t';
import { saveDcAlbumConfigAction } from './actions';
import { uploadCoverImageAction } from '../../actions';

const THEMES = ['Sage', 'Blush', 'Slate', 'Onyx', 'Mauve', 'Ivory'];

interface Props {
  eventId: string;
  initialValues: {
    theme: string;
    cover_image_url: string | null;
    raw_cover_image_url: string | null;
    auto_publish_at: string;
  };
}

export function DcAlbumTab({ eventId, initialValues }: Props) {
  const [values, setValues] = useState(initialValues);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialValues.cover_image_url);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useT();

  function handleChange(key: keyof typeof values, value: string | number) {
    setValues(v => ({ ...v, [key]: value }));
    setSaved(false);
    setError(null);
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setSaved(false);
      setError(null);
    }
  }

  function handleRemoveCover() {
    setCoverFile(null);
    setCoverPreview(null);
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      
      let coverUrl = initialValues.raw_cover_image_url;
      if (coverFile !== null) {
        // waiting for upload
      } else if (coverPreview === null) {
        coverUrl = null;
      }
      
      if (coverFile) {
        const formData = new FormData();
        formData.append('cover_image', coverFile);
        const uploadRes = await uploadCoverImageAction(eventId, formData);
        if (uploadRes.error) {
          setError(uploadRes.error);
          return;
        }
        if (uploadRes.url) {
          coverUrl = uploadRes.url;
        }
      }

      const result = await saveDcAlbumConfigAction(eventId, {
        theme: values.theme,
        auto_publish_at: values.auto_publish_at,
        cover_image_url: coverUrl,
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setCoverFile(null);
        setValues(v => ({ ...v, cover_image_url: coverUrl }));
      }
    });
  }

  return (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Album Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Configure how the album is displayed to guests.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            {t.adminEditEvent.saved}
          </div>
        )}

        {/* Cover Image */}
        <div className="flex flex-col gap-1.5">
          <label className="block text-xs font-medium text-gray-500">{t.adminEditEvent.coverImage}</label>
          {coverPreview ? (
            <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-2">
                <label className="cursor-pointer rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white">
                  {t.adminEditEvent.replace}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-red-600"
                >
                  {t.adminEditEvent.remove}
                </button>
              </div>
            </div>
          ) : (
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mb-2 h-6 w-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">{t.adminEditEvent.uploadCover}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Theme */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{t.adminEditEvent.theme}</label>
            <select
              value={values.theme}
              onChange={e => handleChange('theme', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
            >
              {THEMES.map(theme => <option key={theme} value={theme}>{theme}</option>)}
            </select>
          </div>

          {/* Auto Publish At */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{t.adminEditEvent.autoPublishAt}</label>
            <input
              type="datetime-local"
              value={values.auto_publish_at}
              onChange={e => handleChange('auto_publish_at', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                {t.adminEditEvent.saving}
              </>
            ) : t.adminEditEvent.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
}

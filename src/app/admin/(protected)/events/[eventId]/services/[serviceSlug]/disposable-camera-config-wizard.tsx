'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, ChevronRight, ChevronLeft,
  Film, Camera, Clock, Users, Image as ImageIcon,
  AlertCircle, CheckCircle2, CalendarDays, User, Type,
} from 'lucide-react';
import { saveDisposableCameraConfigAction } from './actions';
import { uploadCoverImageAction } from '../../actions';
import { useT } from '@/lib/i18n/use-t';

// ── Constants ─────────────────────────────────────────────────────────────────
const PHOTOS_OPTIONS = [5, 10, 20, 36];
const CONTRIBUTOR_OPTIONS = [20, 50, 100, 9999];
const RETENTION_OPTIONS = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];
const THEMES = ['Sage', 'Blush', 'Slate', 'Onyx', 'Mauve', 'Ivory'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FilmRecipe {
  id: string;
  name: string;
  active: boolean;
}

export interface DisposableCameraConfigWizardProps {
  eventId: string;
  initialValues: {
    name: string;
    host_name: string;
    event_date: string;
    photos_per_guest: number;
    max_contributors: number;
    retention_months: number;
    film_recipe_id: string;
    cover_image_url: string | null;
    resolved_cover_url: string | null;
    theme: string;
    is_published: boolean;
    auto_publish_at: string | null;
  };
  availableRecipes: FilmRecipe[];
}

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Event Info',    icon: CalendarDays },
  { id: 2, label: 'Camera Setup',  icon: Camera },
  { id: 3, label: 'Film Recipe',   icon: Film },
  { id: 4, label: 'Album & Cover', icon: ImageIcon },
  { id: 5, label: 'Review',        icon: CheckCircle2 },
];

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-1">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : isCurrent
                    ? 'bg-white border-gray-900 text-gray-900'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 mx-1.5 mb-5 transition-all duration-300 ${
                  currentStep > step.id ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input / field helpers ─────────────────────────────────────────────────────
const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors';

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
        selected
          ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

// ── Step 1: Event Information ─────────────────────────────────────────────────
function Step1EventInfo({
  name,
  hostName,
  eventDate,
  onChange,
}: {
  name: string;
  hostName: string;
  eventDate: string;
  onChange: (key: 'name' | 'host_name' | 'event_date', value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Event Information</h2>
        <p className="text-sm text-gray-500 mt-1">Set the core details for this Disposable Camera event.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-2">
              <Type className="w-4 h-4 text-gray-400" />
              Event Name
            </span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. David & Valerie Wedding"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Host Name
            </span>
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => onChange('host_name', e.target.value)}
            placeholder="e.g. David & Valerie"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-gray-400">Shown to guests and hosts as the event organiser.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              Event Date
            </span>
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => onChange('event_date', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Camera Setup ──────────────────────────────────────────────────────
function Step2CameraSetup({
  photosPerGuest,
  maxContributors,
  retentionMonths,
  onChange,
}: {
  photosPerGuest: number;
  maxContributors: number;
  retentionMonths: number;
  onChange: (key: 'photos_per_guest' | 'max_contributors' | 'retention_months', value: number) => void;
}) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Camera Setup</h2>
        <p className="text-sm text-gray-500 mt-1">Configure the capture limits for this event.</p>
      </div>

      <div className="space-y-5">
        {/* Photos per Guest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              Photos per Guest
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PHOTOS_OPTIONS.map((n) => (
              <OptionButton key={n} selected={photosPerGuest === n} onClick={() => onChange('photos_per_guest', n)}>
                {n}
              </OptionButton>
            ))}
          </div>
          {!PHOTOS_OPTIONS.includes(photosPerGuest) && (
            <p className="mt-2 text-xs text-gray-500">Current: <span className="font-semibold">{photosPerGuest}</span> (custom)</p>
          )}
          <p className="mt-2 text-xs text-gray-400">Maximum photos each guest can upload.</p>
        </div>

        {/* Max Contributors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Maximum Contributors
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CONTRIBUTOR_OPTIONS.map((n) => (
              <OptionButton key={n} selected={maxContributors === n} onClick={() => onChange('max_contributors', n)}>
                {n === 9999 ? 'Unlimited' : n}
              </OptionButton>
            ))}
          </div>
          {!CONTRIBUTOR_OPTIONS.includes(maxContributors) && (
            <p className="mt-2 text-xs text-gray-500">Current: <span className="font-semibold">{maxContributors}</span> (custom)</p>
          )}
          <p className="mt-2 text-xs text-gray-400">Maximum guests who can contribute photos.</p>
        </div>

        {/* Retention Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Retention Period
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {RETENTION_OPTIONS.map(({ value, label }) => (
              <OptionButton key={value} selected={retentionMonths === value} onClick={() => onChange('retention_months', value)}>
                {label}
              </OptionButton>
            ))}
          </div>
          {!RETENTION_OPTIONS.find((r) => r.value === retentionMonths) && (
            <p className="mt-2 text-xs text-gray-500">Current: <span className="font-semibold">{retentionMonths} month{retentionMonths !== 1 ? 's' : ''}</span> (custom)</p>
          )}
          <p className="mt-2 text-xs text-gray-400">How long photos are retained after the event ends.</p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Film Recipe ───────────────────────────────────────────────────────
function Step3FilmRecipe({
  recipes,
  selectedId,
  onSelect,
}: {
  recipes: FilmRecipe[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (recipes.length === 0) {
    return (
      <div className="space-y-7">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Film Recipe</h2>
          <p className="text-sm text-gray-500 mt-1">Choose the film style for this event.</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <Film className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No Film Recipes Available</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No active film recipes exist. Create at least one recipe before configuring an event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Film Recipe</h2>
        <p className="text-sm text-gray-500 mt-1">Choose the film style for this event. Exactly one recipe must be selected.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recipes.map((recipe) => {
          const isSelected = selectedId === recipe.id;
          return (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onSelect(recipe.id)}
              className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 group ${
                isSelected
                  ? 'border-gray-900 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-gray-900' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}
              >
                <Film className={`w-5 h-5 transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                  {recipe.name}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{recipe.id.split('-')[0]}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Album & Cover ─────────────────────────────────────────────────────
function Step4AlbumCover({
  coverPreview,
  theme,
  isPublished,
  autoPublishAt,
  onCoverChange,
  onCoverRemove,
  onThemeChange,
  onPublishedChange,
  onAutoPublishChange,
  t,
}: {
  coverPreview: string | null;
  theme: string;
  isPublished: boolean;
  autoPublishAt: string;
  onCoverChange: (file: File, preview: string) => void;
  onCoverRemove: () => void;
  onThemeChange: (theme: string) => void;
  onPublishedChange: (v: boolean) => void;
  onAutoPublishChange: (v: string) => void;
  t: ReturnType<typeof useT>['t'];
}) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onCoverChange(file, URL.createObjectURL(file));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Album & Cover Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the visual cover and publishing settings for the Disposable Camera experience.
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.adminEditEvent.coverImage}</label>
        {coverPreview ? (
          <div className="relative h-44 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-2">
              <label className="cursor-pointer rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white">
                {t.adminEditEvent.replace}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <button
                type="button"
                onClick={onCoverRemove}
                className="rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-red-600"
              >
                {t.adminEditEvent.remove}
              </button>
            </div>
          </div>
        ) : (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100">
            <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">{t.adminEditEvent.uploadCover}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          Used as the hero/cover image for the guest experience, host view, and public album.
        </p>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.adminEditEvent.theme}</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {THEMES.map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => onThemeChange(th)}
              className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                theme === th
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {th}
            </button>
          ))}
        </div>
      </div>

      {/* Publish Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Album Visibility</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPublishedChange(true)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              isPublished
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => onPublishedChange(false)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              !isPublished
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            Unpublished
          </button>
        </div>
      </div>

      {/* Auto Publish */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.adminEditEvent.autoPublishAt}</label>
        <input
          type="datetime-local"
          value={autoPublishAt}
          onChange={(e) => onAutoPublishChange(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-gray-400">If set, the album will automatically publish at this time.</p>
      </div>
    </div>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────
function Step5Review({
  name,
  hostName,
  eventDate,
  photosPerGuest,
  maxContributors,
  retentionMonths,
  filmRecipeId,
  recipes,
  coverPreview,
  theme,
  isPublished,
  autoPublishAt,
}: {
  name: string;
  hostName: string;
  eventDate: string;
  photosPerGuest: number;
  maxContributors: number;
  retentionMonths: number;
  filmRecipeId: string;
  recipes: FilmRecipe[];
  coverPreview: string | null;
  theme: string;
  isPublished: boolean;
  autoPublishAt: string;
}) {
  const selectedRecipe = recipes.find((r) => r.id === filmRecipeId);
  const retentionLabel =
    RETENTION_OPTIONS.find((r) => r.value === retentionMonths)?.label ??
    `${retentionMonths} month${retentionMonths !== 1 ? 's' : ''}`;

  const sections = [
    {
      title: 'Event Information',
      icon: CalendarDays,
      rows: [
        { label: 'Event Name', value: name || '—' },
        { label: 'Host Name', value: hostName || '—' },
        { label: 'Event Date', value: eventDate || '—' },
      ],
    },
    {
      title: 'Camera Setup',
      icon: Camera,
      rows: [
        { label: 'Photos per Guest', value: `${photosPerGuest}` },
        { label: 'Max Contributors', value: maxContributors === 9999 ? 'Unlimited' : `${maxContributors}` },
        { label: 'Retention', value: retentionLabel },
      ],
    },
    {
      title: 'Film Recipe',
      icon: Film,
      rows: [
        { label: 'Selected Recipe', value: selectedRecipe?.name ?? '—' },
      ],
    },
    {
      title: 'Album & Cover',
      icon: ImageIcon,
      rows: [
        { label: 'Cover', value: coverPreview ? 'Image set' : 'No cover' },
        { label: 'Theme', value: theme },
        { label: 'Published', value: isPublished ? 'Yes' : 'No' },
        { label: 'Auto Publish', value: autoPublishAt || '—' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Review & Save</h2>
        <p className="text-sm text-gray-500 mt-1">Confirm all settings before saving.</p>
      </div>

      {sections.map(({ title, icon: Icon, rows }) => (
        <div key={title} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <Icon className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          </div>
          <dl className="divide-y divide-gray-100">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-semibold text-gray-900 max-w-[60%] text-right truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export function DisposableCameraConfigWizard({
  eventId,
  initialValues,
  availableRecipes,
}: DisposableCameraConfigWizardProps) {
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState(initialValues.name);
  const [hostName, setHostName] = useState(initialValues.host_name);
  const [eventDate, setEventDate] = useState(initialValues.event_date);

  const [photosPerGuest, setPhotosPerGuest] = useState(initialValues.photos_per_guest);
  const [maxContributors, setMaxContributors] = useState(initialValues.max_contributors);
  const [retentionMonths, setRetentionMonths] = useState(initialValues.retention_months);

  const [selectedRecipeId, setSelectedRecipeId] = useState(initialValues.film_recipe_id ?? '');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialValues.resolved_cover_url ?? null);
  const [rawCoverUrl, setRawCoverUrl] = useState<string | null>(initialValues.cover_image_url ?? null);
  const [theme, setTheme] = useState(initialValues.theme || 'Sage');
  const [isPublished, setIsPublished] = useState(initialValues.is_published ?? false);
  const [autoPublishAt, setAutoPublishAt] = useState(
    initialValues.auto_publish_at
      ? new Date(initialValues.auto_publish_at).toISOString().slice(0, 16)
      : ''
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleEventInfoChange(key: 'name' | 'host_name' | 'event_date', value: string) {
    if (key === 'name') setName(value);
    else if (key === 'host_name') setHostName(value);
    else setEventDate(value);
    setError(null);
  }

  function handleCameraChange(key: 'photos_per_guest' | 'max_contributors' | 'retention_months', value: number) {
    if (key === 'photos_per_guest') setPhotosPerGuest(value);
    else if (key === 'max_contributors') setMaxContributors(value);
    else setRetentionMonths(value);
    setError(null);
  }

  function handleCoverChange(file: File, preview: string) {
    setCoverFile(file);
    setCoverPreview(preview);
    setError(null);
  }

  function handleCoverRemove() {
    setCoverFile(null);
    setCoverPreview(null);
    setRawCoverUrl(null);
    setError(null);
  }

  // ── Step validation ───────────────────────────────────────────────────────
  function validateStep(s: number): string | null {
    if (s === 1 && !name.trim()) return 'Event name is required.';
    if (s === 3 && !selectedRecipeId) return 'Please select a Film Recipe before continuing.';
    return null;
  }

  function handleContinue() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, 5));
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    setError(null);
    startTransition(async () => {
      // Upload cover image if a new file was selected
      let finalCoverUrl = rawCoverUrl;
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover_image', coverFile);
        const uploadRes = await uploadCoverImageAction(eventId, fd);
        if (uploadRes.error) {
          setError(uploadRes.error);
          return;
        }
        if (uploadRes.url) finalCoverUrl = uploadRes.url;
      } else if (coverPreview === null) {
        finalCoverUrl = null;
      }

      const result = await saveDisposableCameraConfigAction(eventId, {
        name: name.trim(),
        host_name: hostName.trim(),
        event_date: eventDate,
        photos_per_guest: photosPerGuest,
        max_contributors: maxContributors,
        retention_months: retentionMonths,
        film_recipe_id: selectedRecipeId,
        cover_image_url: finalCoverUrl,
        theme,
        is_published: isPublished,
        auto_publish_at: autoPublishAt || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        router.push(`/admin/events/${eventId}/services/disposable-camera?tab=configuration`);
        router.refresh();
      }, 1500);
    });
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Configuration Saved</h3>
        <p className="text-sm text-gray-500">The Disposable Camera settings have been updated.</p>
        <p className="text-xs text-gray-400 mt-3">Refreshing…</p>
      </div>
    );
  }

  const isOnFilmStep = step === 3;
  const canProceed = isOnFilmStep ? selectedRecipeId.trim().length > 0 : true;

  return (
    <div>
      <StepIndicator currentStep={step} />

      <div className="min-h-[340px]">
        {step === 1 && (
          <Step1EventInfo
            name={name}
            hostName={hostName}
            eventDate={eventDate}
            onChange={handleEventInfoChange}
          />
        )}
        {step === 2 && (
          <Step2CameraSetup
            photosPerGuest={photosPerGuest}
            maxContributors={maxContributors}
            retentionMonths={retentionMonths}
            onChange={handleCameraChange}
          />
        )}
        {step === 3 && (
          <Step3FilmRecipe
            recipes={availableRecipes}
            selectedId={selectedRecipeId}
            onSelect={setSelectedRecipeId}
          />
        )}
        {step === 4 && (
          <Step4AlbumCover
            coverPreview={coverPreview}
            theme={theme}
            isPublished={isPublished}
            autoPublishAt={autoPublishAt}
            onCoverChange={handleCoverChange}
            onCoverRemove={handleCoverRemove}
            onThemeChange={setTheme}
            onPublishedChange={setIsPublished}
            onAutoPublishChange={setAutoPublishAt}
            t={t}
          />
        )}
        {step === 5 && (
          <Step5Review
            name={name}
            hostName={hostName}
            eventDate={eventDate}
            photosPerGuest={photosPerGuest}
            maxContributors={maxContributors}
            retentionMonths={retentionMonths}
            filmRecipeId={selectedRecipeId}
            recipes={availableRecipes}
            coverPreview={coverPreview}
            theme={theme}
            isPublished={isPublished}
            autoPublishAt={autoPublishAt}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleContinue}
            disabled={isOnFilmStep && !canProceed}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

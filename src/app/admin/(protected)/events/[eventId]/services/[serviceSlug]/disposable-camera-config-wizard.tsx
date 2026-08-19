'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, Film, Camera, Clock, Users, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { saveDisposableCameraConfigAction } from './actions';

// ── Constants (mirrors EditEventForm options) ─────────────────────────────────
const PHOTOS_OPTIONS = [5, 10, 20, 36];
const CONTRIBUTOR_OPTIONS = [20, 50, 100, 9999];
const RETENTION_OPTIONS = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FilmRecipe {
  id: string;
  name: string;
  active: boolean;
}

interface DisposableCameraConfigWizardProps {
  eventId: string;
  eventName: string;
  initialValues: {
    photos_per_guest: number;
    max_contributors: number;
    retention_months: number;
    film_recipe_id: string;
  };
  availableRecipes: FilmRecipe[];
}

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Camera Setup', icon: Camera },
  { id: 2, label: 'Film Recipe', icon: Film },
  { id: 3, label: 'Review', icon: CheckCircle2 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
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
                className={`mt-1.5 text-[11px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-16 mx-2 mb-5 transition-all duration-300 ${
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

// ── Step 1: Camera Setup ──────────────────────────────────────────────────────
interface CameraSetupValues {
  photos_per_guest: number;
  max_contributors: number;
  retention_months: number;
}

function Step1CameraSetup({
  values,
  onChange,
}: {
  values: CameraSetupValues;
  onChange: (key: keyof CameraSetupValues, value: number) => void;
}) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Camera Setup</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the capture limits for this event.
        </p>
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
              <button
                key={n}
                type="button"
                onClick={() => onChange('photos_per_guest', n)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                  values.photos_per_guest === n
                    ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {/* Allow custom value not in the preset list */}
          {!PHOTOS_OPTIONS.includes(values.photos_per_guest) && (
            <p className="mt-2 text-xs text-gray-500">
              Current value: <span className="font-semibold">{values.photos_per_guest}</span> (custom)
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">Maximum number of photos each guest can upload.</p>
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
              <button
                key={n}
                type="button"
                onClick={() => onChange('max_contributors', n)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                  values.max_contributors === n
                    ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {n === 9999 ? 'Unlimited' : n}
              </button>
            ))}
          </div>
          {!CONTRIBUTOR_OPTIONS.includes(values.max_contributors) && (
            <p className="mt-2 text-xs text-gray-500">
              Current value: <span className="font-semibold">{values.max_contributors}</span> (custom)
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">Maximum number of guests who can contribute photos.</p>
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
              <button
                key={value}
                type="button"
                onClick={() => onChange('retention_months', value)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                  values.retention_months === value
                    ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {!RETENTION_OPTIONS.find((r) => r.value === values.retention_months) && (
            <p className="mt-2 text-xs text-gray-500">
              Current value: <span className="font-semibold">{values.retention_months} month{values.retention_months !== 1 ? 's' : ''}</span> (custom)
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">How long photos are retained after the event ends.</p>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Film Recipe ───────────────────────────────────────────────────────
function Step2FilmRecipe({
  recipes,
  selectedId,
  onSelect,
}: {
  recipes: FilmRecipe[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const activeRecipes = recipes.filter((r) => r.active);

  if (activeRecipes.length === 0) {
    return (
      <div className="space-y-7">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Film Recipe</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose the film style for this event&apos;s disposable camera experience.
          </p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <Film className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No Film Recipes Available</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
            No active film recipes are available. Create at least one recipe before configuring an event.
          </p>
          <Link
            href="/admin/services/disposable-camera/film-recipes"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            <Film className="w-4 h-4" />
            Manage Film Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Film Recipe</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose the film style for this event. Exactly one recipe must be selected.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeRecipes.map((recipe) => {
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
              {/* Film icon */}
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-gray-900' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}
              >
                <Film
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? 'text-white' : 'text-gray-500'
                  }`}
                />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate transition-colors ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {recipe.name}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                  {recipe.id.split('-')[0]}
                </p>
              </div>

              {/* Checkmark */}
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        To manage or create film recipes, visit{' '}
        <Link
          href="/admin/services/disposable-camera/film-recipes"
          className="text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors"
        >
          Film Recipes
        </Link>
        .
      </p>
    </div>
  );
}

// ── Step 3: Review ────────────────────────────────────────────────────────────
function Step3Review({
  values,
  recipes,
}: {
  values: CameraSetupValues & { film_recipe_id: string };
  recipes: FilmRecipe[];
}) {
  const selectedRecipe = recipes.find((r) => r.id === values.film_recipe_id);
  const retentionLabel =
    RETENTION_OPTIONS.find((r) => r.value === values.retention_months)?.label ??
    `${values.retention_months} month${values.retention_months !== 1 ? 's' : ''}`;

  const rows = [
    {
      section: 'Camera Setup',
      icon: Camera,
      items: [
        { label: 'Photos per Guest', value: `${values.photos_per_guest} photo${values.photos_per_guest !== 1 ? 's' : ''}` },
        { label: 'Maximum Contributors', value: values.max_contributors === 9999 ? 'Unlimited' : `${values.max_contributors} guests` },
        { label: 'Retention Period', value: retentionLabel },
      ],
    },
    {
      section: 'Film Recipe',
      icon: Film,
      items: [
        { label: 'Selected Recipe', value: selectedRecipe?.name ?? '—' },
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Review Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Confirm the settings below before saving.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map(({ section, icon: Icon, items }) => (
          <div key={section} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <Icon className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section}</h3>
            </div>
            <dl className="divide-y divide-gray-100">
              {items.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export function DisposableCameraConfigWizard({
  eventId,
  eventName,
  initialValues,
  availableRecipes,
}: DisposableCameraConfigWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [cameraValues, setCameraValues] = useState<CameraSetupValues>({
    photos_per_guest: initialValues.photos_per_guest,
    max_contributors: initialValues.max_contributors,
    retention_months: initialValues.retention_months,
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialValues.film_recipe_id ?? ''
  );

  const activeRecipes = availableRecipes.filter((r) => r.active);
  const canProceedFromStep2 = selectedRecipeId.trim().length > 0;

  function handleCameraChange(key: keyof CameraSetupValues, value: number) {
    setCameraValues((v) => ({ ...v, [key]: value }));
  }

  function handleContinue() {
    setError(null);
    if (step === 2 && !canProceedFromStep2) {
      setError('Please select a Film Recipe before continuing.');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveDisposableCameraConfigAction(eventId, {
        ...cameraValues,
        film_recipe_id: selectedRecipeId,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      // Redirect back to event detail after a short pause
      setTimeout(() => {
        router.push(`/admin/events/${eventId}`);
      }, 1800);
    });
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Configuration Saved</h3>
        <p className="text-sm text-gray-500">
          The Disposable Camera settings for <strong>{eventName}</strong> have been updated.
        </p>
        <p className="text-xs text-gray-400 mt-3">Returning to event details…</p>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {/* Step content */}
      <div className="min-h-[340px]">
        {step === 1 && (
          <Step1CameraSetup values={cameraValues} onChange={handleCameraChange} />
        )}
        {step === 2 && (
          <Step2FilmRecipe
            recipes={availableRecipes}
            selectedId={selectedRecipeId}
            onSelect={setSelectedRecipeId}
          />
        )}
        {step === 3 && (
          <Step3Review
            values={{ ...cameraValues, film_recipe_id: selectedRecipeId }}
            recipes={availableRecipes}
          />
        )}
      </div>

      {/* Error message */}
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

        {step < 3 ? (
          <button
            type="button"
            onClick={handleContinue}
            disabled={step === 2 && activeRecipes.length === 0}
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

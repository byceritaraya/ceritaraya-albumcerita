'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Check, ChevronRight, Camera, Mail, Building } from 'lucide-react';
import { createEventAction, type CreateEventState } from '../events/actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface Client {
  id: string;
  client_code: string;
  name: string;
  status?: string;
}

export type EventWizardMode = "global" | "client";

export type SharedEventWizardProps = {
  mode: EventWizardMode;
  clients?: Client[];
  initialClient?: Client;
  services: Service[];
};

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number, steps: readonly string[] }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-gray-900 text-white'
                    : active
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? 'text-gray-900' : 'text-gray-400'
                } whitespace-nowrap`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 sm:w-16 h-px mx-2 mb-5 ${
                  done ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Service icon mapping ───────────────────────────────────────────────────────

function ServiceIcon({ slug }: { slug: string }) {
  if (slug === 'disposable-camera') return <Camera className="w-5 h-5" />;
  if (slug === 'wedding-invitation' || slug === 'web-invitation') return <Mail className="w-5 h-5" />;
  return <div className="w-5 h-5 rounded bg-gray-200" />;
}

// ── Input / field styles ──────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors';

const selectClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-colors';

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

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? 'Creating Event…' : 'Create Event'}
    </button>
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

const initialState: CreateEventState = {};

export function SharedEventWizard({ mode, clients = [], initialClient, services }: SharedEventWizardProps) {
  const [step, setStep] = useState(1);
  const steps = mode === 'global' ? ['Client', 'Event', 'Services', 'Review'] : ['Event', 'Services', 'Review'];

  // Global mode state
  const [selectedClientId, setSelectedClientId] = useState(initialClient?.id || '');

  // Event info state
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('wedding');

  // Services state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceError, setServiceError] = useState('');

  // Server action
  const [state, formAction] = useActionState(createEventAction, initialState);

  // Derived client
  const activeClient = mode === 'global' 
    ? clients.find(c => c.id === selectedClientId)
    : initialClient;

  // ── Step Transitions ──────────────────────────────────────────────────────
  
  function handleClientSelectContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) return;
    setStep(2);
  }

  function handleEventInfoContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) return;
    setStep(mode === 'global' ? 3 : 2);
  }

  function handleServicesContinue() {
    if (selectedServiceIds.length === 0) {
      setServiceError('Please select at least one service.');
      return;
    }
    setStep(mode === 'global' ? 4 : 3);
  }

  function toggleService(id: string) {
    setServiceError('');
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));

  function formatDate(iso: string) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }

  const eventTypeLabel: Record<string, string> = {
    wedding: 'Wedding',
    birthday: 'Birthday',
    corporate: 'Corporate',
    other: 'Other',
  };

  // Step indices mapping
  const clientStepIndex = mode === 'global' ? 1 : -1;
  const eventStepIndex = mode === 'global' ? 2 : 1;
  const servicesStepIndex = mode === 'global' ? 3 : 2;
  const reviewStepIndex = mode === 'global' ? 4 : 3;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto w-full">
      <StepIndicator current={step} steps={steps} />

      {/* ── STEP: CLIENT SELECTION (GLOBAL MODE ONLY) ──────────────────────────────── */}
      {mode === 'global' && step === clientStepIndex && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Select Client</h2>
            <p className="text-sm text-gray-500 mt-1">Choose the client that this event belongs to.</p>
          </div>
          
          <form onSubmit={handleClientSelectContinue} className="flex flex-col gap-5">
            <Field label="Client" htmlFor="client_id">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="client_id"
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className={`${selectClass} pl-10`}
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} disabled={c.status === 'inactive'}>
                      {c.name} ({c.client_code}) {c.status === 'inactive' ? '- Inactive' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                href="/admin/events"
                className="flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* ── STEP: EVENT INFORMATION ──────────────────────────────── */}
      {step === eventStepIndex && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Event Information</h2>
            <p className="text-sm text-gray-500 mt-1">Enter the core details for this event.</p>
          </div>

          {/* Client context */}
          {activeClient && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Creating Event For</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{activeClient.name}</p>
                <p className="text-xs font-mono text-gray-500">{activeClient.client_code}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEventInfoContinue} className="flex flex-col gap-5">
            <Field label="Event Name" htmlFor="name">
              <input
                id="name"
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. David & Valerie Wedding"
                className={inputClass}
                autoFocus
              />
            </Field>

            <Field label="Event Date" htmlFor="event_date">
              <input
                id="event_date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Event Type" htmlFor="event_type">
              <select
                id="event_type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className={selectClass}
              >
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'global') setStep(clientStepIndex);
                  else window.location.href = `/admin/clients/${activeClient?.id}`;
                }}
                className="flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {mode === 'global' ? 'Back' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── STEP: SERVICE SELECTION ──────────────────────────────── */}
      {step === servicesStepIndex && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Choose your services</h2>
            <p className="text-sm text-gray-500 mt-1">Select the experiences included in this event.</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {services.map((service) => {
              const selected = selectedServiceIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`flex items-start gap-4 w-full text-left px-4 py-4 rounded-xl border transition-all ${
                    selected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      selected
                        ? 'bg-gray-900 border-gray-900'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                      <ServiceIcon slug={service.slug} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {serviceError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serviceError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleServicesContinue}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStep(eventStepIndex)}
              className="flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: REVIEW ────────────────────────────────────────── */}
      {step === reviewStepIndex && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Review</h2>
            <p className="text-sm text-gray-500 mt-1">Confirm the event details before creating.</p>
          </div>

          {/* Review card */}
          <div className="rounded-xl border border-gray-200 bg-white mb-6 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {activeClient && (
                <ReviewRow label="Client">
                  <p className="text-sm text-gray-900 font-medium">{activeClient.name}</p>
                  <p className="text-xs font-mono text-gray-500">{activeClient.client_code}</p>
                </ReviewRow>
              )}
              <ReviewRow label="Event Name">
                <p className="text-sm text-gray-900">{eventName}</p>
              </ReviewRow>
              <ReviewRow label="Date">
                <p className="text-sm text-gray-900">{formatDate(eventDate)}</p>
              </ReviewRow>
              <ReviewRow label="Type">
                <p className="text-sm text-gray-900">{eventTypeLabel[eventType]}</p>
              </ReviewRow>
              <ReviewRow label="Services">
                <div className="flex flex-col gap-1.5">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm text-gray-900">
                      <Check className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      {s.name}
                    </div>
                  ))}
                </div>
              </ReviewRow>
            </div>
          </div>

          {/* Hidden form that holds all values for the server action */}
          <form action={formAction}>
            <input type="hidden" name="client_id" value={activeClient?.id || ''} />
            <input type="hidden" name="name" value={eventName} />
            <input type="hidden" name="event_date" value={eventDate} />
            <input type="hidden" name="event_type" value={eventType} />
            <input type="hidden" name="service_ids" value={JSON.stringify(selectedServiceIds)} />

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <span className="font-medium">Error: </span>{state.error}
              </div>
            )}

            <div className="flex gap-3">
              <SubmitButton />
              <button
                type="button"
                onClick={() => setStep(servicesStepIndex)}
                className="flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Review row helper ────────────────────────────────────────────────────────

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-4">
      <dt className="w-28 shrink-0 text-sm text-gray-500 font-medium">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}

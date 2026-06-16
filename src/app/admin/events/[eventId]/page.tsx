import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { decodePinFlash, PIN_FLASH_COOKIE } from '@/lib/pin-flash';
import { PinBanner } from './pin-banner';

type EventState = 'draft' | 'published' | 'expired' | 'archived';

interface Event {
  id: string;
  event_id: string;
  name: string;
  state: EventState;
  created_at: string;
  retention_months: number;
  max_contributors: number;
  photos_per_guest: number;
}

const STATE_STYLES: Record<EventState, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  published: 'bg-green-100 text-green-800 border border-green-200',
  expired: 'bg-red-100 text-red-800 border border-red-200',
  archived: 'bg-gray-100 text-gray-600 border border-gray-200',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-4 border-b border-gray-100 last:border-0">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  // Read one-time PIN flash cookie (set by createEvent / future resetPin).
  const cookieStore = await cookies();
  const flashRaw = cookieStore.get(PIN_FLASH_COOKIE)?.value;
  const flashPin = decodePinFlash(flashRaw, eventId);

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, event_id, name, state, created_at, retention_months, max_contributors, photos_per_guest'
    )
    .eq('event_id', eventId)
    .single();

  // Treat a "no rows" PostgREST error the same as not found
  if (error?.code === 'PGRST116' || (!error && !event)) {
    notFound();
  }

  // Surface unexpected errors
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      </div>
    );
  }

  const e = event as Event;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* One-time PIN banner — only rendered right after creation or PIN reset */}
      {flashPin && <PinBanner eventId={e.event_id} pin={flashPin} />}
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-gray-600 transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{e.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{e.name}</h1>
          <p className="mt-1 font-mono text-xs text-gray-400">{e.event_id}</p>
        </div>
        <span
          className={`ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATE_STYLES[e.state] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {e.state}
        </span>
      </div>

      {/* Detail card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Event Details
          </h2>
        </div>
        <dl className="px-6 divide-y divide-gray-100">
          <FieldRow label="Event Name" value={e.name} />
          <FieldRow
            label="Event ID"
            value={<span className="font-mono text-xs">{e.event_id}</span>}
          />
          <FieldRow
            label="State"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLES[e.state] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {e.state}
              </span>
            }
          />
          <FieldRow label="Created Date" value={formatDate(e.created_at)} />
          <FieldRow label="Retention" value={`${e.retention_months} month${e.retention_months !== 1 ? 's' : ''}`} />
          <FieldRow label="Max Contributors" value={e.max_contributors === 9999 ? 'Unlimited' : e.max_contributors} />
          <FieldRow label="Photos Per Guest" value={e.photos_per_guest} />
        </dl>
      </div>
    </div>
  );
}

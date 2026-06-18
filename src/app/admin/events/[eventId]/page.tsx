import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { decodePinFlash, PIN_FLASH_COOKIE } from '@/lib/pin-flash';
import { PinBanner } from './pin-banner';
import { AccessCard } from './access-cards';
import { EditEventForm } from './edit-event-form';

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
  host_slug?: string;
  guest_slug?: string;
  host_name?: string;
  theme?: string;
  cover_image_url?: string;
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

  // Build absolute base URL for QR codes
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Read one-time PIN flash cookie
  const cookieStore = await cookies();
  const flashRaw = cookieStore.get(PIN_FLASH_COOKIE)?.value;
  const flashData = decodePinFlash(flashRaw, eventId);

  const supabase = createServiceClient();

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, event_id, name, state, created_at, retention_months, max_contributors, photos_per_guest, host_slug, guest_slug, host_name, theme, cover_image_url'
    )
    .eq('event_id', eventId)
    .single();

  if (error?.code === 'PGRST116' || (!error && !event)) {
    notFound();
  }

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

  let finalCoverUrl = e.cover_image_url ?? null;
  if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
    const { data } = await supabase.storage.from('albumcerita_photos').createSignedUrl(finalCoverUrl, 3600);
    if (data) finalCoverUrl = data.signedUrl;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* One-time PIN banner — only rendered right after creation or legacy PIN reset */}
      {flashData && flashData.pin && (
        <PinBanner eventId={e.event_id} pin={flashData.pin} isReset={flashData.isReset} />
      )}
      
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
        <div className="ml-auto flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATE_STYLES[e.state] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {e.state}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Guest & Host Access Sections */}
        {(e.host_slug || e.guest_slug) && (
          <div className="space-y-4">
            {e.guest_slug && (
              <AccessCard 
                eventId={e.event_id}
                title="Guest Access" 
                type="guest"
                slug={e.guest_slug} 
                pin={flashData?.guestPin} 
                baseUrl={baseUrl} 
              />
            )}
            {e.host_slug && (
              <AccessCard 
                eventId={e.event_id}
                title="Host Access" 
                type="host"
                slug={e.host_slug} 
                pin={flashData?.hostPin} 
                baseUrl={baseUrl} 
              />
            )}
          </div>
        )}

        {/* Edit Event Form */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Event Configuration
            </h2>
          </div>
          <div className="px-6 py-4">
            <EditEventForm
              eventId={e.event_id}
              initialValues={{
                name: e.name,
                host_name: e.host_name ?? '',
                theme: e.theme ?? 'Sage',
                retention_months: e.retention_months,
                max_contributors: e.max_contributors,
                photos_per_guest: e.photos_per_guest,
                cover_image_url: finalCoverUrl,
              }}
            />
          </div>
        </div>

        {/* Read-only details */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Information</h2>
          </div>
          <dl className="px-6 divide-y divide-gray-100">
            <FieldRow label="Legacy Event ID" value={<span className="font-mono text-xs">{e.event_id}</span>} />
            <FieldRow
              label="State"
              value={
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLES[e.state] ?? 'bg-gray-100 text-gray-600'}`}>
                  {e.state}
                </span>
              }
            />
            <FieldRow label="Created" value={formatDate(e.created_at)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

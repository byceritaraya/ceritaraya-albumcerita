import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { decodePinFlash, PIN_FLASH_COOKIE } from '@/lib/pin-flash';
import { PinBanner } from './pin-banner';
import { AccessCard } from './access-cards';
import { EditEventForm } from './edit-event-form';
import { getT } from '@/lib/i18n/server';
import { LangSwitcher } from '@/app/_components/lang-switcher';
import { Settings } from 'lucide-react';

type EventState = 'draft' | 'published' | 'expired' | 'archived';



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
  const t = await getT();

  const { data: e, error } = await supabase
    .from('events')
    .select(`
      id, event_id, name, state, event_type, retention_months, max_contributors,
      photos_per_guest, slug, host_name, theme, created_at, expires_at,
      is_published, cover_image_url, film_recipe_id, auto_publish_at, client_id
    `)
    .eq('event_id', eventId)
    .single();

  const { data: recipes } = await supabase
    .from('film_recipes')
    .select('id, name')
    .eq('active', true)
    .order('name');

  if (error?.code === 'PGRST116' || (!error && !e)) {
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

  // Fetch client and event_services in parallel (after we know the event exists)
  const [clientResult, eventServicesResult] = await Promise.all([
    e.client_id
      ? supabase
          .from('clients')
          .select('id, client_code, name')
          .eq('id', e.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('event_services')
      .select('id, status, service_id, services(name, slug)')
      .eq('event_id', e.id),
  ]);

  const clientData = clientResult.data;
  const eventServices = eventServicesResult.data ?? [];

  let finalCoverUrl = e.cover_image_url ?? null;
  if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
    const { data } = await supabase.storage.from('albumcerita_photos').createSignedUrl(finalCoverUrl, 3600);
    if (data) finalCoverUrl = data.signedUrl;
  }

  const isActuallyPublished = Boolean(e.is_published || (e.auto_publish_at && new Date() >= new Date(e.auto_publish_at)));
  const computedState = isActuallyPublished && e.state === 'draft' ? 'published' : (e.state as string);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 relative">
      <div className="absolute top-6 right-6">
        <LangSwitcher className="!bg-gray-100 !border-gray-200 !text-gray-600 hover:!text-gray-900 !backdrop-blur-none" />
      </div>

      {/* One-time PIN banner — only rendered right after creation or legacy PIN reset */}
      {flashData && flashData.pin && (
        <PinBanner eventId={e.event_id} pin={flashData.pin} isReset={flashData.isReset} />
      )}
      
      {/* Breadcrumb */}
      <nav className="mb-6 mt-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-gray-600 transition-colors">
          {t.adminEventDetail.eventsBreadcrumb}
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
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATE_STYLES[computedState as keyof typeof STATE_STYLES] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {computedState}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Guest & Host Access Sections */}
        {e.slug && (
          <div className="space-y-4">
            <AccessCard 
              eventId={e.event_id}
              title={t.adminEventDetail.guestAccess}
              type="guest"
              slug={e.slug} 
              pin={flashData?.guestPin} 
              baseUrl={baseUrl} 
            />
            <AccessCard 
              eventId={e.event_id}
              title={t.adminEventDetail.hostAccess}
              type="host"
              slug={e.slug} 
              pin={flashData?.hostPin} 
              baseUrl={baseUrl} 
            />
          </div>
        )}

        {/* Publish Status */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            {t.adminEventDetail.albumStatus}
          </h2>
          <div className="flex items-center gap-2 mb-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isActuallyPublished ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="font-semibold text-gray-900">{isActuallyPublished ? t.adminEventDetail.statusPublished : t.adminEventDetail.statusDraft}</span>
          </div>
          {isActuallyPublished ? (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">{t.adminEventDetail.publicLink}</p>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm font-mono text-gray-800 break-all mr-3">
                  {baseUrl}/album/{e.slug}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t.adminEventDetail.publicHelper}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              {t.adminEventDetail.draftHelper}
            </p>
          )}
        </div>

        {/* Edit Event Form */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t.adminEventDetail.eventConfig}
            </h2>
          </div>
          <div className="px-6 py-4">
            <EditEventForm
              eventId={e.event_id}
              availableRecipes={recipes || []}
              initialValues={{
                name: e.name,
                host_name: e.host_name ?? '',
                theme: e.theme ?? 'Sage',
                retention_months: e.retention_months,
                max_contributors: e.max_contributors,
                photos_per_guest: e.photos_per_guest,
                cover_image_url: finalCoverUrl,
                raw_cover_image_url: e.cover_image_url,
                film_recipe_id: e.film_recipe_id ?? '',
                auto_publish_at: e.auto_publish_at ? new Date(e.auto_publish_at).toISOString().slice(0, 16) : '',
              }}
            />
          </div>
        </div>

        {/* Read-only system details */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.adminEventDetail.sysInfo}</h2>
          </div>
          <dl className="px-6 divide-y divide-gray-100">
            <FieldRow label={t.adminEventDetail.legacyEventId} value={<span className="font-mono text-xs">{e.event_id}</span>} />
            <FieldRow
              label={t.adminEventDetail.state}
              value={
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLES[computedState as keyof typeof STATE_STYLES] ?? 'bg-gray-100 text-gray-600'}`}>
                  {computedState}
                </span>
              }
            />
            <FieldRow label={t.adminEventDetail.created} value={formatDate(e.created_at)} />
          </dl>
        </div>

        {/* Client panel */}
        {clientData && clientData.client_code !== 'CLI-0000' && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Client</h2>
            </div>
            <div className="px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{clientData.name}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{clientData.client_code}</p>
              </div>
              <Link
                href={`/admin/clients/${clientData.id}`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                View Client →
              </Link>
            </div>
          </div>
        )}

        {/* Services panel */}
        {eventServices.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Services</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {eventServices.map((es) => {
                const svc = Array.isArray(es.services) ? es.services[0] : es.services;
                const serviceName = svc?.name ?? 'Unknown Service';
                return (
                  <div key={es.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{serviceName}</p>
                        <span
                          className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            es.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : es.status === 'pending_setup'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {es.status === 'pending_setup' ? 'Pending Setup' : es.status}
                        </span>
                      </div>
                    </div>
                    <button
                      disabled
                      title="Configuration coming in a future phase"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

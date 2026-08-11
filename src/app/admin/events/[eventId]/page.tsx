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
      event_id, name, state, event_type, retention_months, max_contributors, 
      photos_per_guest, slug, host_name, theme, created_at, expires_at, 
      is_published, cover_image_url, film_recipe_id, auto_publish_at
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

  let finalCoverUrl = e.cover_image_url ?? null;
  if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
    const { data } = await supabase.storage.from('albumcerita_photos').createSignedUrl(finalCoverUrl, 3600);
    if (data) finalCoverUrl = data.signedUrl;
  }

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
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATE_STYLES[e.state as keyof typeof STATE_STYLES] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {e.state as string}
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
            <span className={`h-2.5 w-2.5 rounded-full ${e.is_published ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="font-semibold text-gray-900">{e.is_published ? t.adminEventDetail.statusPublished : t.adminEventDetail.statusDraft}</span>
          </div>
          {e.is_published ? (
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

        {/* Read-only details */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.adminEventDetail.sysInfo}</h2>
          </div>
          <dl className="px-6 divide-y divide-gray-100">
            <FieldRow label={t.adminEventDetail.legacyEventId} value={<span className="font-mono text-xs">{e.event_id}</span>} />
            <FieldRow
              label={t.adminEventDetail.state}
              value={
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLES[e.state as keyof typeof STATE_STYLES] ?? 'bg-gray-100 text-gray-600'}`}>
                  {e.state as string}
                </span>
              }
            />
            <FieldRow label={t.adminEventDetail.created} value={formatDate(e.created_at)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

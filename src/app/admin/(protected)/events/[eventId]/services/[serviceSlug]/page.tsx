import { notFound } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Settings, ArrowLeft, Camera } from 'lucide-react';
import { DisposableCameraConfigWizard } from './disposable-camera-config-wizard';
import { DcTabs } from './dc-tabs';
import { DcAccessTab } from './dc-access-tab';
import { DcAlbumTab } from './dc-album-tab';
import { decodePinFlash, PIN_FLASH_COOKIE } from '@/lib/pin-flash';
import { getMediaUrl } from '@/lib/media';

interface PageProps {
  params: Promise<{
    eventId: string;
    serviceSlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EventServiceConfigurationPage({ params, searchParams }: PageProps) {
  const { eventId, serviceSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'overview';
  
  const supabase = await createClient();

  // 1. Fetch the event to ensure it exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, photos_per_guest, max_contributors, retention_months, film_recipe_id, slug, is_published, auto_publish_at, theme, cover_image_url')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch the requested service by slug to get its UUID
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, slug')
    .eq('slug', serviceSlug)
    .single();

  if (serviceError || !service) {
    notFound();
  }

  // 3. Validate that this service is actually enabled for this event
  const { data: eventService, error: esError } = await supabase
    .from('event_services')
    .select('id, status')
    .eq('event_id', event.id)
    .eq('service_id', service.id)
    .single();

  if (esError || !eventService) {
    // Service is not enabled for this event. Do not allow configuration!
    notFound();
  }

  // Build absolute base URL for QRs and links
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Read PIN flash cookie for newly generated PINs
  const cookieStore = await cookies();
  const flashRaw = cookieStore.get(PIN_FLASH_COOKIE)?.value;
  const flashData = decodePinFlash(flashRaw, eventId);

  // ── Disposable Camera: load additional data for the wizard ─────────────────
  if (serviceSlug === 'disposable-camera') {
    const serviceSupabase = createServiceClient();
    const { data: recipes } = await serviceSupabase
      .from('film_recipes')
      .select('id, name, active')
      .order('name');

    let finalCoverUrl = event.cover_image_url ?? null;
    if (finalCoverUrl) {
      finalCoverUrl = await getMediaUrl(finalCoverUrl);
    }

    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        {/* Breadcrumb nav */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </nav>

        {/* Page header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Disposable Camera
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Workspace for <span className="font-semibold text-gray-700">{event.name}</span>
            </p>
          </div>
        </div>

        <DcTabs />

        <div className="mt-6">
          {currentTab === 'overview' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-3xl text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Disposable Camera Active</h2>
              <p className="text-gray-500 mb-6">This service is active for this event. Use the tabs above to configure settings, manage guest access, or update the public album.</p>
              <div className="flex justify-center gap-4">
                <Link href={`?tab=configuration`} className="text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                  Edit Configuration
                </Link>
                <Link href={`?tab=access`} className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                  Get Access Links
                </Link>
              </div>
            </div>
          )}
          {currentTab === 'configuration' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl">
              <DisposableCameraConfigWizard
                eventId={eventId}
                eventName={event.name}
                initialValues={{
                  photos_per_guest: event.photos_per_guest ?? 10,
                  max_contributors: event.max_contributors ?? 50,
                  retention_months: event.retention_months ?? 3,
                  film_recipe_id: event.film_recipe_id ?? '',
                }}
                availableRecipes={recipes ?? []}
              />
            </div>
          )}
          {currentTab === 'access' && (
            <DcAccessTab 
              eventId={eventId} 
              slug={event.slug} 
              baseUrl={baseUrl} 
              flashData={flashData} 
            />
          )}
          {currentTab === 'album' && (
            <DcAlbumTab 
              eventId={eventId} 
              initialValues={{
                theme: event.theme ?? 'Sage',
                cover_image_url: finalCoverUrl,
                raw_cover_image_url: event.cover_image_url,
                auto_publish_at: event.auto_publish_at ? new Date(event.auto_publish_at).toISOString().slice(0, 16) : '',
              }} 
            />
          )}
        </div>
      </div>
    );
  }

  // ── All other services: generic placeholder ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/admin/events/${eventId}`} className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{service.name} Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configuring service for <span className="font-semibold text-gray-700">{event.name}</span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {service.name} configuration will be implemented in the next phase.
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          This architecture establishes the exact boundary between global services and event context.
        </p>
        <div className="mt-8">
          <Link
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Return to Event Details
          </Link>
        </div>
      </div>
    </div>
  );
}

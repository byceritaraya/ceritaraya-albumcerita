import { notFound } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Settings, ArrowLeft, Camera, AlertCircle, Film } from 'lucide-react';
import { DisposableCameraConfigWizard } from './disposable-camera-config-wizard';
import { DcTabs } from './dc-tabs';
import { DcAccessTab } from './dc-access-tab';
import { decodePinFlash, PIN_FLASH_COOKIE } from '@/lib/pin-flash';
import { getMediaUrl } from '@/lib/media';
import { getActiveFilmRecipesForConfiguration } from '@/lib/film/recipes';
import { decryptText } from '@/lib/encryption';
import { WiWorkspace } from './wi-workspace';

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
  const currentTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'configuration';
  
  const supabase = createServiceClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);

  // 1. Fetch the event to ensure it exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name, host_name, event_date, photos_per_guest, max_contributors, retention_months, film_recipe_id, slug, is_published, auto_publish_at, theme, cover_image_url, guest_pin, host_pin_encrypted')
    .eq(isUuid ? 'id' : 'event_id', eventId)
    .single();

  if (eventError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Database Error</h2>
          <p className="text-sm text-gray-600 mb-4">
            A database error occurred while fetching the event configuration.
          </p>
          <p className="text-xs font-mono text-red-500 bg-red-50 rounded px-3 py-2 mb-6 break-all">
            {eventError.message}
          </p>
          <Link
            href="/admin/events"
            className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
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

  // 3. Validate one-event-one-service architecture
  const { data: allEventServices, error: esError } = await supabase
    .from('event_services')
    .select('id, status, services!inner(slug)')
    .eq('event_id', event.id);

  if (esError || !allEventServices || allEventServices.length === 0) {
    // Zero services
    notFound();
  }

  if (allEventServices.length > 1) {
    // Multiple services detected - violate architecture
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Event Configuration</h2>
          <p className="text-sm text-gray-600 mb-6">
            This event contains multiple services ({allEventServices.length} attached) and violates the current one-event-one-service architecture. Please resolve this configuration issue.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-500 mb-8 border border-gray-100">
            Event ID: {event.event_id}
          </div>
          <Link
            href={`/admin/events/${eventId}`}
            className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  const assignedService = allEventServices[0] as unknown as { services: { slug: string } | { slug: string }[] };
  const assignedSlug = Array.isArray(assignedService.services) 
    ? assignedService.services[0].slug 
    : assignedService.services?.slug;

  if (assignedSlug !== serviceSlug) {
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
    // Use shared admin helper which already uses the service role client
    // because admin dashboard uses a custom session, not native Supabase Auth.
    const { data: recipes, error: recipesError } = await getActiveFilmRecipesForConfiguration();

    if (recipesError) {
      // Surface the real database error to the admin rather than silently failing.
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Film className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Film Recipes Unavailable</h2>
            <p className="text-sm text-gray-600 mb-4">
              Failed to load Film Recipes from the database. Please check the server configuration.
            </p>
            <p className="text-xs font-mono text-red-500 bg-red-50 rounded px-3 py-2 mb-6">
              {recipesError.message}
            </p>
            <Link
              href={`/admin/events/${eventId}`}
              className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Event
            </Link>
          </div>
        </div>
      );
    }

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
          {currentTab === 'configuration' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl">
              <DisposableCameraConfigWizard
                eventId={eventId}
                initialValues={{
                  name: event.name ?? '',
                  host_name: event.host_name ?? '',
                  event_date: event.event_date ?? '',
                  photos_per_guest: event.photos_per_guest ?? 10,
                  max_contributors: event.max_contributors ?? 50,
                  retention_months: event.retention_months ?? 3,
                  film_recipe_id: event.film_recipe_id ?? '',
                  cover_image_url: event.cover_image_url ?? null,
                  resolved_cover_url: finalCoverUrl,
                  theme: event.theme ?? 'Sage',
                  is_published: event.is_published ?? false,
                  auto_publish_at: event.auto_publish_at ?? null,
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
              dbGuestPin={event.guest_pin}
              dbHostPin={decryptText(event.host_pin_encrypted)}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Wedding Invitation service workspace ───────────────────────────────────
  if (serviceSlug === 'wedding-invitation') {
    // Fetch the WI configuration record (may not exist yet for newly created events)
    const { data: wiConfig } = await supabase
      .from('wedding_invitations')
      .select('id, status, template_id, wedding_invitation_templates(slug)')
      .eq('event_id', event.id)
      .maybeSingle();

    let assignedTemplateSlug = null;
    let sectionRecords: {
      id: string;
      section_key: string;
      enabled: boolean;
      sort_order: number;
      data: Record<string, unknown>;
    }[] = [];

    if (wiConfig && wiConfig.wedding_invitation_templates) {
      // Supabase join syntax typing can be tricky, cast to unknown first
      const templatesData = wiConfig.wedding_invitation_templates as unknown as { slug: string };
      assignedTemplateSlug = templatesData.slug;

      const { data: sections } = await supabase
        .from('wedding_invitation_sections')
        .select('id, section_key, enabled, sort_order, data')
        .eq('invitation_id', wiConfig.id)
        .order('sort_order', { ascending: true });

      if (sections) {
        // We know sections shape from select
        sectionRecords = sections as unknown as {
          id: string;
          section_key: string;
          enabled: boolean;
          sort_order: number;
          data: Record<string, unknown>;
        }[];
      }
    }

    return (
      <WiWorkspace
        eventId={eventId}
        eventName={event.name ?? 'Untitled Event'}
        hasConfiguration={!!wiConfig}
        assignedTemplateSlug={assignedTemplateSlug}
        sectionRecords={sectionRecords}
      />
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

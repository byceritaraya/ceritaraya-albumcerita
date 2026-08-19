import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Settings, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    eventId: string;
    serviceSlug: string;
  }>;
}

export default async function EventServiceConfigurationPage({ params }: PageProps) {
  const { eventId, serviceSlug } = await params;
  const supabase = await createClient();

  // 1. Fetch the event to ensure it exists and get its ID
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, event_id, name')
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch the requested service by slug to get its UUID
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name')
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
        <h3 className="text-lg font-bold text-gray-900">Wizard Coming Soon</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          The event-specific configuration wizard for <strong>{service.name}</strong> will be implemented in the next phase. This architecture establishes the exact boundary between global services and event context.
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

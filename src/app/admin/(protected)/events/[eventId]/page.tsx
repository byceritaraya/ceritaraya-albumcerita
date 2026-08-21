import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { getT } from '@/lib/i18n/server';
import { LangSwitcher } from '@/app/_components/lang-switcher';
import { Settings, Calendar, Briefcase, ExternalLink, Activity } from 'lucide-react';

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

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  const supabase = createServiceClient();
  const t = await getT();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);

  const { data: e, error } = await supabase
    .from('events')
    .select(`
      id, event_id, name, state, event_type, event_date,
      created_at, is_published, auto_publish_at, client_id
    `)
    .eq(isUuid ? 'id' : 'event_id', eventId)
    .single();

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

  // Fetch client and event_services in parallel
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

  const isActuallyPublished = Boolean(e.is_published || (e.auto_publish_at && new Date() >= new Date(e.auto_publish_at)));
  const computedState = isActuallyPublished && e.state === 'draft' ? 'published' : (e.state as string);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 relative">
      <div className="absolute top-6 right-6">
        <LangSwitcher className="!bg-gray-100 !border-gray-200 !text-gray-600 hover:!text-gray-900 !backdrop-blur-none" />
      </div>
      
      {/* Breadcrumb */}
      <nav className="mb-6 mt-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/events" className="hover:text-gray-600 transition-colors">
          {t.adminEventDetail.eventsBreadcrumb}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{e.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{e.name}</h1>
          <p className="mt-1 font-mono text-xs text-gray-400 flex items-center gap-2">
            {e.event_id}
            {e.event_date && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(e.event_date)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${STATE_STYLES[computedState as keyof typeof STATE_STYLES] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {computedState}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Services (Primary) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Service</h2>
            </div>
            
            <div className="p-6">
              {eventServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventServices.map((es) => {
                    const svc = Array.isArray(es.services) ? es.services[0] : es.services;
                    const serviceName = svc?.name ?? 'Unknown Service';
                    return (
                      <div key={es.id} className="border border-gray-200 rounded-xl p-5 flex flex-col h-full hover:border-gray-300 transition-colors bg-gray-50/50">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 text-base">{serviceName}</h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
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
                        
                        <div className="mt-auto pt-4">
                          <Link
                            href={`/admin/events/${e.event_id}/services/${svc.slug}`}
                            className="inline-flex items-center justify-center w-full gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                          >
                            Open {serviceName} <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No service assigned to this event.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Context Information */}
        <div className="space-y-6">
          {/* Client Panel */}
          {clientData && clientData.client_code !== 'CLI-0000' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client Info</h2>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{clientData.name}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{clientData.client_code}</p>
                </div>
                <Link
                  href={`/admin/clients/${clientData.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Client Profile
                </Link>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">System Information</h2>
            </div>
            <dl className="px-5 divide-y divide-gray-100">
              <div className="py-3 flex justify-between">
                <dt className="text-xs font-medium text-gray-500">Event Type</dt>
                <dd className="text-xs font-medium text-gray-900 capitalize">{e.event_type || '—'}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-xs font-medium text-gray-500">Legacy Event ID</dt>
                <dd className="font-mono text-xs text-gray-900">{e.event_id}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-xs font-medium text-gray-500">{t.adminEventDetail.created}</dt>
                <dd className="text-xs text-gray-900">{formatDate(e.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
        
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import { ClientForm } from './client-form';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = createServiceClient();

  // Fetch client details
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Fetch associated events with their service count
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      event_id,
      name,
      state,
      event_date,
      created_at,
      event_services(
        services(name)
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{client.name}</h1>
        <p className="mt-1 text-sm text-gray-500 font-mono">
          {client.client_code}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Section: Client Form */}
        <div>
          <ClientForm client={client} />
        </div>

        {/* Bottom Section: Event History */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Event History</h2>
              <Link
                href={`/admin/clients/${clientId}/events/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Event
              </Link>
            </div>
            
            <div className="p-6">
              {!eventsError && events && events.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {events.map((event) => {
                    const servicesText = event.event_services && event.event_services.length > 0 
                      ? (event.event_services[0] as { services?: { name?: string } }).services?.name || 'Unknown Service'
                      : 'No Service';
                    return (
                      <div key={event.id} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{event.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>
                              {event.event_date
                                ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
                                : new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="mt-3">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Service</span>
                            <p className="text-sm text-gray-700 mt-0.5 truncate">{servicesText}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 shrink-0 h-full justify-between">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            event.state === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            event.state === 'published' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.state}
                          </span>
                          <Link 
                            href={`/admin/events/${event.event_id}`} 
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-auto"
                          >
                            View Event <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No events yet</p>
                  <p className="text-xs text-gray-500 mt-1 mb-6 max-w-sm">This client doesn&apos;t have any events associated with them yet.</p>
                  <Link
                    href={`/admin/clients/${clientId}/events/new`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

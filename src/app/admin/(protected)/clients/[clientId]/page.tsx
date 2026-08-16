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
      event_services(count)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Form */}
        <div className="lg:col-span-2">
          <ClientForm client={client} />
        </div>

        {/* Right Column: Events */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Events</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {!eventsError && events && events.length > 0 ? (
                <div className="space-y-4 flex-1">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/30">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{event.name}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {event.event_date
                                ? new Date(event.event_date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    timeZone: 'UTC',
                                  })
                                : new Date(event.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                            </span>
                            <span>&bull;</span>
                            <span>{event.event_services?.[0]?.count || 0} Services</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          event.state === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          event.state === 'published' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {event.state}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Link 
                          href={`/admin/events/${event.event_id}`} 
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 block text-center"
                        >
                          View Event
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No events yet</p>
                  <p className="text-xs text-gray-500 mt-1">This client doesn&apos;t have any events.</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link
                  href={`/admin/clients/${clientId}/events/new`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

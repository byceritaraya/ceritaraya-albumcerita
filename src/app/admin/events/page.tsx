import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';

type EventState = 'draft' | 'published' | 'expired' | 'archived';

interface Event {
  id: string;
  event_id: string;
  name: string;
  state: EventState;
  created_at: string;
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

export default async function AdminEventsPage() {
  const supabase = createServiceClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('id, event_id, name, state, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            All events managed through AlbumCerita.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          id="create-event-button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          + New Event
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      )}

      {/* Empty state */}
      {!error && events && events.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No events found.</p>
          <p className="mt-1 text-xs text-gray-400">Events you create will appear here.</p>
        </div>
      )}

      {/* Table */}
      {!error && events && events.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">Event Name</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">Event ID</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">State</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(events as Event[]).map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50 transition-colors duration-100 group"
                >
                  <td className="px-5 py-4 font-medium text-gray-900">
                    <Link
                      href={`/admin/events/${event.event_id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">
                    {event.event_id}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATE_STYLES[event.state] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {event.state}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(event.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-400">
            {events.length} event{events.length !== 1 ? 's' : ''} total
          </div>
        </div>
      )}
    </div>
  );
}

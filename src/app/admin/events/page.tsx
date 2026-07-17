import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { EventRow } from './event-row';
import { getT } from '@/lib/i18n/server';
import { LangSwitcher } from '@/app/_components/lang-switcher';

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

export default async function AdminEventsPage() {
  const supabase = createServiceClient();
  const t = await getT();

  const { data: events, error } = await supabase
    .from('events')
    .select('id, event_id, name, state, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 relative">
      <div className="absolute top-6 right-6">
        <LangSwitcher variant="inline" className="border-gray-200" />
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.adminEvents.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.adminEvents.subtitle}
          </p>
        </div>
        <Link
          href="/admin/events/new"
          id="create-event-button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          {t.adminEvents.newEvent}
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">{t.adminEvents.errorPrefix}</span> {error.message}
        </div>
      )}

      {/* Empty state */}
      {!error && events && events.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">{t.adminEvents.emptyTitle}</p>
          <p className="mt-1 text-xs text-gray-400">{t.adminEvents.emptyBody}</p>
        </div>
      )}

      {/* Table */}
      {!error && events && events.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">{t.adminEvents.colName}</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">{t.adminEvents.colId}</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">{t.adminEvents.colState}</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide">{t.adminEvents.colCreated}</th>
                <th className="px-5 py-3 font-semibold text-gray-600 tracking-wide text-right">{t.adminEvents.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(events as Event[]).map((event) => (
                <EventRow 
                  key={event.id} 
                  event={event} 
                  stateStyles={STATE_STYLES}
                />
              ))}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-400">
            {t.adminEvents.total(events.length)}
          </div>
        </div>
      )}
    </div>
  );
}

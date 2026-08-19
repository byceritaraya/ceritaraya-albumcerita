'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteEventAction } from './actions';
import { useT } from '@/lib/i18n/use-t';

type EventState = 'draft' | 'published' | 'expired' | 'archived';

interface EventRowProps {
  event: {
    id: string;
    event_id: string;
    name: string;
    state: EventState;
    event_date: string | null;
    created_at: string;
    clients?: { name: string } | null;
    event_services?: { count: number }[] | null;
  };
  stateStyles: Record<EventState, string>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function EventRow({ event, stateStyles }: EventRowProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useT();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteEventAction(event.event_id);
      // Wait for revalidatePath to refresh the page
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(t.adminDeleteEvent.errorAlert);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors duration-100 group">
        <td className="px-5 py-4 font-medium text-gray-900">
          <Link
            href={`/admin/events/${event.event_id}`}
            className="hover:text-[var(--theme-primary)] transition-colors"
          >
            {event.name}
          </Link>
          <div className="text-xs text-gray-400 font-normal mt-0.5 font-mono">{event.event_id}</div>
        </td>
        <td className="px-5 py-4 font-medium text-gray-700">
          {event.clients?.name || '—'}
        </td>
        <td className="px-5 py-4 text-gray-500 text-xs">
          {event.event_date ? formatDate(event.event_date) : '—'}
        </td>
        <td className="px-5 py-4">
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
            {event.event_services?.[0]?.count || 0}
          </span>
        </td>
        <td className="px-5 py-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stateStyles[event.state] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {event.state}
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-3 text-xs font-medium">
            <Link
              href={`/admin/events/${event.event_id}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t.adminEvents.view}
            </Link>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              {t.adminEvents.delete}
            </button>
          </div>
        </td>
      </tr>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ac-modal-enter">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.adminDeleteEvent.title}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {t.adminDeleteEvent.body}
              <br/><br/>
              {t.adminDeleteEvent.willRemove}
              <ul className="list-disc ml-5 mt-2 space-y-1">
                {t.adminDeleteEvent.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t.adminDeleteEvent.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? t.adminDeleteEvent.removing : t.adminDeleteEvent.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

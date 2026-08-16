import Link from 'next/link';

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-5xl font-bold text-gray-200 select-none">404</p>
        <h1 className="mt-4 text-lg font-semibold text-gray-800">Event not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          No event matches that ID. It may have been deleted or never existed.
        </p>
        <Link
          href="/admin/events"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          ← Back to Events
        </Link>
      </div>
    </div>
  );
}

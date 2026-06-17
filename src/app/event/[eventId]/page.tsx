import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params;
  
  const supabase = createServiceClient();
  
  const { data: event, error } = await supabase
    .from('events')
    .select('event_id, name, event_type, photos_per_guest')
    .eq('event_id', eventId)
    .single();

  if (error?.code === 'PGRST116' || (!error && !event)) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase bg-gray-100 rounded-full">
            {event.event_type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{event.name}</h1>
          <p className="mt-4 text-gray-500">Welcome to our event! We are so excited to celebrate with you.</p>
        </div>
        
        <div className="p-8 bg-gray-50">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-white text-center">
            <div className="w-12 h-12 mb-4 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Upload Photos</h3>
            <p className="mt-1 text-xs text-gray-500">(Coming Soon)</p>
          </div>
          
          <p className="mt-6 text-xs text-center text-gray-400">
            You can upload up to <span className="font-semibold text-gray-600">{event.photos_per_guest} photos</span>
          </p>
        </div>
      </div>
    </div>
  );
}

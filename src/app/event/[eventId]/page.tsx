import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { UploadForm } from './upload-form';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { eventId } = await params;
  
  const cookieStore = await cookies();
  const contributorId = cookieStore.get('contributor_id')?.value;

  if (!contributorId) {
    redirect('/join');
  }

  const supabase = createServiceClient();
  
  const { data: event, error } = await supabase
    .from('events')
    .select('id, event_id, name, event_type, photos_per_guest')
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      notFound();
    }
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  const { data: contributor } = await supabase
    .from('contributors')
    .select('display_name, event_id')
    .eq('id', contributorId)
    .single();

  if (!contributor || contributor.event_id !== event.id) {
    redirect('/join');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase bg-gray-100 rounded-full">
            {event.event_type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{event.name}</h1>
          <p className="mt-4 text-gray-500">Welcome, {contributor.display_name}! We are so excited to celebrate with you.</p>
        </div>
        
        <div className="p-8 bg-gray-50">
          <UploadForm eventId={eventId} />
          
          <p className="mt-6 text-xs text-center text-gray-400">
            You can upload up to <span className="font-semibold text-gray-600">{event.photos_per_guest} photos</span>
          </p>
        </div>
      </div>
    </div>
  );
}

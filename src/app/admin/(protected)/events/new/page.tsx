import { createServiceClient } from '@/lib/supabase/service';
import { SharedEventWizard } from '@/app/admin/(protected)/_components/shared-event-wizard';

export default async function NewEventPage() {
  const supabase = createServiceClient();
  
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client_code, name, status')
    .order('name');

  const { data: services } = await supabase
    .from('services')
    .select('id, slug, name, description')
    .eq('active', true)
    .order('name');
    
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Global Event</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up a new event for any existing client and select its services.
          </p>
        </div>

        <SharedEventWizard 
          mode="global" 
          clients={clients || []} 
          services={services || []} 
        />
      </div>
    </div>
  );
}

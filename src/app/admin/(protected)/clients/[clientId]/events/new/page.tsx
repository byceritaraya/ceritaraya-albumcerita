import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import { SharedEventWizard } from '@/app/admin/(protected)/_components/shared-event-wizard';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function NewClientEventPage({ params }: PageProps) {
  const { clientId } = await params;
  const supabase = createServiceClient();

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, client_code, name, status')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Fetch active services from the catalog
  const { data: services } = await supabase
    .from('services')
    .select('id, slug, name, description')
    .eq('active', true)
    .order('name');

  const activeServices = services ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back nav */}
        <div className="mb-8">
          <Link
            href={`/admin/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {client.name}
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Event</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up a new event and select its services.
          </p>
        </div>

        {/* Inactive client guard */}
        {client.status === 'inactive' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">Client is inactive</h2>
                <p className="text-sm text-amber-700 mt-1">
                  <span className="font-medium">{client.name}</span> ({client.client_code}) is currently
                  inactive. Reactivate the client before creating a new event.
                </p>
                <div className="mt-4">
                  <Link
                    href={`/admin/clients/${clientId}`}
                    className="inline-flex items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition-colors"
                  >
                    Go to Client Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : activeServices.length === 0 ? (
          /* No active services guard */
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-900">No active services available</p>
            <p className="text-sm text-gray-500 mt-1">
              There are no active services configured. Contact the engineering team to seed the services catalog.
            </p>
          </div>
        ) : (
          /* Wizard */
          <SharedEventWizard mode="client" initialClient={client} services={activeServices} />
        )}
      </div>
    </div>
  );
}

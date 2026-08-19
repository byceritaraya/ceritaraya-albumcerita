import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Box, ArrowRight, Camera, Mail } from 'lucide-react';

// Maps common service slugs to icons
const getServiceIcon = (slug: string) => {
  if (slug === 'disposable-camera') return <Camera className="w-6 h-6 text-gray-700" />;
  if (slug === 'wedding-invitation') return <Mail className="w-6 h-6 text-gray-700" />;
  return <Box className="w-6 h-6 text-gray-700" />;
};

export default async function ServicesHubPage() {
  const supabase = await createClient();
  
  // Try to get description and is_active, but fallback safely if columns don't exist
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, slug')
    .order('name');

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Services Hub</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          Failed to load services: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Services Hub</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global management area for all Cerita Raya platform services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <div key={service.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col transition-shadow hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              {getServiceIcon(service.slug)}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6 flex-1">
              Global service settings and management for {service.name}.
            </p>
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <Link 
                href={`/admin/services/${service.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Manage Service
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}

        {(!services || services.length === 0) && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-200 border-dashed rounded-2xl">
            No services configured in the system.
          </div>
        )}
      </div>
    </div>
  );
}

import { createServiceClient } from '@/lib/supabase/service';
import { Users, Calendar, Box } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Fetch counts in parallel
  const [
    { count: clientCount },
    { count: eventCount },
    { count: serviceCount },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('active', true),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of Cerita Raya platform metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Clients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Clients</h2>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{clientCount || 0}</p>
        </div>

        {/* Total Events */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Events</h2>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{eventCount || 0}</p>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Active Services</h2>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Box className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold text-gray-900">{serviceCount || 0}</p>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Plus } from 'lucide-react';

export default async function AdminClientsPage() {
  const supabase = createServiceClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id,
      client_code,
      name,
      contact_name,
      whatsapp,
      email,
      status,
      created_at,
      events(count)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your businesses, couples, and partners.
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Client
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error.message}
        </div>
      )}

      {!error && clients && clients.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">No clients found</p>
          <p className="mt-1 text-xs text-gray-400">Create a client to start associating events.</p>
        </div>
      )}

      {!error && clients && clients.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                <th className="px-5 py-3.5 font-semibold text-gray-500 tracking-wide">Client</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 tracking-wide hidden md:table-cell">Contact</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 tracking-wide text-center">Events</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 tracking-wide text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => {
                const eventCount = client.events?.[0]?.count || 0;
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{client.client_code}</div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {client.contact_name ? (
                        <div className="text-gray-900">{client.contact_name}</div>
                      ) : (
                        <span className="text-gray-400 italic">No contact</span>
                      )}
                      <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                        {client.whatsapp && <span>WA: {client.whatsapp}</span>}
                        {client.email && <span>{client.email}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {eventCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

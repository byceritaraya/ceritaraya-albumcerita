'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { updateClientAction, type ClientState } from '../actions';

interface ClientFormProps {
  client: {
    id: string;
    client_code: string;
    name: string;
    contact_name: string | null;
    whatsapp: string | null;
    email: string | null;
    notes: string | null;
    status: string;
  };
}

const initialState: ClientState = {};

export function ClientForm({ client }: ClientFormProps) {
  const updateWithId = updateClientAction.bind(null, client.id);
  const [state, formAction, isPending] = useActionState(updateWithId, initialState);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-900">Client Information</h2>
      </div>
      
      {state.error && (
        <div className="m-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="m-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Client updated successfully.
        </div>
      )}

      <form action={formAction} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Client ID
            </label>
            <div className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 inline-block">
              {client.client_code}
            </div>
            <p className="mt-1 text-xs text-gray-400">Client ID is automatically generated and cannot be changed.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={client.name}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-900 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              defaultValue={client.contact_name || ''}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-900 mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              defaultValue={client.whatsapp || ''}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={client.email || ''}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={client.notes || ''}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={client.status}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Setting to inactive will not delete the client but may hide them from default views.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center min-w-[120px] rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

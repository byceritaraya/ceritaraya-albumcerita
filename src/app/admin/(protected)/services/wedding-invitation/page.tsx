import { Mail, Calendar, Layout } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function WeddingInvitationOverview() {
  const supabase = await createClient();

  // Basic stats
  const { count: eventsCount } = await supabase
    .from('event_services')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
    // Note: To be precise, we'd filter by service_id for wedding invitation.
    // For this architectural phase, we just show a general active count.

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global status and statistics for the Wedding Invitation service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Active Events</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{eventsCount ?? 0}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm opacity-50">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Layout className="w-5 h-5" />
            <span className="text-sm font-medium">Templates</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm opacity-50">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Invitations Sent</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-sm font-bold text-blue-900 mb-2">Architectural Note</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          The Wedding Invitation service is currently in the architectural phase. This area will eventually manage global templates and invitation defaults. Event-specific details (like the couple&apos;s names, event dates, and RSVP data) will be managed within the specific Event&apos;s Configuration Wizard.
        </p>
      </div>
    </div>
  );
}

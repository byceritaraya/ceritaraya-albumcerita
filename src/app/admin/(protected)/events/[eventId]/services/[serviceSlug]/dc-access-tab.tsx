'use client';

import { AccessCard } from '../../access-cards';
import { useT } from '@/lib/i18n/use-t';

interface Props {
  eventId: string;
  slug: string | null;
  baseUrl: string;
  flashData?: { guestPin?: string; hostPin?: string } | null;
  dbGuestPin?: string | null;
  dbHostPin?: string | null;
}

export function DcAccessTab({ eventId, slug, baseUrl, flashData, dbGuestPin, dbHostPin }: Props) {
  const { t } = useT();

  if (!slug) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
        Access links will be available after the event is fully initialized.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Event Access</h2>
        <p className="mt-1 text-sm text-gray-500">Manage guest and host access links and PINs.</p>
      </div>
      
      <AccessCard 
        eventId={eventId}
        title={t.adminEventDetail.guestAccess}
        type="guest"
        slug={slug} 
        pin={flashData?.guestPin || dbGuestPin || undefined} 
        baseUrl={baseUrl} 
      />
      <AccessCard 
        eventId={eventId}
        title={t.adminEventDetail.hostAccess}
        type="host"
        slug={slug} 
        pin={flashData?.hostPin || dbHostPin || undefined} 
        baseUrl={baseUrl} 
        hiddenDesc="For legacy events, the Host PIN is hidden for security. Regenerate it to enable reveal functionality."
      />
    </div>
  );
}

import React from 'react';
import { EventDetailsSectionData } from '../../types';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaEventDetailsSection({ data }: Props) {
  const eventData = data as unknown as EventDetailsSectionData;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white text-center px-6 py-12">
      <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-6">
        {eventData.title || 'Acara Pernikahan'}
      </h2>
      
      <div className="flex flex-col gap-4 text-stone-700 max-w-md">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-400 mb-1">Tanggal</h3>
          <p className="text-lg font-serif">{eventData.date || 'TBD'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-400 mb-1">Waktu</h3>
          <p className="text-lg font-serif">{eventData.time || 'TBD'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-400 mb-1">Tempat</h3>
          <p className="text-lg font-serif font-medium">{eventData.venue || 'Nama Venue'}</p>
          <p className="text-sm text-stone-500 mt-1">{eventData.address || 'Alamat Venue'}</p>
        </div>
      </div>
    </div>
  );
}

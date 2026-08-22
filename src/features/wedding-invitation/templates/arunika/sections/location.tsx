import React from 'react';
import { LocationSectionData } from '../../types';
import { MapPin } from 'lucide-react';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaLocationSection({ data }: Props) {
  const locData = data as unknown as LocationSectionData;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-stone-50 text-center px-6 py-12">
      <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mb-6">
        <MapPin className="w-6 h-6 text-stone-600" />
      </div>
      
      <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-4">
        Lokasi Acara
      </h2>
      
      <div className="max-w-md mb-8">
        <p className="text-lg font-serif font-medium text-stone-800">{locData.venue || 'Nama Venue'}</p>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">{locData.address || 'Alamat Venue'}</p>
      </div>

      {locData.map_url ? (
        <a 
          href={locData.map_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white text-sm font-medium rounded-full hover:bg-stone-700 transition-colors"
        >
          Buka Peta
        </a>
      ) : (
        <button disabled className="inline-flex items-center gap-2 px-6 py-3 bg-stone-300 text-stone-500 text-sm font-medium rounded-full opacity-50 cursor-not-allowed">
          Peta Belum Tersedia
        </button>
      )}
    </div>
  );
}

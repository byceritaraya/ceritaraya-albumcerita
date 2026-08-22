import React from 'react';
import { ClosingSectionData } from '../../types';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaClosingSection({ data }: Props) {
  const closingData = data as unknown as ClosingSectionData;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-6 relative">
      {closingData.image_url ? (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${closingData.image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-stone-200" />
      )}
      
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-white/50">
        <h2 className="text-xl md:text-2xl font-serif text-stone-800">
          {closingData.title || 'Terima Kasih'}
        </h2>
        <p className="text-sm text-stone-700 leading-relaxed italic">
          {closingData.message || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.'}
        </p>
      </div>
    </div>
  );
}

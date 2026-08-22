import React from 'react';
import { CoverSectionData } from '../../types';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaCoverSection({ data }: Props) {
  // Cast data to specific shape at the component boundary
  const coverData = data as unknown as CoverSectionData;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-6">
      {coverData.cover_image_url ? (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${coverData.cover_image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-stone-100" />
      )}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h2 className="text-sm tracking-[0.2em] text-stone-500 uppercase">
          {coverData.subtitle || 'The Wedding Of'}
        </h2>
        <h1 className="text-4xl md:text-5xl font-serif text-stone-800">
          {coverData.title || 'Nama Mempelai'}
        </h1>
      </div>
    </div>
  );
}

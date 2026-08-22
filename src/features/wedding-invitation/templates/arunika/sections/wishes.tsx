import React from 'react';

// Wishes data is loaded externally from wedding_wishes, not from the section data JSONB
export function ArunikaWishesSection() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white text-center px-6 py-12">
      <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-6 flex-shrink-0">
        Ucapan & Doa
      </h2>
      
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-200 bg-stone-50 rounded-xl text-stone-400 w-full max-w-lg">
        <p className="text-sm italic mb-2">Fitur Ucapan sedang dalam pengembangan (Phase 2J.x).</p>
        <p className="text-xs">Data akan dimuat dari tabel wedding_wishes.</p>
      </div>
    </div>
  );
}

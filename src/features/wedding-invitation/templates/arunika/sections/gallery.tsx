import React from 'react';
import { GallerySectionData } from '../../types';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaGallerySection({ data }: Props) {
  const galleryData = data as unknown as GallerySectionData;
  const images = galleryData.images || [];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-stone-100 text-center px-6 py-12 overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-6 flex-shrink-0">
        Galeri
      </h2>
      
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-4xl">
          {images.map((img, idx) => (
            <div key={idx} className="aspect-square bg-stone-200 rounded overflow-hidden">
              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-300 rounded-lg text-stone-400">
          <p className="text-sm italic">Belum ada foto galeri.</p>
        </div>
      )}
    </div>
  );
}

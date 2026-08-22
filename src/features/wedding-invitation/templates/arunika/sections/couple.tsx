import React from 'react';
import { CoupleSectionData } from '../../types';

interface Props {
  data: Record<string, unknown>;
}

export function ArunikaCoupleSection({ data }: Props) {
  const coupleData = data as unknown as CoupleSectionData;

  const bride = coupleData.bride;
  const groom = coupleData.groom;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-stone-50 text-center px-6 py-12">
      <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-8">
        Mempelai
      </h2>
      
      <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-3xl justify-center">
        {/* Bride */}
        {bride && (
          <div className="flex flex-col items-center flex-1">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-stone-200 mb-4 overflow-hidden">
              {bride.image_url && (
                <img src={bride.image_url} alt={bride.name || 'Bride'} className="w-full h-full object-cover" />
              )}
            </div>
            <h3 className="text-lg font-serif text-stone-900">{bride.name || 'Nama Mempelai Wanita'}</h3>
            {bride.full_name && <p className="text-sm text-stone-500 mt-2">{bride.full_name}</p>}
          </div>
        )}

        {/* Separator */}
        {(bride || groom) && <div className="text-2xl font-serif text-stone-400 italic">&amp;</div>}

        {/* Groom */}
        {groom && (
          <div className="flex flex-col items-center flex-1">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-stone-200 mb-4 overflow-hidden">
              {groom.image_url && (
                <img src={groom.image_url} alt={groom.name || 'Groom'} className="w-full h-full object-cover" />
              )}
            </div>
            <h3 className="text-lg font-serif text-stone-900">{groom.name || 'Nama Mempelai Pria'}</h3>
            {groom.full_name && <p className="text-sm text-stone-500 mt-2">{groom.full_name}</p>}
          </div>
        )}
      </div>

      {!bride && !groom && (
        <p className="text-sm text-stone-400 italic">Data mempelai belum diisi.</p>
      )}
    </div>
  );
}

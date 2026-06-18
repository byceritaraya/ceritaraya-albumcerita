'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { togglePhotoVisibility } from './actions';

export interface HostGalleryPhoto {
  id: string;
  original_url: string;
  guest_name: string;
  is_hidden: boolean;
}

export function HostGallery({ 
  photos, 
  hostSlug 
}: { 
  photos: HostGalleryPhoto[];
  hostSlug: string;
}) {
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleToggle = async (id: string, currentHidden: boolean) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await togglePhotoVisibility(id, currentHidden, hostSlug);
      setLocalPhotos(prev => prev.map(p => 
        p.id === id ? { ...p, is_hidden: !currentHidden } : p
      ));
    } catch (e) {
      console.error(e);
      alert("Failed to update photo visibility.");
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <section className="mt-8 w-full">
      <h2 className="font-heading text-2xl text-[var(--text-primary)] mb-6">Captured Moments</h2>
      
      {localPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#EFE8DD] bg-white py-16 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No moments captured yet.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Share your guest link to start collecting memories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {localPhotos.map((photo) => (
            <div key={photo.id} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#EFE8DD] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.original_url}
                alt={`Photo by ${photo.guest_name}`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${photo.is_hidden ? 'opacity-40 grayscale' : ''}`}
                loading="lazy"
              />
              
              {/* Overlay with guest name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">By {photo.guest_name}</p>
              </div>

              {/* Status Badge */}
              {photo.is_hidden && (
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-medium">
                  Hidden
                </div>
              )}

              {/* Moderation Button */}
              <button
                onClick={() => handleToggle(photo.id, photo.is_hidden)}
                disabled={loadingIds.has(photo.id)}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[var(--text-primary)] p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title={photo.is_hidden ? "Unhide Photo" : "Hide Photo"}
              >
                {photo.is_hidden ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

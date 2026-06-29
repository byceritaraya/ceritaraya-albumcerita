'use client';

import { useEffect, useState, useRef } from 'react';
import type { AlbumPhoto } from '@/app/_components/album-view';

export interface PhotoLightboxProps {
  photo: AlbumPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  eventName: string;
  photoNumber: number;
}

export function PhotoLightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext, eventName, photoNumber }: PhotoLightboxProps) {
  // Swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Zoom logic
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // formatting timestamp
  const captureDate = new Date(photo.uploaded_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const captureTime = new Date(photo.uploaded_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { 
      window.removeEventListener('keydown', handler); 
      document.body.style.overflow = ''; 
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);
  
  // reset zoom on photo change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, [photo.id]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (isZoomed) return; // disable swipe when zoomed
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && hasNext) {
      onNext();
    }
    if (isRightSwipe && hasPrev) {
      onPrev();
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(photo.original_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const sanitize = (name: string) => name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const safeEvent = sanitize(eventName);
      const safeContributor = sanitize(photo.guest_name);
      const safeNumber = photoNumber.toString().padStart(3, '0');
      
      link.download = `${safeEvent}_${safeContributor}_${safeNumber}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };
  
  const toggleZoom = (e: React.MouseEvent | React.TouchEvent) => {
    if (scale === 1) {
      setScale(2.5);
      setIsZoomed(true);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" 
         onClick={onClose}>
      
      {/* Top Header */}
      <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent z-20" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">Taken by {photo.guest_name}</span>
          <span className="text-white/70 text-xs">{captureDate} at {captureTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition" aria-label="Download">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {hasPrev && (
        <button onClick={e => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition hidden sm:flex" aria-label="Previous">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button onClick={e => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition hidden sm:flex" aria-label="Next">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <div 
        className="relative max-h-[100dvh] max-w-[100dvw] w-full h-full flex items-center justify-center overflow-hidden" 
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={toggleZoom}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          ref={imgRef}
          src={photo.original_url} 
          alt={`Photo by ${photo.guest_name}`} 
          className="max-h-[100dvh] max-w-[100dvw] object-contain transition-transform duration-200 ease-out" 
          style={{ 
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            cursor: isZoomed ? 'zoom-out' : 'zoom-in'
          }}
          onClick={toggleZoom}
          draggable={false}
        />
      </div>
    </div>
  );
}

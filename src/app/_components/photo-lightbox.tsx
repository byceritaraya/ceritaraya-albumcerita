'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { AlbumPhoto } from '@/app/_components/album-view';
import { useT } from '@/lib/i18n/use-t';
import { FilmRecipeSettings } from '@/lib/film/types';
import { FilmImage } from '@/lib/film/FilmImage';

export interface PhotoLightboxProps {
  photoId: string;
  storagePath?: string; // Optional: not available for in-flight/preview-only photos (e.g. film-roll-queue)
  photoUrl: string;
  guestName?: string;
  uploadedAt?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  eventName: string;
  photoNumber: number;
  filmRecipe?: FilmRecipeSettings | null;
  onDelete?: () => void;
  onRetake?: () => void;
  isPublished?: boolean;
  theme?: string;
}

// Direct color map — bypasses CSS variable inheritance issues from portals
const THEME_COLORS: Record<string, string> = {
  sage:  '#87937A',
  blush: '#C9A3A6',
  slate: '#7A8BA0',
  onyx:  '#1A1A1A',
  mauve: '#A08EA8',
  ivory: '#A89880',
};

function getThemeColor(theme?: string): string {
  return THEME_COLORS[theme ?? 'sage'] ?? THEME_COLORS.sage;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PhotoLightbox({ 
  photoId, storagePath, photoUrl, guestName, uploadedAt, 
  onClose, onPrev, onNext, hasPrev, hasNext, 
  eventName, photoNumber, filmRecipe,
  onDelete, onRetake, isPublished, theme 
}: PhotoLightboxProps) {
  const themeColor = getThemeColor(theme);
  const btnBgSemi = hexToRgba(themeColor, 0.6);   // nav buttons (semi-transparent)
  const btnBgSolid = hexToRgba(themeColor, 0.88);  // action buttons (more opaque)
  const { t } = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Zoom logic
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // formatting timestamp
  const captureDate = uploadedAt ? new Date(uploadedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : null;
  const captureTime = uploadedAt ? new Date(uploadedAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  }) : null;

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
  }, [photoId]);

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
      const sanitize = (name: string) => name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const safeEvent = sanitize(eventName);
      const safeContributor = sanitize(guestName || 'You');
      const safeNumber = photoNumber.toString().padStart(3, '0');
      
      const filename = `${safeEvent}_${safeContributor}_${safeNumber}.jpg`;
      
      if (!storagePath) {
        // No S3 key available (e.g. preview/blob URL) — cannot download
        console.warn('[PhotoLightbox] Download requested but no storagePath available.');
        return;
      }
      
      // We pass the true storage path (object key) to the proxy
      // The proxy will resolve the key to a presigned URL internally and stream the download, bypassing CORS.
      const downloadUrl = `/api/media/download?key=${encodeURIComponent(storagePath)}&filename=${encodeURIComponent(filename)}&download=1`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      console.error('Failed to download image.');
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleZoom = (_e: React.MouseEvent | React.TouchEvent) => {
    if (scale === 1) {
      setScale(2.5);
      setIsZoomed(true);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300 theme-${theme || 'onyx'}`} 
         onClick={onClose}>
      
      {/* Top Header */}
      <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent z-20 animate-in slide-in-from-top-4 fade-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col">
          {guestName && <span className="text-white font-medium text-sm">{t.lightbox.takenBy(guestName)}</span>}
          {captureDate && captureTime && <span className="text-white/70 text-xs">{captureDate} · {captureTime}</span>}
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <button onClick={handleDownload} className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-90" style={{ backgroundColor: btnBgSemi }} aria-label={t.lightbox.download}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-90" style={{ backgroundColor: btnBgSemi }} aria-label={t.lightbox.close}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {hasPrev && (
        <button 
          onClick={e => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-90 active:scale-95" 
          style={{ backgroundColor: btnBgSemi }}
          aria-label={t.lightbox.prev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button 
          onClick={e => { e.stopPropagation(); onNext(); }} 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:opacity-90 active:scale-95" 
          style={{ backgroundColor: btnBgSemi }}
          aria-label={t.lightbox.next}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Bottom Action Area */}
      <div className="absolute bottom-8 inset-x-0 z-50 flex justify-center pointer-events-none gap-3">
        {onRetake && (
          <button 
            onClick={(e) => { e.stopPropagation(); onRetake(); onClose(); }} 
            className="pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-100 active:scale-95" 
            style={{ backgroundColor: btnBgSolid }}
            aria-label="Retake"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Retake
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }} 
            className="pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-100 active:scale-95" 
            style={{ backgroundColor: btnBgSolid }}
            aria-label="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        )}
      </div>

      <div 
        className="relative max-h-[100dvh] max-w-[100dvw] w-full h-full flex items-center justify-center overflow-hidden" 
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={toggleZoom}
      >
        {filmRecipe ? (
          <FilmImage
            photoId={photoId}
            src={photoUrl}
            recipeSettings={filmRecipe}
            alt={`Photo by ${guestName || 'You'}`}
            className="max-h-[100dvh] max-w-[100dvw] object-contain transition-transform duration-200 ease-out animate-in zoom-in-95 fade-in duration-300"
            style={{ 
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              cursor: isZoomed ? 'zoom-out' : 'zoom-in'
            }}
            onClick={toggleZoom}
            draggable={false}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            ref={imgRef}
            src={photoUrl} 
            alt={`Photo by ${guestName || 'You'}`} 
            className="max-h-[100dvh] max-w-[100dvw] object-contain transition-transform duration-200 ease-out animate-in zoom-in-95 fade-in duration-300" 
            style={{ 
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              cursor: isZoomed ? 'zoom-out' : 'zoom-in'
            }}
            onClick={toggleZoom}
            draggable={false}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

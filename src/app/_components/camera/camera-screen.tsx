'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { PermissionScreen } from './permission-screen';
import { FilmCounter } from './film-counter';
import { ShutterButton } from './shutter-button';
import { base64ToFile, cropImageTo3x4 } from './camera-utils';
import { X, Zap, ZapOff, RefreshCcw, ChevronLeft } from 'lucide-react';

export interface CameraScreenProps {
  remainingShots: number;
  totalShots: number | null;
  theme?: string;
  pendingUploadCount: number;
  onClose: () => void;
  onCaptureComplete: (files: File[]) => void;
}

// ─── Review Mode ──────────────────────────────────────────────────────────────

function ReviewMode({
  images,
  onClose,
  onRetakeIndex,
  onUseAll,
}: {
  images: string[];
  onClose: () => void;
  onRetakeIndex: (index: number) => void;
  onUseAll: (files: File[]) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(images.length - 1);

  return (
    <div className="fixed inset-0 z-[1100] h-[100dvh] flex flex-col bg-[var(--bg-primary)] animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center px-4 pt-safe pb-2 pt-4 bg-[var(--bg-primary)]">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] transition active:scale-90"
          aria-label="Back to camera"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="ml-3 font-semibold text-[var(--text-primary)]">
          Review ({images.length} {images.length === 1 ? 'photo' : 'photos'})
        </span>
        <div className="ml-auto">
          <button
            onClick={() => {
              const files = images.map((src, i) =>
                base64ToFile(src, `capture_${Date.now()}_${i}.jpg`)
              );
              onUseAll(files);
            }}
            className="rounded-full bg-[var(--theme-primary)] px-5 py-2 text-sm font-semibold text-white transition active:scale-95"
          >
            Share All
          </button>
        </div>
      </div>

      {/* Selected photo */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[selectedIndex]}
          alt="Selected"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>

      {/* Thumbnails + Retake */}
      <div className="bg-[var(--bg-primary)] pb-safe">
        {/* Thumbnail strip */}
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative flex-none h-16 w-16 rounded-lg overflow-hidden border-2 transition ${
                selectedIndex === i
                  ? 'border-[var(--theme-primary)] scale-105'
                  : 'border-transparent opacity-70'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Shot ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        {/* Retake button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => onRetakeIndex(selectedIndex)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] text-sm font-semibold transition active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            Retake Photo {selectedIndex + 1}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Camera Screen ─────────────────────────────────────────────────────────────

export function CameraScreen({
  remainingShots,
  totalShots,
  theme,
  pendingUploadCount,
  onClose,
  onCaptureComplete,
}: CameraScreenProps) {
  const [permissionState, setPermissionState] = useState<'initial' | 'requested' | 'granted' | 'denied'>('initial');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Multi-shot queue (base64 strings local to camera session)
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  // When not null, the next capture replaces this index (retake)
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  // UI modes
  const [showReview, setShowReview] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Calculate remaining locally
  const currentRemainingShots = totalShots === null ? remainingShots : Math.max(0, remainingShots - capturedImages.length);

  useEffect(() => {
    // Fullscreen lock
    document.body.style.overflow = 'hidden';
    
    // Preparation delay
    const timer = setTimeout(() => {
      setIsPreparing(false);
    }, 300);
    
    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, []);

  // Flash & Zoom
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [multipleCameras, setMultipleCameras] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setMultipleCameras(videoInputs.length > 1);
    }).catch(() => setMultipleCameras(false));
  }, []);

  const handleUserMedia = useCallback((stream: MediaStream) => {
    setPermissionState('granted');
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities?.();
      // @ts-ignore
      if (capabilities?.torch !== undefined) setFlashSupported(true);
      // @ts-ignore
      if (capabilities?.zoom) setZoomSupported(true);

      // ── DEV DIAGNOSTICS ─────────────────────────────────────────────────────
      // TODO: remove before production
      if (process.env.NODE_ENV === 'development') {
        const settings = track.getSettings();
        console.group('[Camera] Negotiated stream settings');
        console.log(`Resolution : ${settings.width} × ${settings.height}`);
        console.log(`Frame rate : ${settings.frameRate} fps`);
        console.log(`Facing mode: ${settings.facingMode}`);
        // @ts-ignore — zoom/focusMode/torch are non-standard on older TS types
        console.log(`Zoom       : ${settings.zoom ?? 'n/a'}`);
        // @ts-ignore
        console.log(`Focus mode : ${settings.focusMode ?? 'n/a'}`);
        // @ts-ignore
        console.log(`Torch      : ${settings.torch ?? 'n/a'}`);
        console.log('Full settings object:', settings);
        console.groupEnd();
      }
      // ────────────────────────────────────────────────────────────────────────
    }
  }, []);

  const handleUserMediaError = useCallback(() => {
    setPermissionState('denied');
  }, []);

  // Apply torch
  useEffect(() => {
    if (!flashSupported) return;
    const track = (webcamRef.current?.video?.srcObject as MediaStream)?.getVideoTracks()[0];
    if (track?.applyConstraints) {
      // @ts-ignore
      track.applyConstraints({ advanced: [{ torch: flashMode === 'on' }] }).catch(() => {});
    }
  }, [flashMode, flashSupported]);

  // Apply native zoom
  useEffect(() => {
    if (!zoomSupported) return;
    const track = (webcamRef.current?.video?.srcObject as MediaStream)?.getVideoTracks()[0];
    if (track?.applyConstraints) {
      // @ts-ignore
      track.applyConstraints({ advanced: [{ zoom: zoomLevel }] }).catch(() => {});
    }
  }, [zoomLevel, zoomSupported]);

  const handleCapture = useCallback(async () => {
    if (currentRemainingShots === 0 && retakeIndex === null) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    // 1. Shutter Flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 40);

    // 2. Crop to 4:3
    const croppedSrc = await cropImageTo3x4(imageSrc);

    // 3. Update counter & Haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50]);
    }

    if (retakeIndex !== null) {
      // Replace the specific index
      setCapturedImages(prev => {
        const next = [...prev];
        next[retakeIndex] = croppedSrc;
        return next;
      });
      setRetakeIndex(null);
    } else {
      setCapturedImages(prev => [...prev, croppedSrc]);
    }
  }, [currentRemainingShots, retakeIndex]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Review mode callbacks
  const handleRetakeIndex = useCallback((index: number) => {
    setRetakeIndex(index);
    setShowReview(false); // go back to live camera to retake
  }, []);

  const handleUseAll = useCallback((files: File[]) => {
    onCaptureComplete(files);
    setCapturedImages([]);
    setShowReview(false);
    onClose();
  }, [onCaptureComplete, onClose]);

  // Theme
  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  const latestThumbnail = capturedImages.length > 0 ? capturedImages[capturedImages.length - 1] : null;

  // ── Permission screen ──────────────────────────────────────────────────────
  if (permissionState === 'initial') {
    return (
      <div className={`fixed inset-0 z-[1000] h-[100dvh] bg-[#0F0F10] animate-in fade-in zoom-in-95 duration-200 ${themeClass}`}>
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-50 p-3 text-white transition active:scale-[0.97]"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>
        <PermissionScreen onContinue={() => setPermissionState('requested')} />
      </div>
    );
  }

  // ── Preparing screen ───────────────────────────────────────────────────────
  if (isPreparing) {
    return (
      <div className={`fixed inset-0 z-[1000] h-[100dvh] flex flex-col items-center justify-center bg-[#0F0F10] ${themeClass}`}>
         <div className="flex flex-col items-center gap-5 text-white/70">
            <span className="font-semibold tracking-widest text-sm uppercase">AlbumCerita</span>
            <div className="flex items-center gap-3">
               <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
               <span className="text-xs">Preparing Camera...</span>
            </div>
         </div>
      </div>
    );
  }

  // ── Main camera view ───────────────────────────────────────────────────────
  return (
    <div className={`fixed inset-0 z-[1000] h-[100dvh] flex flex-col bg-[#0F0F10] animate-in fade-in zoom-in-[0.98] duration-150 ${themeClass}`}>

      {/* Review Mode overlay */}
      {showReview && (
        <ReviewMode
          images={capturedImages}
          onClose={() => setShowReview(false)}
          onRetakeIndex={handleRetakeIndex}
          onUseAll={handleUseAll}
        />
      )}

      {/* ── Top Controls ── */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        {/* Close */}
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Right controls: flash + flip */}
        <div className="flex gap-2">
          {flashSupported && (
            <button
              onClick={() => setFlashMode(prev => prev === 'off' ? 'on' : 'off')}
              className={`flex flex-col items-center justify-center h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm transition active:scale-[0.97] ${flashMode === 'on' ? 'text-yellow-400' : 'text-white'}`}
              aria-label="Toggle flash"
            >
              {flashMode === 'off' ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </button>
          )}
          {multipleCameras && (
            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
              aria-label="Flip camera"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Viewfinder (4:3) ── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0F0F10] py-2">
        <div className="relative w-full aspect-[3/4] max-h-full bg-black overflow-hidden shadow-2xl ring-1 ring-white/5">
          {permissionState === 'denied' ? (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div>
                <p className="font-semibold text-white mb-2">Camera access denied.</p>
                <p className="text-sm text-white/70">Please enable camera access in your browser settings to take photos.</p>
              </div>
            </div>
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              forceScreenshotSourceSize
              videoConstraints={{
                facingMode,
                width:  { ideal: 4000 },
                height: { ideal: 3000 },
                aspectRatio: { ideal: 0.75 }
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
            />
          )}

          {/* Flash overlay (Shutter blink) */}
          <div 
            className={`absolute inset-0 bg-black z-50 pointer-events-none ${
              isFlashing 
                ? 'opacity-60 transition-none' 
                : 'opacity-0 transition-opacity duration-200 ease-out'
            }`} 
          />

          {/* Retake indicator */}
          {retakeIndex !== null && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[var(--theme-primary)] text-white text-xs font-bold px-4 py-1.5 rounded-full z-40">
              Retaking photo {retakeIndex + 1}
            </div>
          )}

          {/* Roll finished inline overlay */}
          {currentRemainingShots === 0 && retakeIndex === null && (
             <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
               <span className="text-white font-bold text-lg mb-1 tracking-widest">ROLL FINISHED</span>
               <p className="text-white/70 text-xs mb-6">You&apos;ve used all your frames.</p>
               <button 
                  onClick={() => setShowReview(true)}
                  className="bg-[var(--theme-primary)] text-white font-semibold py-3.5 px-8 rounded-full active:scale-[0.97] transition-all shadow-lg"
               >
                 Review Moments
               </button>
             </div>
          )}

          {/* Zoom Controls */}
          {permissionState === 'granted' && zoomSupported && currentRemainingShots > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full p-1 z-30">
              {[0.5, 1, 2].map(level => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={`h-8 w-12 rounded-full text-xs font-semibold transition ${zoomLevel === level ? 'bg-[var(--theme-primary)] text-white' : 'text-white/80'}`}
                >
                  {level}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div
        className="flex items-center justify-between px-6 bg-[#0F0F10] pb-safe"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', minHeight: '112px' }}
      >
        {/* Latest thumbnail — tap to open review */}
        <div className="w-16 h-16">
          {latestThumbnail ? (
            <button
              onClick={() => capturedImages.length > 0 && setShowReview(true)}
              className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/60 transition active:scale-95"
              aria-label="Review captured photos"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={latestThumbnail} alt="Latest" className="h-full w-full object-cover" />
              {capturedImages.length > 1 && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1 rounded">
                  {capturedImages.length}
                </span>
              )}
            </button>
          ) : (
            <div className="w-16 h-16 rounded-xl border-2 border-white/20 bg-white/5 flex items-center justify-center">
              <span className="text-white/20 text-[10px] text-center leading-tight">No<br/>shots</span>
            </div>
          )}
        </div>

        {/* Shutter */}
        <ShutterButton
          onCapture={handleCapture}
          disabled={currentRemainingShots === 0 && retakeIndex === null}
        />

        {/* Film counter */}
        <div className="w-16 flex justify-end">
          <FilmCounter remaining={currentRemainingShots} total={totalShots} />
        </div>
      </div>
    </div>
  );
}

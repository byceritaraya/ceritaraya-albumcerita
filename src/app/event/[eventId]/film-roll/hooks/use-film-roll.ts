import { useState, useRef, useEffect, ChangeEvent, useCallback } from 'react';
import { uploadPhoto, developRoll } from '../../actions';
import { useT } from '@/lib/i18n/use-t';
import { FilmFrame, GlobalMessage } from '../types';
import { FilmRecipeSettings } from '@/lib/film/types';
import { FilmRenderer } from '@/lib/film/FilmRenderer';

export interface UseFilmRollProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  onUploadComplete: () => void;
  filmRecipe?: FilmRecipeSettings | null;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useFilmRoll({
  eventId,
  photosUsed,
  photosPerGuest,
  onUploadComplete,
  filmRecipe,
}: UseFilmRollProps) {
  const { t } = useT();
  const unlimited = photosPerGuest === 0;

  const [unlimitedQueue, setUnlimitedQueue] = useState<FilmFrame[]>([]);
  const [frames, setFrames] = useState<FilmFrame[]>([]);
  const [developmentState, setDevelopmentState] = useState<'idle' | 'review' | 'developing' | 'processed'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<GlobalMessage>(null);
  
  const [captureToast, setCaptureToast] = useState<{ show: boolean, remaining: number }>({ show: false, remaining: 0 });
  const captureToastTimer = useRef<NodeJS.Timeout | null>(null);

  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [preservedScrollY, setPreservedScrollY] = useState<number | null>(null);
  const [retakeJustCompleted, setRetakeJustCompleted] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Always keep a ref to the current frames so the development-complete
  // effect below can access them without a stale closure.
  const framesRef = useRef<FilmFrame[]>(frames);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // Stable recipe key (JSON string) — prevents the effect below from
  // re-firing on mere reference changes to the filmRecipe object.
  const recipeKey = filmRecipe != null ? JSON.stringify(filmRecipe) : null;

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      unlimitedQueue.forEach(f => URL.revokeObjectURL(f.previewUrl));
      frames.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore scroll position after retake
  useEffect(() => {
    if (retakeJustCompleted !== null && preservedScrollY !== null) {
      window.scrollTo({ top: preservedScrollY, behavior: 'instant' });
      setPreservedScrollY(null);
      
      const timer = setTimeout(() => setRetakeJustCompleted(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [retakeJustCompleted, preservedScrollY]);

  // ── Development-complete effect ───────────────────────────────────────────
  // Fires after React commits `developmentState = 'processed'` (i.e., after
  // the FilmProcessing animation calls onComplete). At this point we ensure
  // every frame has processedUrl populated — the exact pixel data the guest
  // sees and the host receives.
  //
  // Why a useEffect here instead of async .then() in the button handler?
  // Because the button-handler approach fires setProcessedUrl from async
  // promises that run concurrently with FilmProcessing's animation. Each
  // setProcessedUrl call re-renders UploadForm, which creates a new onComplete
  // prop, which resets FilmProcessing's final 1000 ms timer — creating a
  // race condition that can prevent or delay onComplete firing.
  //
  // This effect runs AFTER onComplete has already fired and the state has
  // been committed, so there is no interference with the animation.
  useEffect(() => {
    if (developmentState !== 'processed') return;

    const currentFrames = framesRef.current;

    if (!filmRecipe) {
      // No recipe configured — the "processed" result IS the original photo.
      // Set processedUrl = previewUrl so FilmRollReview can display it via the
      // processedUrl branch (keeps the display logic uniform).
      setFrames(prev =>
        prev.map(f => f.processedUrl ? f : { ...f, processedUrl: f.previewUrl })
      );
      return;
    }

    const processFrames = async () => {
      for (const frame of currentFrames) {
        if (frame.processedUrl) continue; // already populated (e.g., from preload)

        try {
          const url = await FilmRenderer.render(frame.id, frame.previewUrl, filmRecipe);
          setFrames(prev =>
            prev.map(f => f.id === frame.id ? { ...f, processedUrl: url } : f)
          );
        } catch (err) {
          console.error('Failed to render frame in review:', err);
          setFrames(prev =>
            prev.map(f =>
              f.id === frame.id && !f.processedUrl
                ? { ...f, status: 'error', errorMsg: 'Failed to process' }
                : f
            )
          );
        }
      }
    };

    processFrames();
    // Intentionally omitting `frames` from deps — we read the snapshot from
    // framesRef to avoid re-firing the effect every time a frame is updated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developmentState, recipeKey]);

  const activeFrames = frames.length;
  const remainingSlots = unlimited ? Infinity : Math.max(0, photosPerGuest - photosUsed - activeFrames);
  const isRollComplete = !unlimited && remainingSlots === 0;

  const showCaptureToast = useCallback((remaining: number) => {
    if (captureToastTimer.current) clearTimeout(captureToastTimer.current);
    setCaptureToast({ show: true, remaining });
    captureToastTimer.current = setTimeout(() => {
      setCaptureToast(prev => ({ ...prev, show: false }));
    }, 2000);
  }, []);

  const handleNativeCapture = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (unlimited) {
      const newFrame: FilmFrame = {
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
        source: 'camera'
      };
      setUnlimitedQueue(prev => [...prev, newFrame]);
      e.target.value = '';
      return;
    }

    if (retakeIndex !== null) {
      setFrames(prev => {
        const next = [...prev];
        URL.revokeObjectURL(next[retakeIndex].previewUrl);
        next[retakeIndex] = {
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(file),
          status: 'queued',
          source: 'camera'
        };
        return next;
      });
      setRetakeJustCompleted(retakeIndex);
      setRetakeIndex(null);
    } else {
      if (remainingSlots > 0) {
        const newFrame: FilmFrame = {
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(file),
          status: 'queued',
          source: 'camera'
        };
        setFrames(prev => [...prev, newFrame]);
        showCaptureToast(remainingSlots - 1);
      }
    }
    e.target.value = '';
  }, [unlimited, retakeIndex, remainingSlots, showCaptureToast]);

  const handleGalleryImport = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toAdd = Array.from(files).slice(0, unlimited ? files.length : remainingSlots);
    const skipped = files.length - toAdd.length;

    if (skipped > 0) {
      setGlobalMessage({
        type: 'error',
        text: t.upload.quotaReached(toAdd.length, skipped),
      });
    }

    const newFrames: FilmFrame[] = toAdd.map(file => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
      source: 'gallery'
    }));

    if (unlimited) {
      setUnlimitedQueue(prev => [...prev, ...newFrames]);
    } else {
      setFrames(prev => [...prev, ...newFrames]);
      if (toAdd.length > 0) {
         showCaptureToast(remainingSlots - toAdd.length);
      }
    }

    e.target.value = '';
  }, [unlimited, remainingSlots, showCaptureToast, t.upload]);

  const triggerRetake = useCallback((index: number) => {
    setRetakeIndex(index);
    setPreservedScrollY(window.scrollY);
    cameraInputRef.current?.click();
  }, []);

  const removeUnlimitedShot = useCallback((id: string) => {
    setUnlimitedQueue(prev => {
      const shot = prev.find((s) => s.id === id);
      if (shot) URL.revokeObjectURL(shot.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const handleUploadBatch = useCallback(async (isUnlimitedFlow: boolean) => {
    const targetQueue = isUnlimitedFlow ? unlimitedQueue : frames;
    const toUpload = targetQueue.filter(f => f.status === 'queued' || f.status === 'error');
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setGlobalMessage(null);

    let successCount = 0;
    let failCount = 0;

    const setQueueState = isUnlimitedFlow ? setUnlimitedQueue : setFrames;

    // Phase 1: Pre-process all photos and immediately update their processedUrl in state
    const processedFiles: { frameId: string; file: File }[] = [];
    let processingFailed = false;

    for (const frame of toUpload) {
      setQueueState(prev =>
        prev.map(f => (f.id === frame.id ? { ...f, status: 'uploading', errorMsg: undefined } : f))
      );

      try {
        let fileToUpload = frame.file;
        if (filmRecipe) {
          let processedBlobUrl = frame.processedUrl;
          if (!processedBlobUrl) {
            processedBlobUrl = await FilmRenderer.render(frame.id, frame.previewUrl, filmRecipe);
            // Store the rendered blob URL back into the frame immediately so the
            // review UI can display the processed image before upload finishes.
            setQueueState(prev =>
              prev.map(f => (f.id === frame.id ? { ...f, processedUrl: processedBlobUrl } : f))
            );
          }
          const res = await fetch(processedBlobUrl);
          const blob = await res.blob();
          fileToUpload = new File([blob], frame.file.name, { type: 'image/jpeg' });
        }
        processedFiles.push({ frameId: frame.id, file: fileToUpload });
      } catch (renderErr) {
        console.error('Failed to process photo:', renderErr);
        processingFailed = true;
        break;
      }
    }

    if (processingFailed) {
      setQueueState(prev =>
        prev.map(f => (toUpload.some(u => u.id === f.id) ? { ...f, status: 'error', errorMsg: 'Failed to process film recipe. Development aborted.' } : f))
      );
      setGlobalMessage({ type: 'error', text: 'Film processing failed. Development aborted to prevent partial roll.' });
      setIsUploading(false);
      return;
    }

    // Phase 2a: Acquire the server-side development gate (film roll only).
    // This is an atomic operation: only the first call with roll_developed_at IS NULL
    // succeeds. Any second attempt — from a replay, duplicate tab, or direct API
    // call — is rejected here before any photo reaches storage.
    if (!isUnlimitedFlow) {
      const gateResult = await developRoll(eventId);
      if (gateResult.error) {
        setQueueState(prev =>
          prev.map(f => (toUpload.some(u => u.id === f.id) ? { ...f, status: 'error', errorMsg: gateResult.error } : f))
        );
        setGlobalMessage({ type: 'error', text: gateResult.error });
        setIsUploading(false);
        return;
      }
    }

    // Phase 2b: Upload all processed photos
    for (const { frameId, file } of processedFiles) {
      try {
        const formData = new FormData();
        formData.append('photo', file);
        const result = await uploadPhoto(eventId, {}, formData);

        if (result.error) {
          setQueueState(prev =>
            prev.map(f => (f.id === frameId ? { ...f, status: 'error', errorMsg: result.error } : f))
          );
          failCount++;
        } else {
          setQueueState(prev =>
            prev.map(f => (f.id === frameId ? { ...f, status: 'done' } : f))
          );
          successCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.upload.uploadError;
        setQueueState(prev =>
          prev.map(f => (f.id === frameId ? { ...f, status: 'error', errorMsg: msg } : f))
        );
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      const successText = isUnlimitedFlow 
        ? (successCount === 1 ? t.upload.successSingle : t.upload.successMultiple(successCount))
        : t.filmRoll.rollShared;

      setGlobalMessage({
        type: failCount > 0 ? 'error' : 'success',
        text: failCount > 0
          ? t.upload.partialFail(successCount, failCount)
          : successText,
      });

      if (failCount === 0) {
        setTimeout(() => {
          setGlobalMessage(null);
          if (!isUnlimitedFlow) {
            frames.forEach(f => URL.revokeObjectURL(f.previewUrl));
            setFrames([]);
            FilmRenderer.clearCache();
            setDevelopmentState('idle');
          }
          onUploadComplete();
        }, 1500);
      } else {
        onUploadComplete();
      }
    } else if (failCount > 0) {
      setGlobalMessage({ type: 'error', text: t.upload.allFailed });
    }
  }, [unlimitedQueue, frames, eventId, onUploadComplete, t]);

  return {
    unlimited,
    unlimitedQueue,
    frames,
    developmentState,
    setDevelopmentState,
    isUploading,
    globalMessage,
    captureToast,
    retakeJustCompleted,
    cameraInputRef,
    galleryInputRef,
    remainingSlots,
    isRollComplete,
    activeFrames,
    handleNativeCapture,
    handleGalleryImport,
    triggerRetake,
    removeUnlimitedShot,
    handleUploadBatch,
  };
}

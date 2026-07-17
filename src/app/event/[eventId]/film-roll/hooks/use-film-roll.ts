import { useState, useRef, useEffect, ChangeEvent, useCallback } from 'react';
import { uploadPhoto } from '../../actions';
import { useT } from '@/lib/i18n/use-t';
import { FilmFrame, GlobalMessage } from '../types';

export interface UseFilmRollProps {
  eventId: string;
  photosUsed: number;
  photosPerGuest: number;
  onUploadComplete: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useFilmRoll({
  eventId,
  photosUsed,
  photosPerGuest,
  onUploadComplete,
}: UseFilmRollProps) {
  const { t } = useT();
  const unlimited = photosPerGuest === 0;

  const [unlimitedQueue, setUnlimitedQueue] = useState<FilmFrame[]>([]);
  const [frames, setFrames] = useState<FilmFrame[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<GlobalMessage>(null);
  
  const [captureToast, setCaptureToast] = useState<{ show: boolean, remaining: number }>({ show: false, remaining: 0 });
  const captureToastTimer = useRef<NodeJS.Timeout | null>(null);

  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [preservedScrollY, setPreservedScrollY] = useState<number | null>(null);
  const [retakeJustCompleted, setRetakeJustCompleted] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

    for (const frame of toUpload) {
      setQueueState(prev =>
        prev.map(f => (f.id === frame.id ? { ...f, status: 'uploading', errorMsg: undefined } : f))
      );

      try {
        const formData = new FormData();
        formData.append('photo', frame.file);
        const result = await uploadPhoto(eventId, {}, formData);

        if (result.error) {
          setQueueState(prev =>
            prev.map(f => (f.id === frame.id ? { ...f, status: 'error', errorMsg: result.error } : f))
          );
          failCount++;
        } else {
          setQueueState(prev =>
            prev.map(f => (f.id === frame.id ? { ...f, status: 'done' } : f))
          );
          successCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.upload.uploadError;
        setQueueState(prev =>
          prev.map(f => (f.id === frame.id ? { ...f, status: 'error', errorMsg: msg } : f))
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
            setFrames([]);
            setShowReview(false);
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
    showReview,
    setShowReview,
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

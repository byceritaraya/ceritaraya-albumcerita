'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FilmRecipeSettings } from './types';
import { FilmRenderer } from './FilmRenderer';

export interface FilmImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photoId: string;
  src: string;
  recipeSettings?: FilmRecipeSettings | null;
}

/**
 * FilmImage — smart img wrapper that applies a FilmRecipe via the FilmRenderer.
 *
 * Improvements over the naive implementation:
 *
 * 1. **Lazy rendering** — uses IntersectionObserver to delay the render job
 *    until the image is near the viewport (300 px rootMargin). Images that
 *    are far off-screen do not consume queue slots.
 *
 * 2. **Stable deps** — `recipeSettings` is compared by value (JSON.stringify)
 *    rather than by reference, so a parent re-render that produces a new
 *    object with the same values will not trigger a redundant render.
 *
 * 3. **Single DOM element** — a single <img> ref is maintained throughout
 *    the component's lifetime, so the IntersectionObserver target never
 *    changes underneath us.
 *
 * 4. **No Blob URL ownership** — rendered Blob URLs are owned by FilmRenderer's
 *    cache. This component never calls URL.revokeObjectURL() directly.
 *    Cleanup is handled by FilmRenderer.clearCache() at a higher level.
 */
export function FilmImage({ photoId, src, recipeSettings, className, alt, ...props }: FilmImageProps) {
  const [renderedSrc, setRenderedSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ── Intersection Observer ─────────────────────────────────────────────────
  // Trigger rendering only when the image is within 300 px of the viewport.
  // Once visible, we disconnect — no need to keep observing after the first hit.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // deliberate empty deps — we only want to observe the mounted element once

  // ── Render effect ─────────────────────────────────────────────────────────
  // Stringify the recipe to create a value-stable dep. If the parent re-renders
  // with a new object reference but identical values, this string is unchanged
  // and the effect does not re-fire.
  const recipeKey = recipeSettings != null ? JSON.stringify(recipeSettings) : null;

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    if (!recipeSettings) {
      // No recipe — just show the original.
      setRenderedSrc(src);
      return;
    }

    FilmRenderer.render(photoId, src, recipeSettings)
      .then((url) => {
        if (!cancelled) setRenderedSrc(url);
      })
      .catch((err) => {
        console.error('[FilmImage] render failed, falling back to original:', err);
        if (!cancelled) setRenderedSrc(src);
      });

    return () => {
      cancelled = true;
    };
    // recipeKey replaces recipeSettings in the dep array to avoid
    // re-firing on new-reference-but-same-value object props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, photoId, src, recipeKey]);

  // ── Render ────────────────────────────────────────────────────────────────
  // A single <img> element maintained throughout the component lifetime.
  // Before the render is ready, we show the original at reduced opacity/blur
  // as a placeholder that makes the layout feel responsive.
  const isReady = renderedSrc !== null;

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={isReady ? renderedSrc! : src}
        alt={alt}
        className={`w-full h-full object-cover ${
          isReady
            ? 'transition-opacity duration-300'
            : 'opacity-50 blur-sm transition-all duration-300'
        }`}
        {...props}
      />
      {renderedSrc === src && (
        <div className="absolute inset-0 border-4 border-red-500 flex items-center justify-center bg-red-500/20 z-10">
          <span className="bg-red-500 text-white font-bold px-2 py-1 text-xs uppercase tracking-widest">Fallback</span>
        </div>
      )}
    </div>
  );
}

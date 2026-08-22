'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  children: React.ReactNode[];
}

const TRANSITION_DURATION = 600; // ms

export function SectionNavigation({ children }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartY = useRef<number | null>(null);
  
  const totalSections = React.Children.count(children);

  const navigateTo = useCallback((newIndex: number) => {
    if (isTransitioning) return;
    if (newIndex < 0 || newIndex >= totalSections) return;
    if (newIndex === activeIndex) return;

    setIsTransitioning(true);
    setActiveIndex(newIndex);

    setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, [activeIndex, isTransitioning, totalSections]);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Prevent default scrolling
    e.preventDefault();
    
    if (isTransitioning) return;

    // Use a small threshold to avoid hyper-sensitive trackpads
    if (e.deltaY > 30) {
      navigateTo(activeIndex + 1);
    } else if (e.deltaY < -30) {
      navigateTo(activeIndex - 1);
    }
  }, [activeIndex, isTransitioning, navigateTo]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent default scroll on touch devices when full-screen snapping
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartY.current === null) return;
    if (isTransitioning) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    // Minimum swipe distance
    if (deltaY > 50) {
      // Swipe Up -> Next
      navigateTo(activeIndex + 1);
    } else if (deltaY < -50) {
      // Swipe Down -> Prev
      navigateTo(activeIndex - 1);
    }

    touchStartY.current = null;
  }, [activeIndex, isTransitioning, navigateTo]);

  useEffect(() => {
    // We attach passive: false so we can preventDefault to block native scrolling
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // If children change drastically, ensure we're not out of bounds
  useEffect(() => {
    if (activeIndex >= totalSections && totalSections > 0) {
      setActiveIndex(totalSections - 1);
    }
  }, [activeIndex, totalSections]);

  if (totalSections === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-stone-50 text-stone-500">No sections enabled.</div>;
  }

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-stone-100">
      <div 
        className="w-full h-full transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)]"
        style={{ 
          transform: `translateY(-${activeIndex * 100}%)`,
          transitionDuration: `${TRANSITION_DURATION}ms` 
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="w-full h-[100svh]">
            {child}
          </div>
        ))}
      </div>
      
      {/* Navigation Indicators */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {React.Children.map(children, (_, index) => (
          <button
            key={index}
            onClick={() => navigateTo(index)}
            aria-label={`Go to section ${index + 1}`}
            className="p-2"
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-stone-800 scale-150' : 'bg-stone-400 opacity-50'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

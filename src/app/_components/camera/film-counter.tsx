'use client';

import { useEffect, useState, useRef } from 'react';

export function FilmCounter({ remaining, total }: { remaining: number; total: number | null }) {
  if (total === null || total === 0) return null;
  
  // To create a mechanical rolling animation, we map through digits
  const paddedRemaining = remaining.toString().padStart(2, '0');
  
  // Track previous for animation direction if we want, but simple translate based on digit works well.
  
  let label = "FRAMES REMAINING";
  let colorClass = "text-[var(--theme-primary)]";
  
  if (remaining === 1) {
    label = "LAST FRAME";
    colorClass = "text-amber-500";
  } else if (remaining === 0) {
    label = "ROLL FINISHED";
    colorClass = "text-red-500";
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`text-[10px] font-bold tracking-widest mb-1.5 transition-colors duration-300 ${colorClass}`}>
        {label}
      </div>
      
      <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 overflow-hidden shadow-inner">
        {/* Mechanical counter display */}
        <div className="flex gap-1 font-mono text-xl font-bold tracking-tight text-white/90">
          <DigitScroller digit={paddedRemaining[0]} />
          <DigitScroller digit={paddedRemaining[1]} />
        </div>
      </div>
    </div>
  );
}

function DigitScroller({ digit }: { digit: string }) {
  // Mechanical scroll: we have a column of 0-9 and translate it.
  const targetNumber = parseInt(digit, 10);
  
  return (
    <div className="relative h-7 w-4 overflow-hidden leading-7">
      <div 
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: `translateY(-${targetNumber * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <span key={n} className="h-7 flex items-center justify-center">{n}</span>
        ))}
      </div>
    </div>
  );
}

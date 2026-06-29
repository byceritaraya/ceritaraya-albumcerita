'use client';

import { useState, useEffect } from 'react';
import { clearHostWelcomeModal } from './actions';

export function HostWelcome({ 
  slug,
  hostName,
  theme
}: { 
  slug: string;
  hostName: string;
  theme?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = async () => {
    setIsOpen(false);
    await clearHostWelcomeModal(slug);
  };

  if (!isOpen) return null;

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--text-primary)]/80 backdrop-blur-sm p-4 ${themeClass}`}>
      <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-heading text-3xl text-[var(--text-primary)] mb-4 leading-tight">
          Welcome to your own moments, {hostName}.
        </h2>
        
        <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          <p>
            This is where memories captured by your guests come together. Review, curate, and share the best moments.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
        >
          Let's go
        </button>
      </div>
    </div>
  );
}

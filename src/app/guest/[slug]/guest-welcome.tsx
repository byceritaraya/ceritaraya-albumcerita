'use client';

import { useState, useEffect } from 'react';
import { clearWelcomeModal } from './actions';

export function GuestWelcome({ 
  contributorId, 
  contributorName, 
  eventName, 
  hostName,
  theme
}: { 
  contributorId: string;
  contributorName: string;
  eventName: string;
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
    await clearWelcomeModal(contributorId);
  };

  if (!isOpen) return null;

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--text-primary)]/80 backdrop-blur-sm p-4 ${themeClass}`}>
      <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-heading text-3xl text-[var(--text-primary)] mb-4 leading-tight">
          Hi, {contributorName} 👋
        </h2>
        
        <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          <p>
            You&apos;ve been invited to be a Moment Taker at <strong>{eventName}</strong>.
          </p>
          <p>
            Your photos will help tell the story of this special day from your unique perspective. Capture the moments, share your point of view, and help create memories everyone will cherish.
          </p>
          <p>
            Before sharing, please take a quick look at your photos and keep only the moments you&apos;d be proud to include in the final album. All submitted moments will be curated by <strong>{hostName}</strong> before the album is published.
          </p>
          <p className="font-medium text-[var(--text-primary)] pt-2">
            Give it your best shot. 📸
          </p>
        </div>

        <button 
          onClick={handleClose}
          className="w-full bg-[var(--theme-primary)] text-white font-medium py-3.5 rounded-xl hover:bg-[var(--theme-secondary)] transition-colors"
        >
          Let&apos;s Capture Moments
        </button>
      </div>
    </div>
  );
}

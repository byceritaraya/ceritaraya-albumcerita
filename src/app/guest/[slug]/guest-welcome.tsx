'use client';

import { useState, useEffect } from 'react';
import { clearWelcomeModal } from './actions';
import { useT } from '@/lib/i18n/use-t';

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
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(true);

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

  const invited = t.guestWelcome.invited(eventName).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const review = t.guestWelcome.review(hostName).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center pb-[10dvh] p-6 ${themeClass}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] from-20% via-[var(--bg-primary)] via-50% to-transparent pointer-events-none" />
      <div className="relative w-full max-w-md ac-modal-enter text-center">
        <h2 className="font-heading text-3xl text-[var(--text-primary)] mb-5 leading-tight">
          {t.guestWelcome.greeting(contributorName)}
        </h2>

        <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          <p dangerouslySetInnerHTML={{ __html: invited }} />
          <p>{t.guestWelcome.role}</p>
          <p dangerouslySetInnerHTML={{ __html: review }} />
          <p className="font-medium text-[var(--text-primary)] pt-1">
            {t.guestWelcome.encouragement}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
        >
          {t.guestWelcome.cta}
        </button>
      </div>
    </div>
  );
}

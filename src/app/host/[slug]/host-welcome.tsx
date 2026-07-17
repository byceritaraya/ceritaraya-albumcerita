'use client';

import { useState, useEffect } from 'react';
import { clearHostWelcomeModal } from './actions';
import { useT } from '@/lib/i18n/use-t';

export function HostWelcome({
  slug,
  hostName,
  theme
}: {
  slug: string;
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
    await clearHostWelcomeModal(slug);
  };

  if (!isOpen) return null;

  const APPROVED_THEMES = ['Sage', 'Blush', 'Slate', 'Sand', 'Mauve', 'Ivory'];
  const safeTheme = theme && APPROVED_THEMES.includes(theme) ? theme : 'Sage';
  const themeClass = `theme-${safeTheme.toLowerCase()}`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--text-primary)]/80 backdrop-blur-sm p-4 ${themeClass}`}>
      <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-3xl p-8 shadow-2xl ac-modal-enter">
        <h2 className="font-heading text-3xl text-[var(--text-primary)] mb-4 leading-tight">
          {t.hostWelcome.greeting(hostName)}
        </h2>

        <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          <p>{t.hostWelcome.description}</p>
        </div>

        <button
          onClick={handleClose}
          className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 text-sm font-semibold text-white transition-all hover:bg-[var(--theme-secondary)] active:scale-[0.97]"
        >
          {t.hostWelcome.cta}
        </button>
      </div>
    </div>
  );
}

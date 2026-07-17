'use client';

import { Fragment, useState } from 'react';
import { useT } from '@/lib/i18n/use-t';
import type { Lang } from '@/lib/i18n/context';

interface LangSwitcherProps {
  /** visual variant — 'menu' opens a popover, 'inline' shows both options */
  variant?: 'menu' | 'inline';
  /** applied to the trigger button */
  className?: string;
}

export function LangSwitcher({ variant = 'menu', className = '' }: LangSwitcherProps) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);

  const options: { value: Lang; label: string }[] = [
    { value: 'id', label: t.langSwitcher.id },
    { value: 'en', label: t.langSwitcher.en },
  ];

  const current = options.find(o => o.value === lang) ?? options[0];

  if (variant === 'inline') {
    const codes: { value: Lang; code: string }[] = [
      { value: 'id', code: 'ID' },
      { value: 'en', code: 'EN' },
    ];
    return (
      <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 bg-black/5 ${className}`}>
        {codes.map((opt, i) => (
          <Fragment key={opt.value}>
            {i > 0 && <span className="text-[var(--text-muted)] text-[10px] select-none">·</span>}
            <button
              onClick={() => setLang(opt.value)}
              aria-pressed={lang === opt.value}
              className={`text-[11px] font-semibold px-1 leading-none transition-colors rounded ${
                lang === opt.value
                  ? 'text-[var(--theme-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {opt.code}
            </button>
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        id="lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.langSwitcher.label}
      >
        <span>{current.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            role="listbox"
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                role="option"
                aria-selected={lang === opt.value}
                onClick={() => { setLang(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                  lang === opt.value
                    ? 'bg-[var(--theme-primary)]/10 font-semibold text-[var(--theme-primary)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <span>{opt.label}</span>
                {lang === opt.value && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="ml-auto h-4 w-4 text-[var(--theme-primary)]">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

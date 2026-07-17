'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import en, { type Translations } from '@/locales/en';
import id from '@/locales/id';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'id';

const LOCALES: Record<Lang, Translations> = { en, id };
const COOKIE_NAME = 'ac_lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContextValue {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'id',
  t: id,
  setLang: () => {},
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read the `ac_lang` cookie on the client. Returns null if not set. */
function readLangCookie(): Lang | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)ac_lang=([^;]+)/);
  if (!match) return null;
  const val = match[1];
  return val === 'en' || val === 'id' ? val : null;
}

/** Write the `ac_lang` cookie on the client. */
function writeLangCookie(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Detect preferred language from the browser.
 * Defaults to 'id' (Indonesian) — our primary market.
 * Returns 'en' only when the browser explicitly prefers English.
 */
function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'id';
  const primary = navigator.languages?.[0] ?? navigator.language ?? '';
  return primary.toLowerCase().startsWith('en') ? 'en' : 'id';
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface I18nProviderProps {
  /** Language pre-resolved from the `ac_lang` cookie on the server. */
  initialLang?: Lang;
  children: ReactNode;
}

export function I18nProvider({ initialLang, children }: I18nProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => {
    // Priority: server cookie → browser detection → 'id'
    return initialLang ?? 'id';
  });

  // On first client render — resolve from cookie or browser (handles hydration)
  useEffect(() => {
    const cookieLang = readLangCookie();
    if (cookieLang) {
      setLangState(cookieLang);
    } else {
      const detected = detectBrowserLang();
      setLangState(detected);
      writeLangCookie(detected);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeLangCookie(next);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t: LOCALES[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n() {
  return useContext(I18nContext);
}

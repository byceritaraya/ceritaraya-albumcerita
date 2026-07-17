'use client';

import { useT } from '@/lib/i18n/use-t';

interface LangSwitcherProps {
  className?: string;
  /** Use 'dark' variant when placed on top of a dark/photo background (e.g. hero overlay) */
  variant?: 'light' | 'dark';
}

export function LangSwitcher({ className = '', variant = 'light' }: LangSwitcherProps) {
  const { lang, setLang } = useT();

  const toggleLang = () => {
    setLang(lang === 'en' ? 'id' : 'en');
  };

  const code = lang.toUpperCase();

  // Light: matches the h-7 avatar circle in the top bar, uses theme color
  // Dark: sits on cover photo, white pill with backdrop blur
  const variantClass =
    variant === 'dark'
      ? 'h-7 bg-white/20 text-white border border-white/30 hover:bg-white/35 backdrop-blur-sm'
      : 'h-7 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/15 hover:bg-[var(--theme-primary)]/20';

  return (
    <button
      onClick={toggleLang}
      className={`inline-flex items-center justify-center rounded-full px-3 text-xs font-bold tracking-wider transition-all active:scale-95 ${variantClass} ${className}`}
      aria-label="Toggle language"
    >
      {code}
    </button>
  );
}

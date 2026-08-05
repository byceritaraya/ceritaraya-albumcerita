'use client';

import { useT } from '@/lib/i18n/use-t';

interface LangSwitcherProps {
  className?: string;
  appearance?: 'light' | 'dark';
}

export function LangSwitcher({ className = '', appearance = 'light' }: LangSwitcherProps) {
  const { lang, setLang } = useT();

  const toggleLang = () => {
    setLang(lang === 'en' ? 'id' : 'en');
  };

  const code = lang.toUpperCase();

  const isDarkContext = appearance === 'dark';
  
  return (
    <button
      onClick={toggleLang}
      className={`flex items-center justify-center h-[28px] px-2.5 rounded-full backdrop-blur-md border text-[10px] font-medium tracking-widest transition-all active:scale-95 ${
        isDarkContext 
          ? 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:text-white' 
          : 'bg-[var(--text-primary)]/5 border-[var(--text-primary)]/10 text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10'
      } ${className}`}
      aria-label="Toggle language"
    >
      {code}
    </button>
  );
}

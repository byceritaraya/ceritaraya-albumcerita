import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function ArunikaLayout({ children }: Props) {
  return (
    <div className="flex w-full h-[100svh] bg-stone-900 overflow-hidden font-sans">
      
      {/* 
        Desktop / Landscape Static Left Visual
        Hidden on mobile portrait, shown on md screens and up.
        This is a placeholder for Arunika's final visual identity.
      */}
      <div className="hidden md:flex flex-1 relative bg-stone-800 items-center justify-center overflow-hidden border-r border-stone-700/50">
        <div className="absolute inset-0 z-0">
          {/* Subtle placeholder pattern or background */}
          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 opacity-80" />
        </div>
        <div className="relative z-10 text-center text-stone-300 p-12 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-serif mb-6 text-stone-100">Arunika</h1>
          <p className="text-sm lg:text-base text-stone-400 font-light leading-relaxed tracking-wide">
            Sebuah harmoni antara tradisi dan modernitas. Elegansi yang abadi, disajikan dalam kesederhanaan yang bermakna.
          </p>
        </div>
      </div>

      {/* 
        Dynamic Right Viewport 
        Full width on mobile, max-width on desktop.
      */}
      <div className="w-full md:w-[480px] lg:w-[540px] h-[100svh] flex-shrink-0 bg-stone-50 relative shadow-2xl">
        {children}
      </div>

    </div>
  );
}

export function ShutterButton({ onCapture, disabled }: { onCapture: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[4px] p-1 transition-all duration-150 ${
        disabled 
          ? 'border-[var(--text-secondary)]/30 cursor-not-allowed' 
          : 'border-white hover:scale-[1.02] active:scale-[0.97] active:border-white/80'
      }`}
      aria-label="Take photo"
    >
      <div className={`h-full w-full rounded-full transition-colors duration-150 ${disabled ? 'bg-[var(--text-secondary)]/20' : 'bg-[var(--theme-primary)] active:bg-[var(--theme-primary)]/80'}`} />
    </button>
  );
}

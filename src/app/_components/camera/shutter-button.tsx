export function ShutterButton({ onCapture, disabled }: { onCapture: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[4px] p-1 transition-all ${
        disabled 
          ? 'border-[var(--text-secondary)]/30 cursor-not-allowed' 
          : 'border-[var(--text-primary)] hover:scale-105 active:scale-95 active:border-[var(--text-primary)]/80'
      }`}
      aria-label="Take photo"
    >
      <div className={`h-full w-full rounded-full transition-colors ${disabled ? 'bg-[var(--text-secondary)]/20' : 'bg-[var(--theme-primary)] active:bg-[var(--theme-secondary)]'}`} />
    </button>
  );
}

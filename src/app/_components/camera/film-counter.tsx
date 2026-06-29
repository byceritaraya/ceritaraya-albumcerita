export function FilmCounter({ remaining, total }: { remaining: number; total: number | null }) {
  if (total === null || total === 0) return null;
  
  const paddedRemaining = remaining.toString().padStart(2, '0');
  const paddedTotal = total.toString().padStart(2, '0');
  
  return (
    <div className="flex flex-col items-end">
      {remaining === 0 && (
        <span className="text-[10px] font-bold text-red-500 tracking-wider mb-0.5">OUT OF FILM</span>
      )}
      <div className={`font-mono text-sm font-semibold tracking-wider px-3 py-1.5 rounded-lg border ${remaining === 0 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/30 text-[var(--theme-primary)]'}`}>
        {paddedRemaining} / {paddedTotal} <span className="text-[10px] ml-1">SHOTS</span>
      </div>
    </div>
  );
}

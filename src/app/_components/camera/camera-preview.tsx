export function CameraPreview({ 
  imageSrc, 
  onRetake, 
  onUse 
}: { 
  imageSrc: string; 
  onRetake: () => void; 
  onUse: () => void; 
}) {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--bg-primary)] animate-in fade-in duration-200">
      <div className="relative flex-1 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      
      <div className="flex h-32 items-center justify-between px-8 bg-[var(--bg-primary)]">
        <button
          onClick={onRetake}
          className="text-base font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2"
        >
          Retake
        </button>
        <button
          onClick={onUse}
          className="rounded-full bg-[var(--theme-primary)] px-8 py-3.5 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          Use Photo
        </button>
      </div>
    </div>
  );
}

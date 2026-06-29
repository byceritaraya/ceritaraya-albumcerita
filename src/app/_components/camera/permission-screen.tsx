export function PermissionScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[var(--text-primary)]">
      <div className="mb-8 rounded-full bg-[var(--theme-primary)]/10 p-6 text-[var(--theme-primary)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
          <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="mb-4 text-2xl font-bold leading-tight">AlbumCerita membutuhkan akses kamera untuk mengabadikan momen.</h2>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Izinkan akses kamera di pop-up selanjutnya untuk mulai memotret.
      </p>
      <button
        onClick={onContinue}
        className="flex h-14 w-full items-center justify-center rounded-full bg-[var(--theme-primary)] px-6 font-semibold text-white transition active:scale-95"
      >
        Continue
      </button>
    </div>
  );
}

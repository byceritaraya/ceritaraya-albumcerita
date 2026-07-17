export type ShotStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface FilmFrame {
  id: string;
  file: File;
  previewUrl: string;
  status: ShotStatus;
  errorMsg?: string;
  source: 'camera' | 'gallery';
  // filmStockId?: string; // Future Sprint 3F hook
}

export type GlobalMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

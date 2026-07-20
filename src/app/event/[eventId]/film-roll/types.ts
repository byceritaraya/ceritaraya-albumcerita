export type ShotStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface FilmFrame {
  id: string;
  file: File;
  previewUrl: string;
  /** The already-rendered processed blob URL. Set after FilmRenderer.render() completes.
   *  This is the exact same pixel data that is uploaded to the server. */
  processedUrl?: string;
  status: ShotStatus;
  errorMsg?: string;
  source: 'camera' | 'gallery';
  // filmStockId?: string; // Future Sprint 3F hook
}

export type GlobalMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

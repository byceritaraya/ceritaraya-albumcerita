import { FilmRecipeSettings } from './types';
import { Processor } from './processors/Processor';
import { BaseAdjustmentProcessor } from './processors/BaseAdjustmentProcessor';
import { GrainProcessor } from './processors/GrainProcessor';
import { HalationProcessor } from './processors/HalationProcessor';
import { VignetteProcessor } from './processors/VignetteProcessor';

// ─── Cache ─────────────────────────────────────────────────────────────────────

const RENDERER_VERSION = 'v1';

/**
 * Maximum number of rendered Blob URLs kept in memory.
 * When the limit is reached, the oldest entry is evicted and its Blob URL revoked.
 * Map preserves insertion order, so `keys().next().value` yields the oldest key.
 */
const MAX_CACHE_SIZE = 60;

/** Module-level cache: cacheKey → Object URL */
const renderCache = new Map<string, string>();

function buildCacheKey(photoId: string, settings: FilmRecipeSettings): string {
  return `${photoId}_${JSON.stringify(settings)}_${RENDERER_VERSION}`;
}

function cacheSet(key: string, url: string): void {
  // Evict the oldest entry when the cache is full.
  if (renderCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = renderCache.keys().next().value as string;
    const oldUrl = renderCache.get(oldestKey);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    renderCache.delete(oldestKey);
  }
  renderCache.set(key, url);
}

// ─── Queue ─────────────────────────────────────────────────────────────────────

interface RenderTask {
  photoId: string;
  imageSource: string;
  settings: FilmRecipeSettings;
  resolve: (url: string) => void;
  reject: (err: unknown) => void;
}

// ─── FilmRenderer ───────────────────────────────────────────────────────────────

export class FilmRenderer {
  private static readonly processors: Processor[] = [
    new BaseAdjustmentProcessor(),
    new GrainProcessor(),
    new HalationProcessor(),
    new VignetteProcessor(),
  ];

  private static readonly queue: RenderTask[] = [];
  private static readonly MAX_CONCURRENCY = 2;
  private static activeWorkers = 0;

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Render a photo through the Film Recipe pipeline.
   * Returns a Blob URL. Repeated calls with the same arguments return
   * the cached URL without re-rendering.
   *
   * PUBLIC API — signature must not change.
   */
  static async render(photoId: string, imageSource: string, settings: FilmRecipeSettings): Promise<string> {
    const cacheKey = buildCacheKey(photoId, settings);

    if (renderCache.has(cacheKey)) {
      return renderCache.get(cacheKey)!;
    }

    return new Promise<string>((resolve, reject) => {
      this.queue.push({
        photoId,
        imageSource,
        settings,
        resolve: (url) => {
          cacheSet(cacheKey, url);
          resolve(url);
        },
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Eagerly render a photo into the cache without blocking.
   * Call this to start rendering in the background while a UI animation plays.
   *
   * PUBLIC API — signature must not change.
   */
  static preload(photoId: string, imageSource: string, settings: FilmRecipeSettings): void {
    this.render(photoId, imageSource, settings).catch(() => {
      // Silently ignore errors — preload is best-effort.
    });
  }

  /**
   * Revoke all cached Blob URLs and clear the cache.
   * Call this when the consuming component unmounts to prevent memory leaks.
   */
  static clearCache(): void {
    for (const url of renderCache.values()) {
      URL.revokeObjectURL(url);
    }
    renderCache.clear();
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  private static processQueue(): void {
    if (this.activeWorkers >= this.MAX_CONCURRENCY || this.queue.length === 0) {
      return;
    }

    this.activeWorkers++;
    const task = this.queue.shift()!;

    this.executeRender(task.imageSource, task.settings)
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        this.activeWorkers--;
        this.processQueue(); // drain the next task
      });
  }

  private static executeRender(imageSource: string, settings: FilmRecipeSettings): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin for remote URLs — blob: and data: URLs are
      // same-origin by definition and setting crossOrigin on them causes
      // the browser to reject the load or taint the canvas.
      if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          for (const processor of this.processors) {
            await processor.process(canvas, ctx, settings, tempCanvas);
          }

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error('canvas.toBlob returned null'));
              }
            },
            'image/jpeg',
            0.9,
          );
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${imageSource}`));
      };
      
      img.src = imageSource;
    });
  }
}

import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class BaseAdjustmentProcessor implements Processor {
  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    tempCanvas: HTMLCanvasElement
  ): Promise<void> {
    const { brightness, contrast, saturation, warmth } = settings;

    // Use direct pixel manipulation because ctx.filter is notoriously buggy 
    // or entirely ignored on many mobile browsers (especially Safari).
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const sepiaIntensity = warmth > 0 ? Math.min(warmth, 100) / 100 : 0;
    const hasPixelChanges = brightness !== 1.0 || contrast !== 1.0 || saturation !== 1.0 || sepiaIntensity > 0;

    if (hasPixelChanges) {
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Brightness
        if (brightness !== 1.0) {
          r *= brightness;
          g *= brightness;
          b *= brightness;
        }

        // 2. Contrast
        if (contrast !== 1.0) {
          r = (r - 128) * contrast + 128;
          g = (g - 128) * contrast + 128;
          b = (b - 128) * contrast + 128;
        }

        // 3. Saturation
        if (saturation !== 1.0) {
          const L = 0.299 * r + 0.587 * g + 0.114 * b;
          r = L + (r - L) * saturation;
          g = L + (g - L) * saturation;
          b = L + (b - L) * saturation;
        }

        // 4. Sepia (if warmth > 0)
        if (sepiaIntensity > 0) {
          const tr = r * 0.393 + g * 0.769 + b * 0.189;
          const tg = r * 0.349 + g * 0.686 + b * 0.168;
          const tb = r * 0.272 + g * 0.534 + b * 0.131;
          r = r + (tr - r) * sepiaIntensity;
          g = g + (tg - g) * sepiaIntensity;
          b = b + (tb - b) * sepiaIntensity;
        }

        // Assignment to Uint8ClampedArray automatically clamps to 0-255
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // 5. Negative warmth (Cool / Blue Tint)
    // We can use canvas composite operations for this, which works reliably across all browsers.
    if (warmth < 0) {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = `rgba(0, 80, 220, ${Math.abs(warmth) / 200})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

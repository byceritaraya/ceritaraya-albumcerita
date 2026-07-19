import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class ColorProcessor implements Processor {
  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    tempCanvas: HTMLCanvasElement
  ): Promise<void> {
    const { saturation, warmth } = settings;

    // Copy current canvas state into the render-scoped temp canvas.
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    // Build filter string. Saturation is a multiplier (1.0 = no change).
    let filterString = `saturate(${saturation * 100}%)`;
    if (warmth > 0) {
      // Positive warmth: a small sepia shift adds golden/amber tones.
      filterString += ` sepia(${warmth * 2}%)`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filterString;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';

    if (warmth < 0) {
      // Negative warmth: cool the image with a blue overlay.
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = `rgba(0, 100, 255, ${Math.abs(warmth) / 100})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

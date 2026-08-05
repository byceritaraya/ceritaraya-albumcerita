import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class HalationProcessor implements Processor {
  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    _tempCanvas: HTMLCanvasElement
  ): Promise<void> {
    if (!settings.halation) return;

    // Create a very small canvas to achieve a cheap, fast, cross-browser blur
    const scale = 0.05; // downscale to 1/20th
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.max(1, canvas.width * scale);
    smallCanvas.height = Math.max(1, canvas.height * scale);
    const smallCtx = smallCanvas.getContext('2d')!;

    // 1. Draw the original image onto the small canvas
    smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);

    // 2. Tint it with a warm orange/red color (the halation characteristic)
    smallCtx.globalCompositeOperation = 'source-atop';
    smallCtx.fillStyle = 'rgba(255, 80, 0, 0.4)'; 
    smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);

    // 3. Composite the blurred (upscaled) halation pass over the original image
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.55; // Strength of the dreamy glow
    
    // Ensure the browser uses bilinear interpolation to create a smooth blur
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(smallCanvas, 0, 0, canvas.width, canvas.height);

    // Reset
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }
}

import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class ToneProcessor implements Processor {
  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    tempCanvas: HTMLCanvasElement
  ): Promise<void> {
    const { brightness, contrast } = settings;

    // Use the render-scoped temp canvas.
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness * 100}%) contrast(${contrast * 100}%)`;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
  }
}

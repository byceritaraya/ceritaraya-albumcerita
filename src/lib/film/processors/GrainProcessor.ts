import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class GrainProcessor implements Processor {
  private noiseCanvas: HTMLCanvasElement | null = null;

  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    _tempCanvas: HTMLCanvasElement // Unused in this processor, but required by interface
  ): Promise<void> {
    const { grain } = settings;
    if (grain === 'none') return;
    
    let opacity = 0;
    if (grain === 'light') opacity = 0.12;
    if (grain === 'medium') opacity = 0.25;
    if (grain === 'heavy') opacity = 0.40;
    
    // Generate a noise pattern tile if not already generated
    if (!this.noiseCanvas) {
      this.noiseCanvas = document.createElement('canvas');
      const tileSize = 200;
      this.noiseCanvas.width = tileSize;
      this.noiseCanvas.height = tileSize;
      const noiseCtx = this.noiseCanvas.getContext('2d')!;
      
      const imgData = noiseCtx.createImageData(tileSize, tileSize);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Monochromatic noise
        const val = Math.random() * 255;
        data[i] = val;     // R
        data[i+1] = val;   // G
        data[i+2] = val;   // B
        data[i+3] = 255;   // A
      }
      noiseCtx.putImageData(imgData, 0, 0);
    }
    
    // Apply the noise pattern over the image using overlay/soft-light blend mode
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = opacity;
    
    const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Reset context
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }
}

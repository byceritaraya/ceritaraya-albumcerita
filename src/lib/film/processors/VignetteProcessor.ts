import { FilmRecipeSettings } from '../types';
import { Processor } from './Processor';

export class VignetteProcessor implements Processor {
  async process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    tempCanvas: HTMLCanvasElement // Unused in this processor, but required by interface
  ): Promise<void> {
    const { vignette } = settings;
    if (vignette === 'none') return;
    
    let opacity = 0;
    if (vignette === 'soft') opacity = 0.3;
    if (vignette === 'medium') opacity = 0.6;
    if (vignette === 'strong') opacity = 0.9;
    
    // Create a radial gradient
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    
    const gradient = ctx.createRadialGradient(cx, cy, maxRadius * 0.4, cx, cy, maxRadius);
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, `rgba(0,0,0,${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);
    
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'source-over'; // reset
  }
}

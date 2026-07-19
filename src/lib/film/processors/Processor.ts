import { FilmRecipeSettings } from '../types';

export interface Processor {
  /**
   * Process the image using the given settings.
   * @param canvas The main canvas containing the image to modify.
   * @param ctx The 2D context of the main canvas.
   * @param settings The film recipe settings.
   * @param tempCanvas A temporary canvas scoped to this render pipeline, available for compositing operations.
   */
  process(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    settings: FilmRecipeSettings,
    tempCanvas: HTMLCanvasElement
  ): Promise<void>;
}

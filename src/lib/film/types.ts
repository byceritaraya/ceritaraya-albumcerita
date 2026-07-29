export type GrainLevel = 'none' | 'light' | 'medium' | 'heavy';
export type VignetteLevel = 'none' | 'soft' | 'medium' | 'strong';

export interface FilmRecipeSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  grain: GrainLevel;
  vignette: VignetteLevel;
  halation?: boolean;
}

export interface FilmRecipe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: FilmRecipeSettings;
  active: boolean;
  created_at: string;
}

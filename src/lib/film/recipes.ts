/**
 * src/lib/film/recipes.ts
 *
 * Shared server-side helpers for accessing film_recipes data.
 *
 * The admin dashboard uses a custom session cookie (albumcerita_admin_session),
 * NOT native Supabase Auth. createClient() therefore executes as the `anon` role,
 * which has no SELECT grant on film_recipes.
 *
 * All admin-facing Film Recipe queries MUST use createServiceClient() (service role key),
 * which is a trusted server-side client and bypasses RLS safely in admin contexts.
 *
 * Do NOT call these helpers from client components.
 */

import { createServiceClient } from '@/lib/supabase/service';

export interface FilmRecipeRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  created_at: string;
  settings: Record<string, unknown>;
}

/**
 * Fetch ALL film recipes (active and inactive) for admin management pages.
 * Returns { data, error } — caller must handle the error case explicitly.
 */
export async function getFilmRecipesForAdmin(): Promise<{
  data: FilmRecipeRow[] | null;
  error: { message: string } | null;
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('film_recipes')
    .select('id, name, slug, description, active, created_at, settings')
    .order('name');

  return { data, error };
}

/**
 * Fetch ACTIVE film recipes only — for service configuration wizards.
 * Returns { data, error } — caller must handle the error case explicitly.
 */
export async function getActiveFilmRecipesForConfiguration(): Promise<{
  data: FilmRecipeRow[] | null;
  error: { message: string } | null;
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('film_recipes')
    .select('id, name, slug, description, active, created_at, settings')
    .eq('active', true)
    .order('name');

  return { data, error };
}

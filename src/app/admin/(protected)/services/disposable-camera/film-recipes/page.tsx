import { Film } from 'lucide-react';
import { getFilmRecipesForAdmin } from '@/lib/film/recipes';

export default async function FilmRecipesPage() {
  // Use service-role client — the admin dashboard uses a custom session cookie
  // (albumcerita_admin_session), NOT native Supabase Auth. createClient() would
  // execute as the `anon` role which has no SELECT grant on film_recipes.
  const { data: recipes, error } = await getFilmRecipesForAdmin();

  // Explicit error state — do not silently convert a DB error into 0 recipes.
  if (error) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Film Recipes</h1>
          <p className="mt-1 text-sm text-gray-500">Global repository of available film styles.</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-800 mb-1">Failed to load film recipes</p>
          <p className="text-xs text-red-600 font-mono">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Film Recipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Global repository of available film styles.{' '}
            <span className="text-gray-400">
              {recipes?.length ?? 0} recipe{recipes?.length !== 1 ? 's' : ''} total
            </span>
          </p>
        </div>
        <button disabled className="rounded-xl bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed">
          + New Recipe
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recipe Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recipes?.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Film className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
                      {recipe.description && (
                        <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{recipe.description}</div>
                      )}
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{recipe.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    recipe.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {recipe.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs text-gray-400">
                    {new Date(recipe.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-[var(--theme-primary)] hover:text-[var(--theme-secondary)] mr-4">Preview</button>
                  <button className="text-gray-400 hover:text-gray-600">Edit</button>
                </td>
              </tr>
            ))}

            {(!recipes || recipes.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No film recipes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

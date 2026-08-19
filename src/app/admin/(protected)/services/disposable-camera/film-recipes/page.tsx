import { createClient } from '@/lib/supabase/server';
import { Film } from 'lucide-react';

export default async function FilmRecipesPage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from('film_recipes')
    .select('*')
    .order('name');

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Film Recipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Global repository of available film styles.
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
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{recipe.id.split('-')[0]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    recipe.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {recipe.active ? 'Active' : 'Inactive'}
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
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
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

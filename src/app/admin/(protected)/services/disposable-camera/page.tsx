import { createClient } from '@/lib/supabase/server';
import { getFilmRecipesForAdmin } from '@/lib/film/recipes';
import { Camera, Calendar, Image as ImageIcon } from 'lucide-react';

export default async function DisposableCameraOverview() {
  const supabase = await createClient();

  // Basic stats
  const { count: eventsCount } = await supabase
    .from('event_services')
    .select('*', { count: 'exact', head: true })
    // Hardcode service slug lookup or just assume all 'active' for now since we're keeping it simple
    .eq('status', 'active');
    
  const { data: recipes } = await getFilmRecipesForAdmin();
  const recipesCount = recipes?.length ?? 0;
  const activeRecipesCount = recipes?.filter(r => r.active).length ?? 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global status and statistics for the Disposable Camera service.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Active Events</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{eventsCount ?? 0}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Film Recipes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{recipesCount}</p>
          <p className="text-sm text-gray-500 mt-1">{activeRecipesCount} active</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm opacity-50">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">Frames Available</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-400 mt-1">Coming Soon</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-sm font-bold text-blue-900 mb-2">Architectural Note</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          This area manages the global capabilities of the Disposable Camera service. Event-specific configurations (such as choosing a specific film recipe or setting photo limits for an event) are handled within each individual event&apos;s configuration wizard.
        </p>
      </div>
    </div>
  );
}

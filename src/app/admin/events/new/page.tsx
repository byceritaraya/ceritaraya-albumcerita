import { createServiceClient } from '@/lib/supabase/service';
import { NewEventForm } from './new-event-form';

export default async function NewEventPage() {
  const supabase = createServiceClient();
  
  const { data: recipes } = await supabase
    .from('film_recipes')
    .select('id, name')
    .eq('active', true)
    .order('name');
    
  return <NewEventForm availableRecipes={recipes || []} />;
}

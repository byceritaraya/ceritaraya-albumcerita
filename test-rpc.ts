import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  console.log('Testing RPC...');
  
  // Need a real client_id
  const { data: client } = await supabase.from('clients').select('id').limit(1).single();
  if (!client) {
    console.log('No client found to test with.');
    return;
  }

  // Need a real film_recipe_id
  const { data: recipe } = await supabase.from('film_recipes').select('id').limit(1).single();
  if (!recipe) {
    console.log('No film recipe found to test with.');
    return;
  }
  
  // Need a real service_id
  const { data: service } = await supabase.from('services').select('id').limit(1).single();
  if (!service) {
    console.log('No service found to test with.');
    return;
  }

  const { data, error } = await supabase.rpc('create_event_with_services', {
    p_event_id: 'TEST1235',
    p_slug: 'test-slug-1235',
    p_name: 'Test Event 2',
    p_event_type: 'wedding',
    p_event_date: '2026-08-16',
    p_client_id: client.id,
    p_pin_hash: 'hash',
    p_host_pin_hash: 'hash',
    p_guest_pin_hash: 'hash',
    p_guest_pin: '1234',
    p_photos_per_guest: 10,
    p_max_contributors: 50,
    p_retention_months: 3,
    p_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    p_film_recipe_id: recipe.id,
    p_service_ids: [service.id],
  });

  console.log('Result:');
  console.log(JSON.stringify({ data, error }, null, 2));
}

testRpc().catch(console.error);

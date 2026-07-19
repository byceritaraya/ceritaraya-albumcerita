import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // using anon key to test RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // to test bypass RLS

async function main() {
  console.log('--- Using Anon Key (Simulating public access) ---');
  const anonClient = createClient(supabaseUrl, supabaseKey);
  const { data: anonData, error: anonError } = await anonClient
    .from('film_recipes')
    .select('id, name, active')
    .order('name');
  
  if (anonError) console.error('Anon Error:', anonError);
  else console.log('Anon Data:', anonData);

  console.log('\n--- Using Service Role Key (Bypassing RLS) ---');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('film_recipes')
    .select('id, name, active')
    .order('name');
  
  if (serviceError) console.error('Service Error:', serviceError);
  else console.log('Service Data:', serviceData);
}

main();

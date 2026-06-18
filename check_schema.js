const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl, supabaseKey;
envLocal.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContributors() {
  const { data, error } = await supabase.from('contributors').select('*').limit(1);
  if (error) {
    console.log("Error querying contributors table:", error.message);
  } else {
    console.log("Contributors table exists! Data:", data);
  }
}

checkContributors();

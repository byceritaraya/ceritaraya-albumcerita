const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('events')
    .select('id, event_id, name, host_name, event_type, expires_at, cover_image_url, theme, guest_slug, guest_pin')
    .limit(1);
    
  console.log('Error:', error);
}

check();

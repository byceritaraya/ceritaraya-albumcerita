import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testUpdate() {
  const eventId = 'VBN2MNDZ'; // Let's use a real or fake event_id. I don't know the event ID. I'll search for one.
  
  const { data, error } = await supabase.from('events').select('event_id').limit(1).single();
  if (error || !data) { console.error('No event', error); return; }

  const res = await supabase.from('events').update({ cover_image_url: 'covers/TEST.jpg' }).eq('event_id', data.event_id);
  console.log('Update result:', res);
}

testUpdate().catch(console.error);

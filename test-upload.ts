import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testUpload() {
  const fileContent = "dummy image data";
  const path = `covers/TEST1234-123456789.jpg`;
  
  const { data, error } = await supabase.storage.from('albumcerita_photos').upload(path, fileContent, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  console.log({ data, error });
}

testUpload().catch(console.error);

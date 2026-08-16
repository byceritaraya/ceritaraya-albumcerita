const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ceritaraya.my.id';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODYyOTMxMTQsImV4cCI6MTk0Mzk3MzExNH0.NJPhTI1fE5f8pmjO2VRDBk3nGQu23BsrdK6nmihXe3M';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // 1. Check what cover_image_url looks like in DB
  console.log('=== Checking events.cover_image_url ===');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, cover_image_url')
    .not('cover_image_url', 'is', null)
    .limit(3);
  
  if (eventsError) {
    console.error('Error:', eventsError);
  } else {
    events.forEach(e => {
      const url = e.cover_image_url;
      console.log(`\nEvent: ${e.name}`);
      console.log(`  cover_image_url: ${url}`);
      console.log(`  Starts with http: ${url?.startsWith('http')}`);
      console.log(`  Is relative path: ${url && !url.startsWith('http')}`);
    });
  }

  // 2. Check latest photo storage_path vs original_url
  console.log('\n=== Checking photos ===');
  const { data: photos } = await supabase
    .from('photos')
    .select('id, original_url, storage_path')
    .order('uploaded_at', { ascending: false })
    .limit(3);
  
  photos?.forEach(p => {
    console.log(`\nPhoto: ${p.id}`);
    console.log(`  storage_path: ${p.storage_path}`);
    console.log(`  original_url: ${p.original_url}`);
    console.log(`  original_url starts http: ${p.original_url?.startsWith('http')}`);
  });
  
  // 3. Try generating a signed URL for a photo
  if (photos && photos.length > 0) {
    const path = photos[0].storage_path;
    console.log('\n=== Testing createSignedUrl ===');
    console.log(`Path: ${path}`);
    
    const { data: signed, error: signedError } = await supabase.storage
      .from('albumcerita_photos')
      .createSignedUrl(path, 60);
    
    if (signedError) {
      console.log('  Error:', signedError.message);
    } else {
      const signedUrl = signed?.signedUrl;
      console.log(`  Signed URL: ${signedUrl}`);
      
      // Try fetching it
      const res = await fetch(signedUrl);
      console.log(`  HTTP Status: ${res.status}`);
      console.log(`  Content-Length: ${res.headers.get('content-length')}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
    }
  }

  // 4. Try getPublicUrl
  if (photos && photos.length > 0) {
    const path = photos[0].storage_path;
    console.log('\n=== Testing getPublicUrl ===');
    const { data: pub } = supabase.storage.from('albumcerita_photos').getPublicUrl(path);
    console.log(`  Public URL: ${pub.publicUrl}`);
    
    const res = await fetch(pub.publicUrl);
    console.log(`  HTTP Status: ${res.status}`);
    console.log(`  Content-Length: ${res.headers.get('content-length')}`);
  }
}

main().catch(console.error);

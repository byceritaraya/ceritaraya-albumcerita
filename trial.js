const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('Error: Harap set environment variable SUPABASE_URL dan SUPABASE_SERVICE_KEY');
    console.log('Contoh:');
    console.log('export SUPABASE_URL="http://localhost:8000"');
    console.log('export SUPABASE_SERVICE_KEY="ey..."');
    console.log('node trial.js');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucket = 'albumcerita_photos';
  const oldObjectName = '78e93f29-42a3-4673-b87f-18bcba57da63/0b893aa4-7375-41be-bc2c-e8f1c69b43dd.jpg';
  const newObjectName = 'test-migration.jpg';

  console.log('--- TRIAL #1 ---');
  console.log(`1. Mendownload object lama: ${oldObjectName}`);
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(oldObjectName);

  if (downloadError) {
    console.error('❌ Gagal download object lama:', downloadError.message);
    process.exit(1);
  }

  console.log('✅ Berhasil download object lama. Size:', fileData.size, 'bytes');

  console.log(`\n2. Upload object sebagai copy baru ke: ${newObjectName}`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(newObjectName, fileData, {
      upsert: true,
      contentType: fileData.type || 'image/jpeg'
    });

  if (uploadError) {
    console.error('❌ Gagal upload object baru:', uploadError.message);
    process.exit(1);
  }

  console.log('✅ Berhasil upload object baru:', uploadData);

  console.log(`\n3. Generate Signed URL untuk object baru...`);
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(newObjectName, 3600);

  if (signedError) {
    console.error('❌ Gagal membuat signed URL:', signedError.message);
    process.exit(1);
  }

  console.log('✅ Berhasil generate signed URL:\n', signedData.signedUrl);

  console.log(`\n4. Mengetes GET Signed URL tersebut...`);
  try {
    const response = await fetch(signedData.signedUrl);
    console.log(`HTTP Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Signed GET BERHASIL (HTTP 200).');
      console.log('\nKESIMPULAN TRIAL #1:');
      console.log('Karena test-migration.jpg berhasil (Signed GET HTTP 200), masalah 404 pada object lama DISEBABKAN OLEH METADATA/VERSION di database object lama yang tidak singkron dengan physical file di SumoPod (atau format lama yang tidak kompatibel dengan Supabase Storage API v1.60.4). \nLangkah selanjutnya adalah Trial #2 untuk memperbaiki object lama TANPA memindahkan/mengupload ulang fisik file.');
    } else {
      const errorText = await response.text();
      console.log('❌ Signed GET GAGAL (HTTP ' + response.status + ')');
      console.log('Respons:', errorText);
      console.log('\nKESIMPULAN TRIAL #1:');
      console.log('Object copy baru JUGA MENDAPATKAN 404 pada Signed GET. Artinya masalah BUKAN pada metadata object lama secara spesifik, MELAINKAN pada proxy/tenant/URL format secara umum pada routing Signed URL.');
    }
  } catch (err) {
    console.error('❌ Gagal request GET ke signed URL:', err.message);
  }
}

run();

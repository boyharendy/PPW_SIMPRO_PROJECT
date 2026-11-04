import fs from 'node:fs';
import path from 'node:path';

// Load .env.local (works from root or frontend directory)
const candidatePaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'frontend', '.env.local'),
];
const envPath = candidatePaths.find(p => fs.existsSync(p));
if (envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('==================================================');
console.log('🔍 Pengujian Koneksi Supabase SIMPRO');
console.log('==================================================');
console.log('URL     :', supabaseUrl);
console.log('Anon Key:', (supabaseAnonKey && (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_'))) ? '✅ Key Terkonfigurasi' : '⚠️ Format Tidak Dikenal');
console.log('--------------------------------------------------');

if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.log('❌ Kredensial Supabase belum dikonfigurasi di .env.local!');
  console.log('👉 Masukkan URL dan anon key Anda ke file .env.local terlebih dahulu.');
  process.exit(1);
}

try {
  let data = null;
  let error = null;
  const start = Date.now();

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('📡 Menghubungi Supabase API (via Supabase SDK)...');
    const res = await supabase.from('profiles').select('id, nama_lengkap, email, tipe_pengguna').limit(5);
    data = res.data;
    error = res.error;
  } catch {
    console.log('📡 Menghubungi Supabase API (via Native Fetch)...');
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,nama_lengkap,email,tipe_pengguna&limit=5`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      error = { code: errJson.code || String(res.status), message: errJson.message || res.statusText };
    } else {
      data = await res.json();
    }
  }

  const elapsed = Date.now() - start;

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      console.log(`✅ KONEKSI KE SUPABASE BERHASIL! (Waktu respon: ${elapsed}ms)`);
      console.log('ℹ️ Status: Database terhubung aktif, namun tabel skema belum dibuat.');
      console.log('👉 Langkah Selanjutnya: Eksekusi skema migration di Supabase SQL Editor:');
      console.log('   File: supabase/migrations/20261103_init_simpro_schema.sql');
    } else {
      console.log(`❌ Error query (${error.code}):`, error.message);
    }
  } else {
    console.log(`🎉 KONEKSI DAN QUERY DATABASE SUKSES! (Waktu respon: ${elapsed}ms)`);
    console.log(`📊 Ditemukan ${data?.length || 0} akun pengguna di tabel profiles:`);
    data?.forEach(p => console.log(`   - [${p.tipe_pengguna}] ${p.nama_lengkap} (${p.email})`));
  }
} catch (err) {
  console.log('❌ Terjadi kesalahan fatal:', err.message);
  process.exit(1);
}
console.log('==================================================');

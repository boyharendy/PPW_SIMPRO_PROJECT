import { createClient } from '@supabase/supabase-js';
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
console.log('Anon Key:', (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_')) ? '✅ Key Terkonfigurasi' : '⚠️ Format Tidak Dikenal');
console.log('--------------------------------------------------');

if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.log('❌ Kredensial Supabase belum dikonfigurasi di .env.local!');
  console.log('👉 Masukkan URL dan anon key Anda ke file .env.local terlebih dahulu.');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('📡 Menghubungi Supabase API...');
  const start = Date.now();
  const { data, error } = await supabase.from('profiles').select('id, nama_lengkap, email').limit(5);
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
    data?.forEach(p => console.log(`   - [${p.id.slice(0, 8)}...] ${p.nama_lengkap} (${p.email})`));
  }
} catch (err) {
  console.log('❌ Terjadi kesalahan fatal:', err.message);
  process.exit(1);
}
console.log('==================================================');


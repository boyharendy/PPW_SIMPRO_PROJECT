import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey !== 'your-anon-key-here'
  );

  if (!isConfigured) {
    return NextResponse.json({
      status: 'unconfigured',
      message: 'Kredensial Supabase belum diisi di .env.local',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? (supabaseUrl.includes('your-project-id') ? 'PLACEHOLDER' : 'CONFIGURED') : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? (supabaseAnonKey === 'your-anon-key-here' ? 'PLACEHOLDER' : 'CONFIGURED') : 'MISSING',
      },
      instructions: [
        '1. Buka Supabase Dashboard di https://supabase.com/dashboard',
        '2. Pilih project -> Project Settings -> API',
        '3. Salin Project URL dan anon public key',
        '4. Tempel ke file .env.local',
      ],
    }, { status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const start = Date.now();

    // Query profiles table to verify schema
    const { data, error } = await supabase.from('profiles').select('id, nama_lengkap, email').limit(5);
    const latencyMs = Date.now() - start;

    if (error) {
      // 42P01: relation does not exist / PGRST205: table not found in schema cache
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          status: 'connected_no_schema',
          message: 'Koneksi ke Supabase BERHASIL! Database terhubung, namun tabel skema belum dibuat.',
          latencyMs,
          instruction: 'Jalankan skema SQL di Supabase SQL Editor: supabase/migrations/20261103_init_simpro_schema.sql',
        });
      }

      return NextResponse.json({
        status: 'error',
        message: 'Gagal melakukan query ke Supabase',
        error: error.message,
        code: error.code,
      }, { status: 400 });
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Koneksi ke Supabase dan Database Berhasil!',
      latencyMs,
      profilesCount: data?.length || 0,
      sampleProfiles: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: 'error',
      message: 'Exception saat menguji koneksi Supabase',
      error: message,
    }, { status: 500 });
  }
}


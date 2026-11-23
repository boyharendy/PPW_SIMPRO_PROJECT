import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let available = false;
  if (url && key) {
    try {
      const response = await fetch(url.replace(/\/$/, '') + '/auth/v1/health', {
        headers: { apikey: key }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(4000),
      });
      available = response.ok;
    } catch {
      available = false;
    }
  }
  return NextResponse.json({ status: available ? 'connected' : 'unavailable' },
    { status: available ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

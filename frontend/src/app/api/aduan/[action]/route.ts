import { NextResponse } from 'next/server';

const routes = new Map([
  ['create', ''], ['track', '/track'], ['messages', '/track/messages'],
  ['rating', '/track/rating'], ['attachment', '/track/attachment'],
]);
const privateHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const path = routes.get((await context.params).action);
  if (path === undefined) return new Response(null, { status: 404, headers: privateHeaders });
  const base = process.env.SIMPRO_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  const headers = new Headers();
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
  try {
    // Only the content type crosses the anonymous boundary. Keep multipart bodies streaming.
    const options: RequestInit & { duplex: 'half' } = {
      method: 'POST', headers, body: request.body, duplex: 'half', redirect: 'error',
      credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: request.signal,
    };
    const upstream = await fetch(base.replace(/\/$/, '') + '/public/aduan' + path, options);
    return new Response(upstream.body, {
      status: upstream.status, headers: { ...privateHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Layanan aduan belum dapat dihubungi.' },
      { status: 503, headers: privateHeaders });
  }
}

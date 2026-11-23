'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { API_BASE_URL, ApiError } from '@/lib/api/client';
import { useApp } from '@/lib/context';

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function canOpenDemoSession() {
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN !== 'true') return false;
  if (typeof window === 'undefined' || !loopbackHosts.has(window.location.hostname)) return false;

  try {
    const api = new URL(API_BASE_URL);
    return (api.protocol === 'http:' || api.protocol === 'https:') && loopbackHosts.has(api.hostname);
  } catch {
    return false;
  }
}

export default function SessionGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoadingSession, login } = useApp();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoAttempt, setDemoAttempt] = useState(0);
  const [failedAttempt, setFailedAttempt] = useState<number | null>(null);
  const autoLogin = canOpenDemoSession();

  useEffect(() => {
    if (!autoLogin || isLoadingSession || isAuthenticated) return;
    let active = true;
    void login({ email: 'kaprodi@universitas.ac.id', password: 'password123' }, { redirect: 'error' })
      .catch(() => { if (active) setFailedAttempt(demoAttempt); });
    return () => { active = false; };
  }, [autoLogin, demoAttempt, isAuthenticated, isLoadingSession, login]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      await login({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
    } catch (err) {
      if (err instanceof ApiError && [400, 401, 403].includes(err.status)) {
        setError('Login ditolak. Periksa email, kata sandi, dan status aktivasi akun SIMPRO.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Terlalu banyak percobaan masuk. Tunggu sebentar sebelum mencoba lagi.');
      } else {
        setError('Layanan login SIMPRO belum dapat dihubungi. Coba lagi setelah backend tersedia.');
      }
    } finally {
      setBusy(false);
    }
  }
  if (isLoadingSession) return <p className="p-6" role="status">Memeriksa sesi...</p>;
  if (isAuthenticated) return <div key={user.id + ':' + user.activeRole}>{children}</div>;
  if (autoLogin) {
    return failedAttempt === demoAttempt ? (
      <div className="space-y-3 p-6">
        <p role="alert">Sesi demo belum bisa dibuka. Pastikan API Go berjalan dalam mode pengembangan.</p>
        <button className="btn-primary" onClick={() => setDemoAttempt(attempt => attempt + 1)}>Coba lagi</button>
      </div>
    ) : <p className="p-6" role="status">Membuka sesi Kaprodi demo...</p>;
  }
  return <main className="grid min-h-dvh place-items-center bg-slate-50 p-4">
    <form className="card w-full max-w-sm space-y-4" onSubmit={signIn}>
      <h1 className="text-xl font-bold">Masuk ke SIMPRO</h1>
      <label className="block">Email<input name="email" type="email" className="input-field" autoComplete="username" required /></label>
      <label className="block">Kata sandi<input name="password" type="password" className="input-field" autoComplete="current-password" required /></label>
      {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
      <button disabled={busy} className="btn-primary">{busy ? 'Memeriksa akun...' : 'Masuk'}</button>
    </form>
  </main>;
}

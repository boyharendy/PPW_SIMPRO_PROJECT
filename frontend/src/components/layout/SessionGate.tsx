'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';
import { useApp } from '@/lib/context';

export default function SessionGate({ children }: { children: ReactNode }) {
  const { user, isDevPreview, isAuthenticated, isLoadingSession, login } = useApp();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
  if (isDevPreview || isAuthenticated) return <div key={user.id + ':' + user.activeRole}>{children}</div>;
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

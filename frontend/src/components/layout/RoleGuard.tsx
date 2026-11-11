'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '@/lib/context';
import { canAccess } from '@/lib/navigation';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoadingSession } = useApp();

  if (isLoadingSession) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const allowed = canAccess(pathname, user.activeRole);

  if (!allowed) {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-red-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-100 p-3 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
              403 FORBIDDEN
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Akses Ditolak (Hak Akses Terbatas)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Peran aktif Anda saat ini (<span className="font-semibold text-slate-900">{user.activeRole.replace('_', ' ')}</span>) tidak memiliki wewenang untuk membuka modul atau halaman ini.
            </p>
            <p className="text-xs text-slate-500">
              Sesuai SKPL SIMPRO Bab 2 &amp; NF-02, setiap tindakan dan akses modul dibatasi ketat berdasarkan peran yang aktif. Jika Anda memiliki peran lain, silakan ganti peran melalui menu di bagian atas header.
            </p>
            <div className="pt-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


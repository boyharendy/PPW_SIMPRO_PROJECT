'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Clock, FileOutput, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-800">
      {/* Background effects */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-slate-800 text-xl tracking-tight">SIMPRO</span>
        </div>
        <Link
          href="/dashboard"
          className="btn-primary text-sm"
        >
          Masuk ke Dashboard
          <ArrowRight size={16} />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Sistem Informasi Manajemen Program Studi
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6">
          Kelola Prodi <br />
          <span className="text-blue-600">
            dalam Satu Sistem
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          14 modul operasional terpadu — dari PMB, artefak perkuliahan, kinerja dosen, prestasi mahasiswa, 
          KP/TA/Magang, hingga tracer study — semuanya tersedia dalam satu dashboard modern.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
            Buka Dashboard
            <ArrowRight size={18} />
          </Link>
          <Link href="/tracer-study/tok-abc123" className="btn-secondary text-base px-8 py-3">
            Demo Tracer Study
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <BarChart3 size={22} />, title: 'Dashboard Rekap Otomatis', desc: 'Rasio PMB, indeks kepuasan, waktu tunggu kerja, dan 7+ indikator lainnya dihitung otomatis.' },
            { icon: <Shield size={22} />, title: 'RBAC Multi-Peran', desc: '8 peran (Kaprodi, GKM, Koordinator, Dosen, Mahasiswa, Himpunan) dengan akses tepat sasaran.' },
            { icon: <Clock size={22} />, title: 'Notifikasi & Pengingat', desc: 'Pengingat artefak H-7 dan H-1, notifikasi status pengajuan, dan email otomatis.' },
            { icon: <FileOutput size={22} />, title: 'Ekspor Excel & PDF', desc: 'Semua rekap bisa diekspor untuk laporan ke pimpinan dan lembaga akreditasi.' },
            { icon: <Smartphone size={22} />, title: 'Mobile-First', desc: 'Desain responsif untuk mahasiswa yang mengakses dari HP maupun laptop.' },
            { icon: <Shield size={22} />, title: 'Audit Trail', desc: 'Log audit immutable untuk setiap keputusan pendanaan, penilaian, dan perubahan status.' },
          ].map((f, i) => (
            <div
              key={i}
              className="card hover:-translate-y-1 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600 transition-all">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8 text-center bg-white">
        <p className="text-sm text-slate-500">
          © 2025 SIMPRO — Prodi Sarjana Sistem Informasi
        </p>
      </footer>
    </div>
  );
}

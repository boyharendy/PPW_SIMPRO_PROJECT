'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Clock, BookOpen, Building2, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
     {/* Header */}
      <header className="flex items-center justify-between px-6 lg:px-12 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">SIMPRO</span>
        </div>
        <Link
          href="/dashboard"
          className="btn-primary text-xs py-2 px-3.5"
        >
          Masuk ke Dashboard
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Sistem Informasi Manajemen Program Studi
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
          Tata Kelola Mutu &amp; Kemahasiswaan <br />
          <span className="text-blue-600">Terpadu dan Akuntabel</span>
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Platform integrasi kepuasan mitra, pelaporan publikasi ilmiah, persetujuan perjalanan dinas,
          perencanaan RKA, penjaminan mutu RPS, evaluasi perkuliahan, dan layanan aduan mahasiswa.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary text-sm px-6 py-2.5">
            Buka Dashboard SIMPRO
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/aduan/lacak"
            target="_blank"
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Pelacakan Aduan Publik
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Building2 size={20} className="text-blue-600" />,
              title: 'Tata Kelola & RKA Terstruktur',
              desc: 'Penyusunan anggaran versi kerja bertingkat, realisasi kegiatan, dan monitoring serapan triwulanan.',
            },
            {
              icon: <BookOpen size={20} className="text-emerald-600" />,
              title: 'Standar Mutu Pembelajaran',
              desc: 'Lembar checklist 5 komponen review RPS, pemantauan CPMK kelas, dan post evaluasi perkuliahan.',
            },
            {
              icon: <Shield size={20} className="text-blue-600" />,
              title: 'Layanan Terlindungi & Anonim',
              desc: 'Penyampaian aspirasi mahasiswa berjaminan kerahasiaan identitas dan kanal khusus Satgas PPKPT.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mb-3.5">
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center bg-white text-xs text-slate-500">
        © 2025 SIMPRO — Program Studi Sarjana Sistem Informasi. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
}

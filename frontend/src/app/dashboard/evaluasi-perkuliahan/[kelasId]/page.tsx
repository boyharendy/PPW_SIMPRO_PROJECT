'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, CheckCircle2, MessageSquare, Star, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface CpmkRow {
  kode: string;
  deskripsi: string;
  target: number;
  capaian: number;
}

const DEFAULT_CPMK: CpmkRow[] = [
  { kode: 'CPMK-1', deskripsi: 'Mampu menjelaskan konsep dasar pemrograman berorientasi objek', target: 75, capaian: 82 },
  { kode: 'CPMK-2', deskripsi: 'Mampu merancang diagram kelas (class diagram) dengan UML', target: 75, capaian: 78 },
  { kode: 'CPMK-3', deskripsi: 'Mampu mengimplementasikan design pattern pada kode program', target: 70, capaian: 74 },
  { kode: 'CPMK-4', deskripsi: 'Mampu membuat aplikasi berbasis GUI dengan arsitektur MVC', target: 75, capaian: 68 },
];

export default function Page() {
  const { kelasId } = useParams<{ kelasId: string }>();
  const router = useRouter();

  const [cpmkList, setCpmkList] = useState<CpmkRow[]>(DEFAULT_CPMK);
  const [distribusiNilai, setDistribusiNilai] = useState({
    A: 12,
    AB: 10,
    B: 8,
    BC: 4,
    C: 3,
    D: 1,
    E: 0,
  });

  const [kesesuaianRps, setKesesuaianRps] = useState<'SESUAI' | 'SEBAGIAN' | 'TIDAK_SESUAI'>('SEBAGIAN');
  const [kendala, setKendala] = useState('Mahasiswa membutuhkan waktu adaptasi lebih lama pada materi design pattern di CPMK-4.');
  const [rencanaPerbaikan, setRencanaPerbaikan] = useState('Menambahkan sesi praktikum mandiri terpandu untuk CPMK-4 pada semester berikutnya.');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push('/dashboard/evaluasi-perkuliahan');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/evaluasi-perkuliahan"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Evaluasi
        </Link>
      </div>

      <PageHeader
        title="Formulir Evaluasi Perkuliahan Kelas"
        description={`Evaluasi berkala mata kuliah SI-301 (Kelas A) • 38 Mahasiswa • ID: ${kelasId || 'kls-01'}`}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Isian Dosen (2 Kolom) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Ketercapaian CPMK */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                1. Ketercapaian CPMK (Target vs Realisasi)
              </h3>
              <span className="text-xs font-semibold text-blue-600">
                Ambang Kelulusan: Target &ge; 70%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase">
                    <th className="py-2 px-2">Kode</th>
                    <th className="py-2 px-2">Deskripsi CPMK</th>
                    <th className="py-2 px-2 text-center w-20">Target (%)</th>
                    <th className="py-2 px-2 text-center w-24">Capaian (%)</th>
                    <th className="py-2 px-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cpmkList.map((c, i) => {
                    const tercapai = c.capaian >= c.target;
                    return (
                      <tr key={c.kode}>
                        <td className="py-2 px-2 font-mono font-bold text-blue-700">{c.kode}</td>
                        <td className="py-2 px-2 text-slate-700">{c.deskripsi}</td>
                        <td className="py-2 px-2 text-center font-mono">{c.target}%</td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={c.capaian}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCpmkList(
                                cpmkList.map((item, idx) => (idx === i ? { ...item, capaian: val } : item))
                              );
                            }}
                            className="input-field py-1 px-1 text-center font-mono text-xs w-16 mx-auto"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tercapai
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {tercapai ? 'Tercapai' : 'Belum'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Distribusi Nilai Mahasiswa */}
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Distribusi Nilai Akhir (38 Mahasiswa)
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {(Object.keys(distribusiNilai) as (keyof typeof distribusiNilai)[]).map((grade) => (
                <div key={grade} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                  <div className="text-xs font-bold text-slate-700">{grade}</div>
                  <input
                    type="number"
                    min={0}
                    value={distribusiNilai[grade]}
                    onChange={(e) =>
                      setDistribusiNilai({ ...distribusiNilai, [grade]: Number(e.target.value) })
                    }
                    className="input-field py-1 px-1 text-center font-mono text-xs mt-1"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">Mhs</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Kesesuaian RPS & Rencana Perbaikan (PRD FR-45) */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              3. Keselarasan RPS & Rencana Perbaikan Siklus Depan (FR-45)
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Kesesuaian Pelaksanaan Perkuliahan terhadap RPS
              </label>
              <div className="flex gap-4">
                {(['SESUAI', 'SEBAGIAN', 'TIDAK_SESUAI'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="kesesuaian"
                      checked={kesesuaianRps === opt}
                      onChange={() => setKesesuaianRps(opt)}
                    />
                    <span className={opt === 'SESUAI' ? 'text-emerald-700' : opt === 'SEBAGIAN' ? 'text-amber-700' : 'text-rose-700'}>
                      {opt.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kendala Utama Proses Pembelajaran
              </label>
              <textarea
                rows={2}
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                className="input-field text-xs resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Usulan Rencana Perbaikan (Otomatis Diteruskan ke RPS Periode Berikutnya)
              </label>
              <textarea
                rows={2}
                value={rencanaPerbaikan}
                onChange={(e) => setRencanaPerbaikan(e.target.value)}
                className="input-field text-xs resize-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
            >
              {submitted ? <CheckCircle2 size={14} /> : <Send size={14} />}
              {submitted ? 'Tersimpan...' : 'Kirim Evaluasi Perkuliahan'}
            </button>
          </div>
        </div>

        {/* Panel Umpan Balik Mahasiswa (Berdampingan - PRD FR-44) */}
        <div className="space-y-4">
          <div className="card space-y-4 bg-blue-50/30 border-blue-100">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Umpan Balik Mahasiswa (FR-44)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Data sinkron dari Kuesioner Evaluasi Dosen oleh Mahasiswa (EDOM) pada SIAKAD prodi.
            </p>

            <div className="p-3.5 rounded-xl bg-white border border-blue-100 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Jumlah Responden:</span>
                <span className="font-bold text-slate-800">34 / 38 Mhs (89.5%)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Skor Rata-rata EDOM:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-flex items-center gap-1">
                  <Star size={12} className="fill-blue-600 text-blue-600" /> 4.42 / 5.0
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Penilaian per Aspek Mahasiswa
              </h4>
              {[
                { label: 'Kejelasan Penyampaian Materi', score: 4.5 },
                { label: 'Ketepatan Waktu & Kedisiplinan', score: 4.6 },
                { label: 'Transparansi Penilaian & Asesmen', score: 4.3 },
                { label: 'Interaksi & Ketersediaan Diskusi', score: 4.3 },
              ].map((a, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-100 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-700">{a.label}</span>
                    <span className="font-bold text-slate-900">{a.score}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(a.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block mb-1">Kutipan Aspirasi Mahasiswa:</span>
              <p className="italic text-[11px] text-slate-500 leading-relaxed">
                "Penjelasan materi praktikum sangat runtut dan mudah dipahami, tetapi modul tutorial untuk tugas besar perlu diperbanyak contoh kodenya."
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

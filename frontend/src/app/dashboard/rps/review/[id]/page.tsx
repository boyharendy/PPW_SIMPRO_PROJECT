'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, Send, Save, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface PilarCheck {
  id: string;
  nama: string;
  deskripsi: string;
  hasil: 'SESUAI' | 'PERLU_PERBAIKAN' | 'TIDAK_SESUAI';
  catatan: string;
}

const PILAR_DEFAULT: PilarCheck[] = [
  {
    id: 'pilar-1',
    nama: '1. Keselarasan CPL – CPMK – Sub CPMK',
    deskripsi: 'Memeriksa apakah seluruh Capaian Pembelajaran Lulusan (CPL) terpetakan secara logis ke CPMK dan tahapan Sub-CPMK.',
    hasil: 'SESUAI',
    catatan: '',
  },
  {
    id: 'pilar-2',
    nama: '2. Bahan Kajian & Kedalaman Materi',
    deskripsi: 'Keluasan materi perkuliahan sesuai dengan jenjang Sarjana (KKNI Level 6) dan perkembangan ilmu terkini.',
    hasil: 'SESUAI',
    catatan: '',
  },
  {
    id: 'pilar-3',
    nama: '3. Metode & Skenario Pembelajaran',
    deskripsi: 'Penerapan metode student-centered learning (Case Method / Team-based Project) sesuai IKU 7.',
    hasil: 'PERLU_PERBAIKAN',
    catatan: 'Perlu memperjelas rubrik penilaian untuk bagian Case Study pada pertemuan 9.',
  },
  {
    id: 'pilar-4',
    nama: '4. Bentuk & Bobot Penilaian Asesmen',
    deskripsi: 'Proporsi penilaian transparan, selaras dengan CPMK, dan memiliki rubrik penilaian objektif.',
    hasil: 'SESUAI',
    catatan: '',
  },
  {
    id: 'pilar-5',
    nama: '5. Referensi Pustaka Terkini',
    deskripsi: 'Ketersediaan buku teks dan jurnal ilmiah referensi yang terbit dalam 5–10 tahun terakhir.',
    hasil: 'SESUAI',
    catatan: '',
  },
];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pilars, setPilars] = useState<PilarCheck[]>(PILAR_DEFAULT);
  const [rekomendasi, setRekomendasi] = useState<'DISETUJUI' | 'PERLU_REVISI'>('PERLU_REVISI');
  const [catatanUmum, setCatatanUmum] = useState(
    'Secara umum dokumen RPS sudah baik. Hanya perlu penyempurnaan kecil pada rubrik penilaian Case Method.'
  );
  const [submitted, setSubmitted] = useState(false);

  const handleUpdatePilar = (id: string, field: 'hasil' | 'catatan', val: string) => {
    setPilars(
      pilars.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push('/dashboard/rps/review-saya');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rps/review-saya"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Tugas Review Saya
        </Link>
      </div>

      <PageHeader
        title="Formulir Review RPS 5 Pilar"
        description="Penelaahan instrumen RPS berbasis 5 pilar mutu oleh Dosen Reviewer (FR-23, FR-24)."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Berkas RPS */}
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border border-slate-200">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Mata Kuliah Ditelaah</div>
            <div className="text-base font-bold text-slate-800 mt-0.5">
              SI-302 — Manajemen Basis Data Enterprise (3 SKS)
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Dosen Pengampu: Siti Aminah, S.Kom., M.T. • Versi 1.0
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1.5"
          >
            <Download size={14} /> Unduh Berkas RPS
          </button>
        </div>

        {/* 5 Pilar Mutu Checklist */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Instrumen Evaluasi 5 Pilar Mutu RPS
          </h3>

          <div className="space-y-4 divide-y divide-slate-100">
            {pilars.map((p) => (
              <div key={p.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{p.nama}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.deskripsi}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {(['SESUAI', 'PERLU_PERBAIKAN', 'TIDAK_SESUAI'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name={`pilar-${p.id}`}
                          checked={p.hasil === opt}
                          onChange={() => handleUpdatePilar(p.id, 'hasil', opt)}
                        />
                        <span
                          className={`font-semibold ${
                            opt === 'SESUAI'
                              ? 'text-emerald-700'
                              : opt === 'PERLU_PERBAIKAN'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {opt.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={p.catatan}
                    onChange={(e) => handleUpdatePilar(p.id, 'catatan', e.target.value)}
                    placeholder="Catatan telaah / arahan revisi untuk pilar ini (opsional jika sesuai)..."
                    className="input-field py-1.5 px-3 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rekomendasi Akhir & Catatan Umum */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Rekomendasi Akhir Reviewer
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Keputusan Akhir Telaah RPS
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 flex-1 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="rekomendasi"
                  checked={rekomendasi === 'DISETUJUI'}
                  onChange={() => setRekomendasi('DISETUJUI')}
                />
                <div>
                  <div className="text-xs font-bold text-emerald-700">DISETUJUI</div>
                  <div className="text-[11px] text-slate-400">Dokumen layak untuk disahkan oleh Kaprodi</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 flex-1 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="rekomendasi"
                  checked={rekomendasi === 'PERLU_REVISI'}
                  onChange={() => setRekomendasi('PERLU_REVISI')}
                />
                <div>
                  <div className="text-xs font-bold text-amber-700">PERLU REVISI</div>
                  <div className="text-[11px] text-slate-400">Dosen pengampu wajib mengunggah perbaikan</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Umum Evaluasi Reviewer
            </label>
            <textarea
              rows={3}
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
              placeholder="Tuliskan catatan umum ringkas hasil review..."
              className="input-field resize-none text-xs"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
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
            {submitted ? 'Tersimpan...' : 'Selesaikan Review RPS'}
          </button>
        </div>
      </form>
    </div>
  );
}

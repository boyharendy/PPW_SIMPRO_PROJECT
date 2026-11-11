'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, CheckCircle2, Send, Save, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface RencanaPerbaikan {
  id: string;
  uraian: string;
  kategori: string;
  status: 'DITERAPKAN' | 'TIDAK_DITERAPKAN';
  catatanPenerapan: string;
}

const MOCK_REC_ITEMS: RencanaPerbaikan[] = [
  {
    id: 'rec-1',
    uraian: 'Perlu penambahan sesi studi kasus industri nyata pada materi arsitektur cloud (CPMK-02).',
    kategori: 'CPMK_RPS',
    status: 'DITERAPKAN',
    catatanPenerapan: 'Telah ditambahkan 2 pertemuan studi kasus berbasis AWS & GCP pada RPS minggu ke-6 & 7.',
  },
  {
    id: 'rec-2',
    uraian: 'Pembaruan daftar referensi buku ajar yang sudah berumur lebih dari 5 tahun.',
    kategori: 'REFERENSI',
    status: 'DITERAPKAN',
    catatanPenerapan: 'Menambahkan 3 buku terbitan tahun 2023-2024 tentang Cloud Architecture.',
  },
];

export default function Page() {
  const router = useRouter();

  const [courseId, setCourseId] = useState('SI-301');
  const [periode, setPeriode] = useState('2025/2026 - Ganjil');
  const [catatanVersi, setCatatanVersi] = useState('Pembaruan RPS mengadopsi hasil evaluasi perkuliahan semester lalu.');
  const [rencanaList, setRencanaList] = useState<RencanaPerbaikan[]>(MOCK_REC_ITEMS);
  const [submitted, setSubmitted] = useState(false);

  const handleUpdateRencana = (id: string, field: 'status' | 'catatanPenerapan', val: string) => {
    setRencanaList(
      rencanaList.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push('/dashboard/rps');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rps"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar RPS
        </Link>
      </div>

      <PageHeader
        title="Formulir Pengajuan RPS"
        description="Pengajuan berkas rancangan RPS baru atau revisi semester berjalan (FR-22)."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Mata Kuliah */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            1. Mata Kuliah & Periode Akademik
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Mata Kuliah</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="select-field text-xs"
              >
                <option value="SI-301">SI-301 — Rekayasa Perangkat Lunak Berorientasi Objek (3 SKS)</option>
                <option value="SI-302">SI-302 — Manajemen Basis Data Enterprise (3 SKS)</option>
                <option value="SI-204">SI-204 — Algoritma & Struktur Data Lanjut (4 SKS)</option>
                <option value="SI-405">SI-405 — Audit Sistem Informasi & Tata Kelola IT (3 SKS)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Periode Semester</label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="select-field text-xs"
              >
                <option value="2025/2026 - Ganjil">2025/2026 — Semester Ganjil</option>
                <option value="2024/2025 - Genap">2024/2025 — Semester Genap</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Perubahan Versi RPS
              </label>
              <textarea
                rows={2}
                value={catatanVersi}
                onChange={(e) => setCatatanVersi(e.target.value)}
                placeholder="Jelaskan ringkasan perubahan materi, metode asesmen, atau bobot CPL..."
                className="input-field text-xs resize-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Berkas RPS */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            2. Unggah Dokumen RPS (PDF)
          </h3>
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/60 flex flex-col items-center justify-center text-center">
            <UploadCloud size={24} className="text-blue-600 mb-1.5" />
            <div className="text-xs font-semibold text-slate-800">
              RPS_SI-301_RPLBO_2025_v2.0.pdf
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Ukuran: 1.4 MB • Format: PDF</span>
          </div>
        </div>

        {/* Tindak Lanjut Rencana Perbaikan Evaluasi Sebelumnya (PRD FR-45) */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                3. Tindak Lanjut Evaluasi Perkuliahan Sebelumnya (FR-45)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rencana perbaikan dari evaluasi semester lalu wajib ditandai status penerapan dan catatannya.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Siklus Mutu GKM
            </span>
          </div>

          <div className="space-y-3">
            {rencanaList.map((rec) => (
              <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-semibold text-slate-800">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 mr-2">
                      {rec.kategori}
                    </span>
                    {rec.uraian}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`status-${rec.id}`}
                        checked={rec.status === 'DITERAPKAN'}
                        onChange={() => handleUpdateRencana(rec.id, 'status', 'DITERAPKAN')}
                      />
                      <span className="font-semibold text-emerald-700">Diterapkan</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`status-${rec.id}`}
                        checked={rec.status === 'TIDAK_DITERAPKAN'}
                        onChange={() => handleUpdateRencana(rec.id, 'status', 'TIDAK_DITERAPKAN')}
                      />
                      <span className="font-semibold text-rose-700">Tidak Diterapkan</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    Catatan Penerapan pada RPS Baru (Wajib diisi):
                  </label>
                  <input
                    type="text"
                    value={rec.catatanPenerapan}
                    onChange={(e) => handleUpdateRencana(rec.id, 'catatanPenerapan', e.target.value)}
                    placeholder="Jelaskan di bagian mana usulan perbaikan diakomodasi..."
                    className="input-field py-1.5 px-3 text-xs"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
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
            {submitted ? 'Terkirim...' : 'Kirim Pengajuan RPS'}
          </button>
        </div>
      </form>
    </div>
  );
}

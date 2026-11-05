'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, UserCheck, Download, FileText, Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';

export default function Page() {
  const { id } = useParams<{ id: string }>();

  const [rps] = useState({
    id: id || 'rps-01',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    sks: 3,
    periode: '2025/2026 - Ganjil',
    dosenPengampu: 'Dr. Rina Fitriani, M.Kom.',
    versi: 2,
    status: 'DISAHKAN',
    disahkanOleh: 'Dr. Ahmad Fauzi (Kaprodi)',
    disahkanAt: '2025-08-25',
    reviewer: 'Ir. Bambang Tri, Ph.D.',
    rekomendasi: 'DISETUJUI',
    catatanReviewer: 'Seluruh komponen CPL-CPMK telah selaras dengan standar IEEE CS curricula 2023.',
    pilarHasil: [
      { pilar: '1. Keselarasan CPL – CPMK – Sub CPMK', hasil: 'SESUAI' },
      { pilar: '2. Bahan Kajian & Kedalaman Materi', hasil: 'SESUAI' },
      { pilar: '3. Metode & Skenario Pembelajaran', hasil: 'SESUAI' },
      { pilar: '4. Bentuk & Bobot Penilaian Asesmen', hasil: 'SESUAI' },
      { pilar: '5. Referensi Pustaka Terkini', hasil: 'SESUAI' },
    ],
  });

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
        title={`${rps.kodeMk} — ${rps.namaMk}`}
        description={`Dokumen RPS Semester ${rps.periode} • Versi ${rps.versi}.0`}
        badge={<StatusBadge status={rps.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Download size={14} /> Unduh Berkas RPS (PDF)
            </button>
          </div>
        }
      />

      {/* Ringkasan Status & Dosen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Informasi Dokumen RPS
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Dosen Pengampu Utama:</span>
              <span className="font-semibold text-slate-800">{rps.dosenPengampu}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Bobot Mata Kuliah:</span>
              <span className="font-semibold text-slate-800">{rps.sks} SKS</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Dosen Reviewer:</span>
              <span className="font-medium text-slate-800">{rps.reviewer}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Status Pengesahan:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Disahkan oleh {rps.disahkanOleh} ({formatDateShort(rps.disahkanAt)})
              </span>
            </div>
          </div>
        </div>

        <div className="card space-y-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Riwayat Versi Berkas
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 flex justify-between items-center">
              <div>
                <span className="font-bold text-blue-700">Versi 2.0 (Aktif)</span>
                <div className="text-[10px] text-slate-400">Diunggah: 2025-08-20</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Disahkan</span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center text-slate-500">
              <div>
                <span className="font-medium">Versi 1.0</span>
                <div className="text-[10px] text-slate-400">Diunggah: 2025-08-01</div>
              </div>
              <span className="text-[10px]">Perlu Revisi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hasil Review 5 Pilar Mutu */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Hasil Telaah Reviewer — Instrumen 5 Pilar Mutu (FR-23)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reviewer: <strong>{rps.reviewer}</strong> • Rekomendasi:{' '}
              <strong className="text-emerald-700">{rps.rekomendasi}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            5 / 5 Sesuai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {rps.pilarHasil.map((p, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="font-medium text-slate-800">{p.pilar}</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-flex items-center gap-1">
                <Check size={11} /> {p.hasil}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs">
          <span className="font-semibold text-slate-700 block mb-1">Catatan Evaluasi Reviewer:</span>
          <p className="text-slate-600 italic leading-relaxed">"{rps.catatanReviewer}"</p>
        </div>
      </div>
    </div>
  );
}

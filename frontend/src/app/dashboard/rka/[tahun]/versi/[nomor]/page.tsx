'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, GitCompare, Check, X, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function Page() {
  const { tahun, nomor } = useParams<{ tahun: string; nomor: string }>();
  const router = useRouter();

  const [version] = useState({
    nomor: Number(nomor) || 2,
    tahun: tahun || '2025',
    status: 'DIAJUKAN',
    totalPagu: 485000000,
    diajukanOleh: 'Dr. Andi Wijaya, M.Kom.',
    diajukanAt: '2025-03-15',
    alasanRevisi: 'Penambahan alokasi pengadaan server cloud laboratorium dan workshop MBKM.',
    diffs: [
      {
        tipe: 'TAMBAH',
        kode: 'POS-02-01',
        uraian: 'Pengadaan Server Rak Komputasi Awan (PNBP)',
        sebelum: 0,
        sesudah: 45000000,
      },
      {
        tipe: 'UBAH',
        kode: 'POS-01-01',
        uraian: 'Honorarium Pakar Eksternal Kurikulum',
        sebelum: 4000000,
        sesudah: 6000000,
      },
      {
        tipe: 'UBAH',
        kode: 'POS-03-02',
        uraian: 'Pengadaan ATK & Modul Praktikum',
        sebelum: 12000000,
        sesudah: 9000000,
      },
    ],
  });

  const handleDecision = (decision: 'DISETUJUI' | 'PERLU_REVISI') => {
    alert(`Keputusan ${decision} berhasil disimpan.`);
    router.push(`/dashboard/rka/${tahun || '2025'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
      </div>

      <PageHeader
        title={`Riwayat Versi RKA — Versi ${version.nomor} (${version.tahun})`}
        description="Arsip dan perbandingan perubahan antar versi rencana kerja anggaran (FR-40)."
        badge={<StatusBadge status={version.status} size="sm" />}
        actions={
          version.status === 'DIAJUKAN' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecision('PERLU_REVISI')}
                className="btn-secondary text-xs px-3 py-1.5 text-amber-700 hover:bg-amber-50"
              >
                Minta Revisi
              </button>
              <button
                onClick={() => handleDecision('DISETUJUI')}
                className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Setujui Versi Ini
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Info Versi */}
      <div className="card space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Informasi Pengajuan Versi
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Nomor Versi:</span>
            <span className="font-bold text-slate-800 font-mono text-sm">Versi #{version.nomor}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Pagu Versi:</span>
            <span className="font-bold text-blue-700 font-mono text-sm">{formatRupiah(version.totalPagu)}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Diajukan Oleh:</span>
            <span className="font-medium text-slate-800">{version.diajukanOleh}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Tanggal Pengajuan:</span>
            <span className="font-medium text-slate-800">{formatDateShort(version.diajukanAt)}</span>
          </div>
          <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold">Alasan Revisi / Pembaruan:</span>
            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
              {version.alasanRevisi}
            </p>
          </div>
        </div>
      </div>

      {/* Perbandingan Perubahan (Diff Viewer) */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Perbandingan Perubahan terhadap Versi Sebelumnya (Diff)
          </h3>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {version.diffs.map((d, i) => (
            <div key={i} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white hover:bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.tipe === 'TAMBAH'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {d.tipe}
                </span>
                <div>
                  <span className="font-mono font-bold text-slate-500 mr-2">{d.kode}</span>
                  <span className="font-semibold text-slate-800">{d.uraian}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs self-end sm:self-auto">
                {d.sebelum > 0 && (
                  <span className="text-slate-400 line-through">{formatRupiah(d.sebelum)}</span>
                )}
                <span className="font-bold text-slate-900">{formatRupiah(d.sesudah)}</span>
                <span className={`text-[11px] font-bold ${d.sesudah >= d.sebelum ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({d.sesudah >= d.sebelum ? '+' : ''}{formatRupiah(d.sesudah - d.sebelum)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

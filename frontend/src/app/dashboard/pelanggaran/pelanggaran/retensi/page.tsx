'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { mockViolationRetentionLogs } from '@/lib/mock-data';
import type { ViolationRetentionLog } from '@/lib/types';
import {
  ArrowLeft,
  ShieldCheck,
  Trash2,
  Lock,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function RetensiPelanggaranPage() {
  const [logs, setLogs] = useState<ViolationRetentionLog[]>(mockViolationRetentionLogs);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleRunRetentionSync = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setToastMsg('Sinkronisasi status SIAKAD berhasil diperiksa. Seluruh data mahasiswa aktif tetap aman; tidak ada data alumni baru yang perlu dipurgasi.');
      setTimeout(() => setToastMsg(null), 6000);
    }, 1200);
  };

  const columns = [
    {
      key: 'tanggal',
      header: 'Waktu Eksekusi Hapus',
      render: (row: ViolationRetentionLog) => (
        <span className="font-mono text-xs font-bold text-slate-800">{row.tanggal_hapus}</span>
      ),
    },
    {
      key: 'alasan',
      header: 'Status SIAKAD Pemicu',
      render: (row: ViolationRetentionLog) => (
        <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
          {row.alasan_status}
        </span>
      ),
    },
    {
      key: 'hash',
      header: 'Identitas Anonim Mahasiswa (Hash SHA-256)',
      render: (row: ViolationRetentionLog) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.mahasiswa_hash}
        </span>
      ),
    },
    {
      key: 'operator',
      header: 'Otorisator Sistem',
      render: (row: ViolationRetentionLog) => (
        <span className="text-xs text-slate-700 font-semibold">{row.operator}</span>
      ),
    },
    {
      key: 'audit',
      header: 'Catatan Audit Siklus Hidup Data',
      render: (row: ViolationRetentionLog) => (
        <p className="text-xs text-slate-600 max-w-md">{row.catatan_audit}</p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/pelanggaran" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Data Pelanggaran</span>
        </Link>
      </div>

      <PageHeader
        title="Log Retensi & Kebijakan Penghapusan Data (FR-13)"
        description="Sistem menghapus permanen data pelanggaran dan lampirannya ketika status mahasiswa tidak aktif lagi berdasarkan SIAKAD (lulus, mengundurkan diri, atau dikeluarkan). Cuti akademik tidak dihitung sebagai tidak aktif. Penghapusan dicatat dalam log tanpa menyimpan isi data yang dihapus (UU PDP No. 27/2022 & NF-05)."
        actions={
          <button
            onClick={handleRunRetentionSync}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Memeriksa SIAKAD...' : 'Jalankan Pemeriksaan Retensi'}</span>
          </button>
        }
      />

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-purple-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Compliance Information Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
          Kepatuhan Terhadap Regulasi Privasi Data (UU No. 27 Tahun 2022 & NF-05)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">1. Hak untuk Dilupakan</span>
            <p>Data catatan pelanggaran masa studi mahasiswa tidak boleh disimpan permanen setelah alumni lulus atau mengakhiri studi.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">2. Pengecualian Cuti Akademik</span>
            <p>Mahasiswa yang berstatus cuti akademik tetap dihitung sebagai mahasiswa aktif, sehingga catatan sanksinya tidak dihapus.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">3. Sanitasi Log Audit</span>
            <p>Log audit hanya mencatat hash verifikasi dan status pemicu tanpa menyimpan salinan isi kasus pelanggaran yang dihapus.</p>
          </div>
        </div>
      </div>

      {/* Table of Retention Logs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Buku Catatan Audit Penghapusan Data Permanen (Immutable)</h3>
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Cari riwayat retensi..."
          searchKey="catatan_audit"
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { mockViolationRetentionLogs } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { ViolationRetentionLog } from '@/lib/types';
import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react';

export default function LogRetensiPelanggaranPage() {
  const [retentionLogs, setRetentionLogs] = useState<ViolationRetentionLog[]>(
    mockViolationRetentionLogs
  );

  useEffect(() => {
    const sync = () => {
      setRetentionLogs(
        storageSync.get<ViolationRetentionLog[]>(
          STORAGE_KEYS.VIOLATION_RETENTION_LOGS,
          mockViolationRetentionLogs
        )
      );
    };
    sync();
    window.addEventListener('simpro_storage_change', sync);
    return () => window.removeEventListener('simpro_storage_change', sync);
  }, []);

  const columns: DataTableColumn<ViolationRetentionLog>[] = [
    {
      key: 'tanggal_hapus',
      header: 'Waktu Penghapusan',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.tanggal_hapus}
        </span>
      ),
    },
    {
      key: 'alasan_status',
      header: 'Status Pemicu Retensi',
      render: (row) => {
        const label =
          row.alasan_status === 'LULUS'
            ? 'Lulus Yudisium'
            : row.alasan_status === 'MENGUNDURKAN_DIRI'
              ? 'Mengundurkan Diri'
              : 'Keluar';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              row.alasan_status === 'LULUS'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: 'mahasiswa_hash',
      header: 'Identitas Anonim (SHA-256)',
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
          {row.mahasiswa_hash}
        </span>
      ),
    },
    {
      key: 'operator',
      header: 'Operator Pelaksana',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">{row.operator}</span>
      ),
    },
    {
      key: 'catatan_audit',
      header: 'Catatan Audit UU PDP',
      render: (row) => (
        <p className="text-xs text-slate-600 max-w-md leading-relaxed">
          {row.catatan_audit}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href="/dashboard/pelanggaran"
          className="hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Data Pelanggaran</span>
        </Link>
      </div>

      <PageHeader
        title="Log Retensi & Penghapusan Data (UU PDP)"
        description="Jejak audit penghapusan permanen data pelanggaran mahasiswa yang telah lulus atau keluar untuk memenuhi kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi."
      />

      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900 space-y-1">
          <p className="font-bold">Kebijakan Retensi Data Pelanggaran (UU PDP Pasal 45)</p>
          <p className="text-xs text-blue-800 leading-relaxed">
            Seluruh rekaman kasus pelanggaran dan berkas sanksi sosial dihapus permanen setelah mahasiswa berstatus Lulus, Keluar, atau Mengundurkan Diri. Hanya hash anonim dan metadata audit ini yang disimpan sebagai bukti kepatuhan tata kelola.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Rekaman Dihapus"
          value={retentionLogs.length.toString()}
          description="Sesuai siklus kelulusan / mutasi"
          icon={<ShieldCheck size={16} />}
          badgeTone="emerald"
        />
        <StatCard
          title="Pemicu Yudisium Lulus"
          value={retentionLogs.filter((l) => l.alasan_status === 'LULUS').length.toString()}
          description="Penghapusan otomatis pasca-lulus"
          icon={<FileText size={16} />}
          badgeTone="blue"
        />
        <StatCard
          title="Pemicu Keluar / Mutasi"
          value={retentionLogs.filter((l) => l.alasan_status !== 'LULUS').length.toString()}
          description="Penghapusan data non-aktif"
          icon={<Lock size={16} />}
          badgeTone="slate"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Riwayat Audit Penghapusan Data Pribadi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log bersifat read-only dan tidak menyimpan nama ataupun NIM mahasiswa yang telah dihapus.
          </p>
        </div>

        <DataTable
          data={retentionLogs}
          columns={columns}
          emptyMessage="Belum ada log retensi penghapusan data."
        />
      </div>
    </div>
  );
}

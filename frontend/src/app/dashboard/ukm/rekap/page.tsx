'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import {
  mockUkmParticipationStats,
  mockUkmDirectories,
  mockUkmMemberships,
} from '@/lib/mock-data';
import type { UkmDirectory } from '@/lib/types';
import {
  ArrowLeft,
  FileDown,
  PieChart,
  Users,
  Compass,
  Trophy,
  CheckCircle2,
  FileText,
  Calendar,
} from 'lucide-react';

export default function RekapUkmPage() {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState('2024/2025 - Ganjil');
  const stats = mockUkmParticipationStats;
  const ukms = mockUkmDirectories;
  const verifiedMembers = mockUkmMemberships.filter((m) => m.status === 'TERVERIFIKASI');

  const totalMhsAll = stats.reduce((acc, s) => acc + s.total_mahasiswa_angkatan, 0);
  const totalAktifAll = stats.reduce((acc, s) => acc + s.mahasiswa_aktif_ukm, 0);
  const aggregatePercent = Math.round((totalAktifAll / totalMhsAll) * 100);

  const handleExportExcel = () => {
    setExportMessage('Rekapitulasi Partisipasi Mahasiswa pada UKM berhasil diekspor ke format Excel (.xlsx)!');
    setTimeout(() => setExportMessage(null), 5000);
  };

  const handleExportPdf = () => {
    setExportMessage('Laporan Rekapitulasi Partisipasi Mahasiswa pada UKM berhasil diekspor ke format PDF (.pdf)!');
    setTimeout(() => setExportMessage(null), 5000);
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama UKM & Kode',
      render: (row: UkmDirectory) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.nama_ukm}</span>
          <p className="text-[11px] text-slate-500 font-mono">{row.kode_ukm}</p>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (row: UkmDirectory) => (
        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
          {row.kategori}
        </span>
      ),
    },
    {
      key: 'anggota',
      header: 'Anggota Terverifikasi',
      render: (row: UkmDirectory) => (
        <span className="font-extrabold text-blue-700 text-xs sm:text-sm">
          {row.jumlah_anggota_aktif} Mahasiswa
        </span>
      ),
    },
    {
      key: 'pembina',
      header: 'Dosen Pembina & Ketua',
      render: (row: UkmDirectory) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800">{row.dosen_pembina_nama}</p>
          <p className="text-[11px] text-slate-500">{row.ketua_nama} ({row.ketua_nim})</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: UkmDirectory) => <StatusBadge status={row.status_aktif} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/ukm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Direktori UKM</span>
        </Link>
      </div>

      <PageHeader
        title="Rekap Partisipasi Mahasiswa di UKM (FR-16)"
        description="Sistem menampilkan rekapitulasi anggota terverifikasi per UKM serta rasio dan persentase keterlibatan mahasiswa prodi yang aktif di UKM per angkatan dan per tahun akademik (sinkronisasi data induk SIAKAD)."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
              title="Ekspor ke format Spreadsheet Microsoft Excel"
            >
              <FileDown className="h-4 w-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs transition-colors"
              title="Ekspor Laporan Cetak PDF (BPMN Diagram 3)"
            >
              <FileText className="h-4 w-4" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        }
      />

      {exportMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{exportMessage}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Filter Tahun Akademik (FR-16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-bold text-slate-700">Tahun Akademik:</span>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold"
          >
            <option value="2024/2025 - Ganjil">2024/2025 - Ganjil (Aktif)</option>
            <option value="2023/2024 - Genap">2023/2024 - Genap</option>
            <option value="2023/2024 - Ganjil">2023/2024 - Ganjil</option>
          </select>
        </div>
        <span className="text-slate-500 font-medium">
          Data Induk Mahasiswa Terhubung dengan SIAKAD (NF-10, NF-12)
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mahasiswa Prodi"
          value={totalMhsAll.toString()}
          description="Seluruh angkatan aktif"
          icon="Users"
        />
        <StatCard
          title="Mahasiswa Aktif UKM"
          value={totalAktifAll.toString()}
          description="Terdaftar resmi & terverifikasi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Tingkat Partisipasi Agregat"
          value={`${aggregatePercent}%`}
          description="Rasio mahasiswa berkegiatan"
          icon="PieChart"
        />
        <StatCard
          title="Total Organisasi UKM"
          value={ukms.length.toString()}
          description="Unit aktif di lingkungan prodi"
          icon="Compass"
        />
      </div>

      {/* Cohort Breakdown (FR-16) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Persentase Partisipasi Mahasiswa Aktif di UKM per Angkatan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Data keterlibatan kemahasiswaan untuk pemenuhan kriteria akreditasi program studi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item) => (
            <div key={item.angkatan} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Angkatan {item.angkatan}</span>
                <span className="text-sm font-extrabold text-blue-700">{item.persentase_aktif}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${item.persentase_aktif}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">
                <strong>{item.mahasiswa_aktif_ukm}</strong> dari {item.total_mahasiswa_angkatan} mahasiswa aktif di UKM
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table of UKMs with verified count */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Distribusi Keanggotaan Terverifikasi per UKM</h3>
        <DataTable
          data={ukms}
          columns={columns}
          searchPlaceholder="Cari UKM atau kategori..."
          searchKey="nama_ukm"
        />
      </div>
    </div>
  );
}

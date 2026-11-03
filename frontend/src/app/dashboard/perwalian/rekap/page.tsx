'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import {
  mockClassPerwalianReports,
  mockDosenWaliSessions,
  mockPerwalianRecurringIssues,
} from '@/lib/mock-data';
import type { PerwalianRecurringIssue } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  FileDown,
  Printer,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle2,
  Users,
  Building,
} from 'lucide-react';

export default function RekapPerwalianPage() {
  const [selectedSemester, setSelectedSemester] = useState('2024/2025 GANJIL');
  const [selectedAngkatan, setSelectedAngkatan] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const recurringIssues = mockPerwalianRecurringIssues;
  const verifiedReports = mockClassPerwalianReports.filter((r) => r.status === 'TERVERIFIKASI');

  const handleExport = (format: 'PDF' | 'WORD') => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Laporan Perwalian Terpadu (${format}) Semester ${selectedSemester} berhasil di-generate! File siap diunduh.`);
    }, 1200);
  };

  const issueColumns = [
    {
      key: 'isu',
      header: 'Isu / Keluhan Berulang',
      render: (row: PerwalianRecurringIssue) => (
        <div className="space-y-1">
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{row.isu}</p>
          <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            Kategori: {row.kategori}
          </span>
        </div>
      ),
    },
    {
      key: 'kemunculan',
      header: 'Frekuensi Kemunculan',
      render: (row: PerwalianRecurringIssue) => (
        <span className="font-extrabold text-blue-700 text-sm bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
          {row.jumlah_kemunculan} Kelas
        </span>
      ),
    },
    {
      key: 'kelas',
      header: 'Kelas Terdampak',
      render: (row: PerwalianRecurringIssue) => (
        <div className="flex flex-wrap gap-1">
          {row.kelas_terdampak.map((k) => (
            <span key={k} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {k}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'urgensi',
      header: 'Tingkat Urgensi',
      render: (row: PerwalianRecurringIssue) => (
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            row.tingkat_urgensi === 'TINGGI'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : row.tingkat_urgensi === 'SEDANG'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {row.tingkat_urgensi}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/perwalian" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Laporan Perwalian</span>
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Laporan & Analisis Isu Berulang (FR-03)"
        description="Pembangkitan dokumen kompilasi laporan perwalian (PDF/Word) yang menggabungkan laporan ketua kelas dan sesi dosen wali, serta rekapitulasi isu berulang bagi Kaprodi."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('PDF')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <FileDown className="h-4 w-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('WORD')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              <FileText className="h-4 w-4 text-white" />
              <span>Export Word (.docx)</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Isu Berulang Aktif"
          value={recurringIssues.length.toString()}
          description="Memerlukan tindak lanjut Kaprodi"
          icon="AlertTriangle"
        />
        <StatCard
          title="Laporan Terkompilasi"
          value={verifiedReports.length.toString()}
          description="Gabungan Ketua Kelas & Dosen Wali"
          icon="CheckCircle2"
        />
        <StatCard
          title="Tingkat Kepatuhan"
          value="85%"
          description="Pengisian tepat waktu semester ini"
          icon="Users"
        />
        <StatCard
          title="Target Rapat Prodi"
          value="4 Agenda"
          description="Solusi fasilitas & kurikulum"
          icon="Building"
        />
      </div>

      {/* Section 1: Rekap Isu Berulang bagi Kaprodi */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Rekapitulasi Isu yang Muncul Berulang (Kaprodi View)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sistem mendeteksi topik kendala akademik, fasilitas, dan kehadiran yang disampaikan oleh lebih dari satu kelas perwalian.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Periode:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="2024/2025 GANJIL">2024/2025 Ganjil</option>
              <option value="2023/2024 GENAP">2023/2024 Genap</option>
            </select>
          </div>
        </div>

        <DataTable
          data={recurringIssues}
          columns={issueColumns}
          searchPlaceholder="Cari isu berulang atau kelas..."
          searchKey="isu"
        />
      </div>

      {/* Section 2: Kompilasi Laporan Perwalian Terpadu */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Laporan Terpadu yang Siap Cetak / Diterbitkan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Laporan per kelas dan angkatan yang telah diverifikasi dosen wali dan dilengkapi notulen sesi bimbingan.
          </p>
        </div>

        <div className="space-y-4">
          {verifiedReports.map((report) => {
            const sessions = mockDosenWaliSessions.filter((s) => s.kelas === report.kelas);
            return (
              <div key={report.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Kelas: {report.kelas} — Angkatan {report.angkatan}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Ketua Kelas: <strong>{report.ketua_kelas_nama}</strong> • Dosen Wali: <strong>{report.dosen_wali_nama}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} size="sm" />
                    <button
                      onClick={() => handleExport('PDF')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Cetak Kelas Ini</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-blue-800 block">Bagian 1: Laporan Ketua Kelas (FR-01)</span>
                    <p className="text-slate-700"><strong>Kondisi Umum:</strong> {report.kondisi_umum}</p>
                    <p className="text-slate-700"><strong>Kendala Akademik:</strong> {report.kendala_akademik}</p>
                    <p className="text-slate-700"><strong>Kendala Fasilitas:</strong> {report.kendala_non_akademik}</p>
                    <p className="text-slate-700"><strong>Aspirasi Mahasiswa:</strong> {report.aspirasi_mahasiswa}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-emerald-800 block">Bagian 2: Hasil Sesi Dosen Wali (FR-02)</span>
                    {sessions.length > 0 ? (
                      sessions.map((sess) => (
                        <div key={sess.id} className="space-y-1">
                          <p className="text-slate-800 font-semibold">{sess.sesi.replace('_', ' ')} ({formatDate(sess.tanggal_sesi)}):</p>
                          <p className="text-slate-600">Presensi: {sess.hadir_mahasiswa}/{sess.total_mahasiswa} mahasiswa hadir.</p>
                          <p className="text-slate-600"><strong>Rekomendasi:</strong> {sess.rekomendasi}</p>
                          <p className="text-slate-600"><strong>Tindak Lanjut:</strong> {sess.rencana_tindak_lanjut}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Belum ada sesi bimbingan yang selesai dicatat.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

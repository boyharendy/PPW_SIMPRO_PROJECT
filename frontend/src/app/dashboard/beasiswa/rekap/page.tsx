'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import { mockScholarshipRecipients } from '@/lib/mock-data';
import type { ScholarshipRecipient } from '@/lib/types';
import {
  ArrowLeft,
  FileDown,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PieChart,
  Award,
} from 'lucide-react';

export default function RekapBeasiswaPage() {
  const [recipients] = useState<ScholarshipRecipient[]>(mockScholarshipRecipients);
  const [filterRisiko, setFilterRisiko] = useState<boolean | 'ALL'>('ALL');

  const filtered = recipients.filter((r) => {
    if (filterRisiko === true) return r.is_berisiko;
    if (filterRisiko === false) return !r.is_berisiko;
    return true;
  });

  const totalKewajiban = recipients.reduce((acc, r) => acc + r.kewajiban_jam, 0);
  const totalTerverifikasi = recipients.reduce((acc, r) => acc + r.jam_terverifikasi, 0);
  const aggregatePercent = Math.round((totalTerverifikasi / totalKewajiban) * 100);
  const totalBerisiko = recipients.filter((r) => r.is_berisiko).length;

  const handleExport = () => {
    alert('Rekap Pemenuhan Jam Karya Mahasiswa Beasiswa berhasil diekspor ke format Excel (.xlsx)!');
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penerima',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500">NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'beasiswa',
      header: 'Jenis Beasiswa & Lembaga',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-xs">{row.jenis_beasiswa}</span>
          <p className="text-[11px] text-slate-500">{row.pemberi_beasiswa}</p>
        </div>
      ),
    },
    {
      key: 'kewajiban',
      header: 'Kewajiban Jam',
      render: (row: ScholarshipRecipient) => (
        <span className="font-bold text-slate-800 text-xs">{row.kewajiban_jam} Jam</span>
      ),
    },
    {
      key: 'terverifikasi',
      header: 'Jam Terverifikasi',
      render: (row: ScholarshipRecipient) => (
        <span className="font-bold text-emerald-700 text-xs">{row.jam_terverifikasi} Jam</span>
      ),
    },
    {
      key: 'sisa',
      header: 'Sisa Jam',
      render: (row: ScholarshipRecipient) => {
        const sisa = Math.max(0, row.kewajiban_jam - row.jam_terverifikasi);
        return (
          <span className={`font-bold text-xs ${sisa === 0 ? 'text-slate-400' : 'text-amber-700'}`}>
            {sisa} Jam
          </span>
        );
      },
    },
    {
      key: 'persen',
      header: 'Persentase & Risiko',
      render: (row: ScholarshipRecipient) => {
        const pct = Math.min(100, Math.round((row.jam_terverifikasi / row.kewajiban_jam) * 100));
        return (
          <div className="space-y-1 min-w-[130px]">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-extrabold ${pct >= 100 ? 'text-emerald-700' : row.is_berisiko ? 'text-rose-700' : 'text-blue-700'}`}>
                {pct}%
              </span>
              {row.is_berisiko && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                  Beresiko
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 100 ? 'bg-emerald-500' : row.is_berisiko ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'verifikator',
      header: 'Dosen Verifikator',
      render: (row: ScholarshipRecipient) => (
        <span className="text-xs text-slate-700">{row.dosen_verifikator_nama}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/beasiswa" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Beasiswa</span>
        </Link>
      </div>

      <PageHeader
        title="Rekapitulasi Pemenuhan Jam Karya Beasiswa (FR-08)"
        description="Monitoring agregat pemenuhan jam karya mahasiswa beasiswa, kalkulasi persentase pencapaian, dan penandaan dini mahasiswa yang berisiko tidak memenuhi kewajiban."
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <FileDown className="h-4 w-4 text-emerald-600" />
            <span>Ekspor Rekap Excel</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kewajiban Jam Keseluruhan"
          value={`${totalKewajiban} Jam`}
          description="Total beban jam karya prodi"
          icon="Award"
        />
        <StatCard
          title="Jam Karya Terverifikasi"
          value={`${totalTerverifikasi} Jam`}
          description="Disetujui dosen verifikator"
          icon="CheckCircle2"
        />
        <StatCard
          title="Persentase Pemenuhan"
          value={`${aggregatePercent}%`}
          description="Rata-rata ketercapaian"
          icon="PieChart"
        />
        <StatCard
          title="Mahasiswa Berisiko"
          value={totalBerisiko.toString()}
          description="Progres lambat < 50% di paruh semester"
          icon="AlertTriangle"
        />
      </div>

      {/* Filter and Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tampilan:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilterRisiko('ALL')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterRisiko === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Mahasiswa ({recipients.length})
              </button>
              <button
                onClick={() => setFilterRisiko(true)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterRisiko === true
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berisiko Saja ({totalBerisiko})
              </button>
            </div>
          </div>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Cari mahasiswa atau jenis beasiswa..."
          searchKey="mahasiswa_nama"
        />
      </div>
    </div>
  );
}

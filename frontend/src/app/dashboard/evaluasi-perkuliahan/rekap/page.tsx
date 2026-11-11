'use client';

import React, { useState } from 'react';
import { BarChart3, CheckCircle2, TrendingUp, Users, Award, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RecapEvalRow {
  id: string;
  kodeMk: string;
  namaMk: string;
  kelas: string;
  dosen: string;
  status: string;
  cpmkRatio: string;
  cpmkPct: number;
  kesesuaianRps: string;
  catatanGkm: string;
}

const MOCK_RECAP_EVAL: RecapEvalRow[] = [
  {
    id: 'e-1',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    kelas: 'Kelas A',
    dosen: 'Dr. Rina Fitriani, M.Kom.',
    status: 'DITINJAU',
    cpmkRatio: '4 / 4',
    cpmkPct: 100,
    kesesuaianRps: 'SESUAI',
    catatanGkm: 'Pencapaian CPL sangat baik, rencana perbaikan disetujui untuk siklus RPS berikutnya.',
  },
  {
    id: 'e-2',
    kodeMk: 'SI-302',
    namaMk: 'Manajemen Basis Data Enterprise',
    kelas: 'Kelas B',
    dosen: 'Siti Aminah, S.Kom., M.T.',
    status: 'TERKIRIM',
    cpmkRatio: '3 / 4',
    cpmkPct: 75,
    kesesuaianRps: 'SEBAGIAN',
    catatanGkm: 'Perlu penyesuaian bobot asesmen praktikum pada CPMK-4.',
  },
  {
    id: 'e-3',
    kodeMk: 'SI-204',
    namaMk: 'Algoritma & Struktur Data Lanjut',
    kelas: 'Kelas A',
    dosen: 'Agus Prasetyo, M.T.',
    status: 'DRAF',
    cpmkRatio: '2 / 4',
    cpmkPct: 50,
    kesesuaianRps: 'SEBAGIAN',
    catatanGkm: 'Menunggu finalisasi distribusi nilai UAS oleh dosen pengampu.',
  },
  {
    id: 'e-4',
    kodeMk: 'SI-101',
    namaMk: 'Pengantar Sistem Informasi',
    kelas: 'Kelas C',
    dosen: 'Dr. Ahmad Fauzi',
    status: 'DITINJAU',
    cpmkRatio: '3 / 3',
    cpmkPct: 100,
    kesesuaianRps: 'SESUAI',
    catatanGkm: 'Hasil EDOM dan evaluasi dosen selaras dan memuaskan.',
  },
];

export default function Page() {
  const columns: DataTableColumn<RecapEvalRow>[] = [
    {
      key: 'mk',
      header: 'Mata Kuliah & Kelas',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-blue-600">{r.kodeMk}</span>
            <span className="font-semibold text-slate-800 text-sm">{r.namaMk}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{r.kelas} • Dosen: {r.dosen}</div>
        </div>
      ),
    },
    {
      key: 'cpmk',
      header: 'Ketercapaian CPMK',
      render: (r) => (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-800">{r.cpmkRatio}</span>
            <span className="font-semibold text-blue-600">{r.cpmkPct}%</span>
          </div>
          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${r.cpmkPct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full`}
              style={{ width: `${r.cpmkPct}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'kesesuaianRps',
      header: 'Kesesuaian RPS',
      render: (r) => <StatusBadge status={r.kesesuaianRps} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status Evaluasi',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'catatanGkm',
      header: 'Catatan Peninjauan GKM',
      render: (r) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-xs" title={r.catatanGkm}>
          {r.catatanGkm}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap CPMK & Evaluasi"
        description="Rekapitulasi pencapaian CPMK dan catatan tindak lanjut perbaikan mutu mata kuliah (FR-45, FR-46)."
        actions={<ExportMenu filename="rekap-cpmk-evaluasi-prodi" />}
      />

      {/* 3 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Kelas Dibuka"
          value="42 Kelas"
          subtitle="Semester Ganjil 2024/2025"
          badgeTone="blue"
          icon={<Users size={16} />}
        />
        <StatCard
          title="Ketercapaian CPMK Rata-rata"
          value="84.5%"
          subtitle="Target minimal prodi 70%"
          badgeTone="emerald"
          badgeText="Target Terlampaui"
          icon={<Award size={16} />}
        />
        <StatCard
          title="Evaluasi Ditinjau GKM"
          value="36 / 42 Kelas"
          subtitle="85.7% kepatuhan pengisian"
          badgeTone="indigo"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <div className="card">
        <DataTable columns={columns} data={MOCK_RECAP_EVAL} />
      </div>
    </div>
  );
}

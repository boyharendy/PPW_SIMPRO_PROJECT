'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RpsRecapItem {
  id: string;
  kodeMk: string;
  namaMk: string;
  sks: number;
  dosen: string;
  status: string;
  versi: string;
  reviewer: string;
}

const MOCK_RECAP_RPS: RpsRecapItem[] = [
  {
    id: 'r-01',
    kodeMk: 'SI-101',
    namaMk: 'Pengantar Sistem Informasi',
    sks: 3,
    dosen: 'Dr. Ahmad Fauzi',
    status: 'DISAHKAN',
    versi: 'v2.0',
    reviewer: 'Ir. Bambang Tri, Ph.D.',
  },
  {
    id: 'r-02',
    kodeMk: 'SI-201',
    namaMk: 'Struktur Data & Algoritma',
    sks: 4,
    dosen: 'Agus Prasetyo, M.T.',
    status: 'DISAHKAN',
    versi: 'v2.0',
    reviewer: 'Dr. Rina Fitriani',
  },
  {
    id: 'r-03',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    sks: 3,
    dosen: 'Dr. Rina Fitriani, M.Kom.',
    status: 'DISAHKAN',
    versi: 'v2.0',
    reviewer: 'Ir. Bambang Tri, Ph.D.',
  },
  {
    id: 'r-04',
    kodeMk: 'SI-302',
    namaMk: 'Manajemen Basis Data Enterprise',
    sks: 3,
    dosen: 'Siti Aminah, S.Kom., M.T.',
    status: 'DIREVIEW',
    versi: 'v1.0',
    reviewer: 'Dr. Budi Santoso',
  },
  {
    id: 'r-05',
    kodeMk: 'SI-405',
    namaMk: 'Audit Sistem Informasi & Tata Kelola IT',
    sks: 3,
    dosen: 'Dewi Kartika, M.Sc.',
    status: 'DIAJUKAN',
    versi: 'v1.0',
    reviewer: 'Belum Ditugaskan',
  },
  {
    id: 'r-06',
    kodeMk: 'SI-410',
    namaMk: 'Kapita Selekta Sistem Informasi',
    sks: 2,
    dosen: 'Dr. Budi Santoso, M.Kom.',
    status: 'BELUM',
    versi: '-',
    reviewer: '-',
  },
];

export default function Page() {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? MOCK_RECAP_RPS
    : MOCK_RECAP_RPS.filter((r) => (filter === 'DISAHKAN' ? r.status === 'DISAHKAN' : r.status !== 'DISAHKAN'));

  const columns: DataTableColumn<RpsRecapItem>[] = [
    {
      key: 'mk',
      header: 'Kode & Nama Mata Kuliah',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-600 mr-2">{r.kodeMk}</span>
          <span className="font-semibold text-slate-800 text-sm">{r.namaMk}</span>
          <div className="text-xs text-slate-400 mt-0.5">{r.sks} SKS</div>
        </div>
      ),
    },
    {
      key: 'dosen',
      header: 'Dosen Pengampu',
      render: (r) => <span className="text-sm font-medium text-slate-700">{r.dosen}</span>,
    },
    {
      key: 'versi',
      header: 'Versi',
      className: 'text-center',
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.versi}</span>,
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      render: (r) => <span className="text-xs text-slate-600">{r.reviewer}</span>,
    },
    {
      key: 'status',
      header: 'Status Kepatuhan RPS',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Status RPS"
        description="Monitoring kepatuhan pengumpulan dan persentase kelayakan RPS seluruh mata kuliah (FR-25)."
        actions={<ExportMenu filename="rekap-kepatuhan-rps-prodi" />}
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mata Kuliah"
          value="36 MK"
          subtitle="Semester Ganjil 2024/2025"
          badgeTone="blue"
          icon={<BookOpen size={16} />}
        />
        <StatCard
          title="RPS Disahkan"
          value="28 MK"
          subtitle="77.8% telah disahkan Kaprodi"
          badgeTone="emerald"
          badgeText="Sesuai Target"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Dalam Telaah / Revisi"
          value="5 MK"
          subtitle="Menunggu perbaikan pengampu"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Belum Mengajukan"
          value="3 MK"
          subtitle="Melewati batas tenggat"
          badgeTone="rose"
          badgeText="Perlu Pengingat"
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {['ALL', 'DISAHKAN', 'PENDING'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'Semua Mata Kuliah' : f === 'DISAHKAN' ? 'Telah Disahkan (28)' : 'Belum / Revisi (8)'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Monitoring kepatuhan RPS prodi
          </span>
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}

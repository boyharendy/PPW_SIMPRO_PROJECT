'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, CheckCircle2, Clock, Eye, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface RpsItem {
  id: string;
  kodeMk: string;
  namaMk: string;
  sks: number;
  dosenPengampu: string;
  versi: number;
  reviewer: string;
  status: 'DRAF' | 'DIAJUKAN' | 'DIREVIEW' | 'PERLU_REVISI' | 'DISETUJUI' | 'DISAHKAN';
}

const MOCK_RPS: RpsItem[] = [
  {
    id: 'rps-01',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    sks: 3,
    dosenPengampu: 'Dr. Rina Fitriani, M.Kom.',
    versi: 2,
    reviewer: 'Ir. Bambang Tri, Ph.D.',
    status: 'DISAHKAN',
  },
  {
    id: 'rps-02',
    kodeMk: 'SI-302',
    namaMk: 'Manajemen Basis Data Enterprise',
    sks: 3,
    dosenPengampu: 'Siti Aminah, S.Kom., M.T.',
    versi: 1,
    reviewer: 'Dr. Budi Santoso, M.Kom.',
    status: 'DIREVIEW',
  },
  {
    id: 'rps-03',
    kodeMk: 'SI-204',
    namaMk: 'Algoritma & Struktur Data Lanjut',
    sks: 4,
    dosenPengampu: 'Agus Prasetyo, M.T.',
    versi: 2,
    reviewer: 'Dr. Ahmad Fauzi (Kaprodi)',
    status: 'PERLU_REVISI',
  },
  {
    id: 'rps-04',
    kodeMk: 'SI-405',
    namaMk: 'Audit Sistem Informasi & Tata Kelola IT',
    sks: 3,
    dosenPengampu: 'Dewi Kartika, M.Sc.',
    versi: 1,
    reviewer: 'Belum Ditugaskan',
    status: 'DIAJUKAN',
  },
];

export default function Page() {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = filterStatus === 'ALL'
    ? MOCK_RPS
    : MOCK_RPS.filter((r) => r.status === filterStatus);

  const columns: DataTableColumn<RpsItem>[] = [
    {
      key: 'mk',
      header: 'Mata Kuliah',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600">{r.kodeMk}</span>
            <span className="font-semibold text-slate-800 text-sm">{r.namaMk}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{r.sks} SKS • Kurikulum 2024</div>
        </div>
      ),
    },
    {
      key: 'dosen',
      header: 'Dosen Pengampu',
      render: (r) => <span className="text-sm font-medium text-slate-700">{r.dosenPengampu}</span>,
    },
    {
      key: 'versi',
      header: 'Versi',
      className: 'w-20 text-center',
      render: (r) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          v{r.versi}.0
        </span>
      ),
    },
    {
      key: 'reviewer',
      header: 'Reviewer Ditugaskan',
      render: (r) => <span className="text-xs text-slate-600">{r.reviewer}</span>,
    },
    {
      key: 'status',
      header: 'Status Dokumen',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/rps/${r.id}`}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
        >
          <Eye size={12} /> Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan & Review RPS"
        description="Daftar Rencana Pembelajaran Semester per mata kuliah dan status telaah mutunya (FR-21)."
        actions={
          <Link href="/dashboard/rps/ajukan" className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={16} /> Ajukan RPS Baru
          </Link>
        }
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 flex-wrap">
            {['ALL', 'DIAJUKAN', 'DIREVIEW', 'PERLU_REVISI', 'DISAHKAN'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Menampilkan {filtered.length} dokumen RPS
          </span>
        </div>

        <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada dokumen RPS untuk filter ini." />
      </div>
    </div>
  );
}

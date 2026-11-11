'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, FileCheck, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';

interface RpsReviewTask {
  id: string;
  kodeMk: string;
  namaMk: string;
  sks: number;
  dosenPengampu: string;
  versi: number;
  tenggat: string;
  status: 'DITUGASKAN' | 'SELESAI';
  rekomendasi?: 'DISETUJUI' | 'PERLU_REVISI';
}

const MOCK_TASKS: RpsReviewTask[] = [
  {
    id: 'rps-02',
    kodeMk: 'SI-302',
    namaMk: 'Manajemen Basis Data Enterprise',
    sks: 3,
    dosenPengampu: 'Siti Aminah, S.Kom., M.T.',
    versi: 1,
    tenggat: '2025-11-20',
    status: 'DITUGASKAN',
  },
  {
    id: 'rps-04',
    kodeMk: 'SI-405',
    namaMk: 'Audit Sistem Informasi & Tata Kelola IT',
    sks: 3,
    dosenPengampu: 'Dewi Kartika, M.Sc.',
    versi: 1,
    tenggat: '2025-11-25',
    status: 'DITUGASKAN',
  },
  {
    id: 'rps-01',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    sks: 3,
    dosenPengampu: 'Dr. Rina Fitriani, M.Kom.',
    versi: 2,
    tenggat: '2025-08-22',
    status: 'SELESAI',
    rekomendasi: 'DISETUJUI',
  },
];

export default function Page() {
  const columns: DataTableColumn<RpsReviewTask>[] = [
    {
      key: 'mk',
      header: 'Mata Kuliah',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600">{r.kodeMk}</span>
            <span className="font-semibold text-slate-800 text-sm">{r.namaMk}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{r.sks} SKS • Dosen: {r.dosenPengampu}</div>
        </div>
      ),
    },
    {
      key: 'versi',
      header: 'Versi RPS',
      className: 'w-24 text-center',
      render: (r) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          v{r.versi}.0
        </span>
      ),
    },
    {
      key: 'tenggat',
      header: 'Tenggat Telaah',
      render: (r) => <span className="text-xs text-slate-600 font-medium">{formatDateShort(r.tenggat)}</span>,
    },
    {
      key: 'status',
      header: 'Status & Rekomendasi',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} size="sm" />
          {r.rekomendasi && (
            <div className="mt-1">
              <StatusBadge status={r.rekomendasi} size="sm" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/rps/review/${r.id}`}
          className={
            r.status === 'SELESAI'
              ? 'btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5'
              : 'btn-primary text-xs px-3 py-1 inline-flex items-center gap-1.5'
          }
        >
          {r.status === 'SELESAI' ? <Eye size={13} /> : <FileCheck size={13} />}
          {r.status === 'SELESAI' ? 'Detail' : 'Telaah RPS'}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Review RPS Saya"
        description="Daftar dokumen RPS yang ditugaskan kepada Anda untuk ditelaah berbasis 5 pilar mutu (FR-23)."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={MOCK_TASKS}
          emptyMessage="Tidak ada tugas review RPS saat ini."
        />
      </div>
    </div>
  );
}

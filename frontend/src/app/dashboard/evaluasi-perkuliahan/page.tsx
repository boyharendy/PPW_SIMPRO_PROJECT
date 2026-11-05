'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit3, BarChart3, Users, CheckCircle2, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface KelasEvaluasi {
  id: string;
  kodeMk: string;
  namaMk: string;
  kelas: string;
  dosen: string;
  peserta: number;
  cpmkTercapai: string;
  status: 'BELUM' | 'DRAF' | 'TERKIRIM' | 'DITINJAU';
}

const MOCK_KELAS: KelasEvaluasi[] = [
  {
    id: 'kls-01',
    kodeMk: 'SI-301',
    namaMk: 'Rekayasa Perangkat Lunak Berorientasi Objek',
    kelas: 'Kelas A',
    dosen: 'Dr. Rina Fitriani, M.Kom.',
    peserta: 38,
    cpmkTercapai: '4 / 4 (100%)',
    status: 'DITINJAU',
  },
  {
    id: 'kls-02',
    kodeMk: 'SI-302',
    namaMk: 'Manajemen Basis Data Enterprise',
    kelas: 'Kelas B',
    dosen: 'Siti Aminah, S.Kom., M.T.',
    peserta: 35,
    cpmkTercapai: '3 / 4 (75%)',
    status: 'TERKIRIM',
  },
  {
    id: 'kls-03',
    kodeMk: 'SI-204',
    namaMk: 'Algoritma & Struktur Data Lanjut',
    kelas: 'Kelas A',
    dosen: 'Agus Prasetyo, M.T.',
    peserta: 42,
    cpmkTercapai: '2 / 4 (50%)',
    status: 'DRAF',
  },
  {
    id: 'kls-04',
    kodeMk: 'SI-405',
    namaMk: 'Audit Sistem Informasi & Tata Kelola IT',
    kelas: 'Kelas A',
    dosen: 'Dewi Kartika, M.Sc.',
    peserta: 28,
    cpmkTercapai: '-',
    status: 'BELUM',
  },
];

export default function Page() {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = filterStatus === 'ALL'
    ? MOCK_KELAS
    : MOCK_KELAS.filter((k) => k.status === filterStatus);

  const columns: DataTableColumn<KelasEvaluasi>[] = [
    {
      key: 'mk',
      header: 'Mata Kuliah & Kelas',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600">{r.kodeMk}</span>
            <span className="font-semibold text-slate-800 text-sm">{r.namaMk}</span>
          </div>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            {r.kelas} • {r.peserta} Mahasiswa
          </span>
        </div>
      ),
    },
    {
      key: 'dosen',
      header: 'Dosen Pengampu',
      render: (r) => <span className="text-sm font-medium text-slate-700">{r.dosen}</span>,
    },
    {
      key: 'cpmk',
      header: 'Ketercapaian CPMK',
      render: (r) => (
        <span className="font-semibold text-xs text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
          {r.cpmkTercapai}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Pengisian',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/evaluasi-perkuliahan/${r.id}`}
          className="btn-primary text-xs px-3 py-1 inline-flex items-center gap-1.5"
        >
          {r.status === 'BELUM' || r.status === 'DRAF' ? <Edit3 size={12} /> : <Eye size={12} />}
          {r.status === 'BELUM' || r.status === 'DRAF' ? 'Isi Form' : 'Lihat Detail'}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluasi Perkuliahan"
        description="Monitoring kepatuhan dan status evaluasi proses perkuliahan semester berjalan (FR-43)."
        actions={
          <Link
            href="/dashboard/evaluasi-perkuliahan/rekap"
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <BarChart3 size={15} /> Rekap CPMK & Evaluasi
          </Link>
        }
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {['ALL', 'BELUM', 'DRAF', 'TERKIRIM', 'DITINJAU'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua Kelas' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Semester Ganjil 2024/2025
          </span>
        </div>

        <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada kelas untuk filter ini." />
      </div>
    </div>
  );
}

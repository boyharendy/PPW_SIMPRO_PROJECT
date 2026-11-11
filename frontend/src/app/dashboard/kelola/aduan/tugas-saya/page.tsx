'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';

interface MyDispositionItem {
  id: string;
  nomor: string;
  kategori: string;
  judul: string;
  tenggat: string;
  didisposisikanOleh: string;
  statusDisposisi: 'AKTIF' | 'SELESAI' | 'DIESKALASI';
}

const MOCK_MY_DISPOSITIONS: MyDispositionItem[] = [
  {
    id: 'c-01',
    nomor: 'ADU-2025-0042',
    kategori: 'AKADEMIK',
    judul: 'Ketidaksesuaian jadwal praktikum basis data dengan perkuliahan teori',
    tenggat: '2025-10-31',
    didisposisikanOleh: 'Pengelola Aduan Prodi',
    statusDisposisi: 'AKTIF',
  },
  {
    id: 'c-03',
    nomor: 'ADU-2025-0035',
    kategori: 'AKADEMIK',
    judul: 'Permintaan perpanjangan tenggat pengumpulan tugas besar Pemrograman Visual',
    tenggat: '2025-10-18',
    didisposisikanOleh: 'Kaprodi',
    statusDisposisi: 'SELESAI',
  },
];

export default function Page() {
  const columns: DataTableColumn<MyDispositionItem>[] = [
    {
      key: 'nomor',
      header: 'Nomor Tiket & Kategori',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{r.nomor}</span>
          <div className="mt-0.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              {r.kategori.replace('_', ' ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Pokok Masalah',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{r.judul}</div>
          <div className="text-xs text-slate-400 mt-0.5">Didisposisikan oleh: {r.didisposisikanOleh}</div>
        </div>
      ),
    },
    {
      key: 'tenggat',
      header: 'Batas Tenggat (SLA)',
      render: (r) => (
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
          {formatDateShort(r.tenggat)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Disposisi',
      render: (r) => <StatusBadge status={r.statusDisposisi} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/kelola/aduan/${r.id}`}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tindak Lanjut Aduan Saya"
        description="Daftar disposisi tiket aduan yang ditugaskan kepada Anda (FR-51)."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={MOCK_MY_DISPOSITIONS}
          emptyMessage="Tidak ada tiket aduan yang ditugaskan kepada Anda saat ini."
        />
      </div>
    </div>
  );
}

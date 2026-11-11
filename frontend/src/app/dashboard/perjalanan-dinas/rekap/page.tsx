'use client';

import React, { useState } from 'react';
import { Plane, Wallet, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRupiah, formatDateShort } from '@/lib/utils';

interface RecapTrip {
  id: string;
  pelaksana: string;
  tujuan: string;
  tgl: string;
  noST: string;
  estimasi: number;
  realisasi: number;
  status: string;
  penanda?: 'BELUM_LENGKAP' | 'MELEBIHI_ESTIMASI' | 'SESUAI';
}

const MOCK_RECAP_DATA: RecapTrip[] = [
  {
    id: 'PD-01',
    pelaksana: 'Dr. Budi Santoso, M.Kom.',
    tujuan: 'Surabaya',
    tgl: '10 - 12 Mar 2025',
    noST: 'ST/088/UN-SI/III/2025',
    estimasi: 5400000,
    realisasi: 5250000,
    status: 'SELESAI',
    penanda: 'SESUAI',
  },
  {
    id: 'PD-02',
    pelaksana: 'Siti Aminah, M.T.',
    tujuan: 'Yogyakarta',
    tgl: '20 - 22 Feb 2025',
    noST: 'ST/071/UN-SI/II/2025',
    estimasi: 3800000,
    realisasi: 4250000,
    status: 'SELESAI',
    penanda: 'MELEBIHI_ESTIMASI',
  },
  {
    id: 'PD-03',
    pelaksana: 'Rudi Hermawan, M.Cs.',
    tujuan: 'Bandung',
    tgl: '15 - 18 Jan 2025',
    noST: 'ST/012/UN-SI/I/2025',
    estimasi: 4800000,
    realisasi: 4800000,
    status: 'DILAPORKAN',
    penanda: 'BELUM_LENGKAP',
  },
  {
    id: 'PD-04',
    pelaksana: 'Dr. Ahmad Fauzi',
    tujuan: 'Jakarta',
    tgl: '05 - 07 Des 2024',
    noST: 'ST/210/UN-SI/XII/2024',
    estimasi: 6200000,
    realisasi: 5900000,
    status: 'SELESAI',
    penanda: 'SESUAI',
  },
];

export default function Page() {
  const columns: DataTableColumn<RecapTrip>[] = [
    {
      key: 'pelaksana',
      header: 'Pelaksana & Tujuan',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.pelaksana}</div>
          <div className="text-xs text-slate-500 mt-0.5">Tujuan: <strong>{r.tujuan}</strong> • {r.tgl}</div>
        </div>
      ),
    },
    {
      key: 'noST',
      header: 'No. Surat Tugas',
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.noST}</span>,
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (r) => <span className="font-mono text-xs text-slate-600">{formatRupiah(r.estimasi)}</span>,
    },
    {
      key: 'realisasi',
      header: 'Realisasi Riil',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {formatRupiah(r.realisasi)}
        </span>
      ),
    },
    {
      key: 'selisih',
      header: 'Efisiensi / Selisih',
      render: (r) => {
        const diff = r.estimasi - r.realisasi;
        return (
          <span className={`font-mono text-xs font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {diff >= 0 ? `+ ${formatRupiah(diff)}` : `- ${formatRupiah(Math.abs(diff))}`}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Keterangan',
      render: (r) => (
        <div className="space-y-1">
          <StatusBadge status={r.status} size="sm" />
          {r.penanda === 'MELEBIHI_ESTIMASI' && (
            <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
              Melebihi Estimasi (&gt;10%)
            </div>
          )}
          {r.penanda === 'BELUM_LENGKAP' && (
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
              Bukti Belum Lengkap
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Perjalanan Dinas"
        description="Rekap pelaksanaan dan monitoring realisasi perjalanan dinas prodi (FR-38)."
        actions={<ExportMenu filename="rekap-perjalanan-dinas" />}
      />

      {/* 3 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Perjalanan 2025"
          value="24 Perjalanan"
          subtitle="Tercatat di sistem prodi"
          badgeTone="blue"
          icon={<Plane size={16} />}
        />
        <StatCard
          title="Total Estimasi Pagu"
          value={formatRupiah(68500000)}
          subtitle="Alokasi pagu usulan"
          badgeTone="slate"
          icon={<Wallet size={16} />}
        />
        <StatCard
          title="Total Realisasi Riil"
          value={formatRupiah(62140000)}
          subtitle="Efisiensi anggaran 9.3%"
          badgeTone="emerald"
          badgeText="Hemat Rp 6.36 Jt"
          icon={<TrendingDown size={16} />}
        />
      </div>

      <div className="card">
        <DataTable columns={columns} data={MOCK_RECAP_DATA} />
      </div>
    </div>
  );
}

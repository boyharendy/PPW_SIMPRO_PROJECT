'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, Wallet, AlertCircle, PieChart, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { formatRupiah, calculateAbsorptionPercentage } from '@/lib/utils';

interface SerapanKegiatan {
  kode: string;
  nama: string;
  pagu: number;
  realisasi: number;
  jadwal: string;
  penanda?: 'OVER_REALISASI' | 'TERLAMBAT' | 'NORMAL';
}

const MOCK_SERAPAN: SerapanKegiatan[] = [
  {
    kode: 'KG-01',
    nama: 'Penyusunan dan Review Kurikulum MBKM',
    pagu: 125000000,
    realisasi: 98500000,
    jadwal: 'TW1 - TW2',
    penanda: 'NORMAL',
  },
  {
    kode: 'KG-02',
    nama: 'Seminar Nasional Teknologi Informasi & Konferensi',
    pagu: 85000000,
    realisasi: 89200000,
    jadwal: 'TW1',
    penanda: 'OVER_REALISASI',
  },
  {
    kode: 'KG-03',
    nama: 'Peningkatan Kompetensi & Sertifikasi Dosen',
    pagu: 150000000,
    realisasi: 45000000,
    jadwal: 'TW1 - TW3',
    penanda: 'TERLAMBAT',
  },
  {
    kode: 'KG-04',
    nama: 'Pengembangan Sarana Lab Komputasi Awan',
    pagu: 125000000,
    realisasi: 0,
    jadwal: 'TW3 - TW4',
    penanda: 'NORMAL',
  },
];

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const [filterTW, setFilterTW] = useState('ALL');

  const totalPagu = MOCK_SERAPAN.reduce((s, k) => s + k.pagu, 0);
  const totalRealisasi = MOCK_SERAPAN.reduce((s, k) => s + k.realisasi, 0);
  const pctTotal = calculateAbsorptionPercentage(totalRealisasi, totalPagu);

  const columns: DataTableColumn<SerapanKegiatan>[] = [
    {
      key: 'kode',
      header: 'Kode & Kegiatan RKA',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-600 mr-2">{r.kode}</span>
          <span className="font-semibold text-slate-800 text-sm">{r.nama}</span>
          <div className="text-[11px] text-slate-400 mt-0.5">Jadwal: {r.jadwal}</div>
        </div>
      ),
    },
    {
      key: 'pagu',
      header: 'Alokasi Pagu',
      render: (r) => <span className="font-mono text-xs text-slate-600">{formatRupiah(r.pagu)}</span>,
    },
    {
      key: 'realisasi',
      header: 'Realisasi Berjalan',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {formatRupiah(r.realisasi)}
        </span>
      ),
    },
    {
      key: 'serapan',
      header: 'Persentase Serapan',
      render: (r) => {
        const pct = calculateAbsorptionPercentage(r.realisasi, r.pagu);
        const isOver = r.realisasi > r.pagu;
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                {pct}%
              </span>
              <span className="text-[10px] text-slate-400">
                {isOver ? 'Over Pagu' : `Sisa ${formatRupiah(Math.max(0, r.pagu - r.realisasi))}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'penanda',
      header: 'Status & Penanda',
      render: (r) => (
        <div>
          {r.penanda === 'OVER_REALISASI' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <AlertCircle size={10} /> Over-Realisasi
            </span>
          )}
          {r.penanda === 'TERLAMBAT' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertCircle size={10} /> Progres Terlambat
            </span>
          )}
          {r.penanda === 'NORMAL' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 size={10} /> Sesuai Jadwal
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
      </div>

      <PageHeader
        title={`Monitoring Serapan Anggaran RKA ${tahun || '2025'}`}
        description="Analisis persentase serapan belanja dan proyeksi sisa pagu tahun berjalan (FR-42)."
        actions={<ExportMenu filename={`serapan-rka-${tahun || '2025'}`} />}
      />

      {/* 3 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Pagu Aktif"
          value={formatRupiah(totalPagu)}
          subtitle="Pagu tahun anggaran berjalan"
          badgeTone="blue"
          icon={<Wallet size={16} />}
        />
        <StatCard
          title="Total Realisasi Belanja"
          value={formatRupiah(totalRealisasi)}
          subtitle={`Sisa pagu: ${formatRupiah(totalPagu - totalRealisasi)}`}
          badgeTone="emerald"
          icon={<PieChart size={16} />}
        />
        <StatCard
          title="Persentase Serapan Pagu"
          value={`${pctTotal}%`}
          subtitle="Kinerja serapan semester berjalan"
          badgeTone={pctTotal >= 50 ? 'emerald' : 'amber'}
          badgeText={pctTotal >= 50 ? 'Baik' : 'Perlu Dorongan'}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Filter Triwulan & Tabel */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {['ALL', 'TW1', 'TW2', 'TW3', 'TW4'].map((tw) => (
              <button
                key={tw}
                onClick={() => setFilterTW(tw)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterTW === tw
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tw === 'ALL' ? 'Semua Triwulan' : tw}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Menampilkan serapan per mata kegiatan aktif
          </span>
        </div>

        <DataTable columns={columns} data={MOCK_SERAPAN} />
      </div>
    </div>
  );
}

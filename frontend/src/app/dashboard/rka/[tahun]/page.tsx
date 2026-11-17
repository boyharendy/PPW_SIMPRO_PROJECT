'use client';

import { useParams, useRouter } from 'next/navigation';
import { Wallet, TrendingUp, PieChart, GitBranch, FilePlus, BarChart3, Receipt } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRupiah, formatDateShort, calculateAbsorptionPercentage } from '@/lib/utils';

interface Kegiatan {
  kode: string;
  nama: string;
  anggaran: number;
  realisasi: number;
  status: string;
}

interface Versi {
  nomor: number;
  status: string;
  diajukanOleh: string;
  tanggal: string;
}

const MOCK_KEGIATAN: Kegiatan[] = [
  { kode: 'KG-01', nama: 'Workshop Kurikulum MBKM', anggaran: 125000000, realisasi: 98500000, status: 'BERJALAN' },
  { kode: 'KG-02', nama: 'Seminar Nasional Informatika', anggaran: 85000000, realisasi: 85200000, status: 'SELESAI' },
  { kode: 'KG-03', nama: 'Peningkatan Kompetensi Dosen', anggaran: 150000000, realisasi: 45000000, status: 'BERJALAN' },
  { kode: 'KG-04', nama: 'Pengadaan Perangkat Lab', anggaran: 125000000, realisasi: 0, status: 'BELUM_DILAKSANAKAN' },
];

const MOCK_VERSI: Versi[] = [
  { nomor: 2, status: 'AKTIF', diajukanOleh: 'Dr. Andi Wijaya, M.Kom.', tanggal: '2025-03-15' },
  { nomor: 1, status: 'DIGANTIKAN', diajukanOleh: 'Dr. Andi Wijaya, M.Kom.', tanggal: '2025-01-10' },
];

const totalPagu = MOCK_KEGIATAN.reduce((s, k) => s + k.anggaran, 0);
const totalRealisasi = MOCK_KEGIATAN.reduce((s, k) => s + k.realisasi, 0);
const serapan = calculateAbsorptionPercentage(totalRealisasi, totalPagu);

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();

  const kegiatanColumns: DataTableColumn<Kegiatan>[] = [
    { key: 'kode', header: 'Kode', render: (r) => <span className="font-mono text-xs text-slate-500">{r.kode}</span> },
    { key: 'nama', header: 'Nama Kegiatan', render: (r) => <span className="font-medium text-slate-800">{r.nama}</span> },
    { key: 'anggaran', header: 'Anggaran', render: (r) => <span className="text-sm">{formatRupiah(r.anggaran)}</span> },
    { key: 'realisasi', header: 'Realisasi', render: (r) => <span className="text-sm">{formatRupiah(r.realisasi)}</span> },
    {
      key: 'serapan',
      header: 'Serapan',
      render: (r) => {
        const pct = calculateAbsorptionPercentage(r.realisasi, r.anggaran);
        const isOver = r.realisasi > r.anggaran;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  return (
    <div>
      <PageHeader
        title={`RKA Tahun ${tahun}`}
        description="Detail rencana kerja dan anggaran tahunan program studi"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/dashboard/rka/${tahun}/versi-kerja`)}
              className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <FilePlus size={15} /> Buka Revisi
            </button>
            <button
              onClick={() => router.push(`/dashboard/rka/${tahun}/serapan`)}
              className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 size={15} /> Monitoring Serapan
            </button>
            <button
              onClick={() => router.push(`/dashboard/rka/${tahun}/realisasi`)}
              className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
            >
              <Receipt size={15} /> Catat Realisasi
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Pagu" value={formatRupiah(totalPagu)} icon={<Wallet size={16} />} color="blue" />
        <StatCard title="Total Realisasi" value={formatRupiah(totalRealisasi)} icon={<TrendingUp size={16} />} color="emerald" />
        <StatCard
          title="Serapan"
          value={`${serapan}%`}
          subtitle={`dari ${formatRupiah(totalPagu)}`}
          icon={<PieChart size={16} />}
          color={serapan >= 75 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Kegiatan Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan Kegiatan</h2>
        <DataTable columns={kegiatanColumns} data={MOCK_KEGIATAN} emptyMessage="Belum ada kegiatan" />
      </div>

      {/* Riwayat Versi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-800">Riwayat Versi</h2>
        </div>
        <div className="space-y-3">
          {MOCK_VERSI.map((v) => (
            <div
              key={v.nomor}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/rka/${tahun}/versi/${v.nomor}`)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  v{v.nomor}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Versi {v.nomor}</p>
                  <p className="text-xs text-slate-500">
                    Diajukan oleh {v.diajukanOleh} • {formatDateShort(v.tanggal)}
                  </p>
                </div>
              </div>
              <StatusBadge status={v.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

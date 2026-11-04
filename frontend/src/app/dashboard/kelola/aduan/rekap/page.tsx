'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  ArrowRight,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ExportMenu } from '@/components/ui/ExportMenu';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockComplaints, mockProfiles } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';

const CATEGORY_DATA = [
  { name: 'Fasilitas & Lab', count: 8, fill: '#3b82f6' },
  { name: 'Layanan Admin', count: 5, fill: '#10b981' },
  { name: 'Akademik & Nilai', count: 3, fill: '#f59e0b' },
  { name: 'Sensitif (Satgas)', count: 2, fill: '#ef4444' },
  { name: 'Lainnya', count: 1, fill: '#64748b' },
];

const CATEGORY_SERIES: BarSeriesConfig[] = [
  { dataKey: 'count', name: 'Jumlah Aduan', fill: '#3b82f6', colorKey: 'fill' },
];

const CATEGORY_DOMAIN: [number, number] = [0, 10];
const CATEGORY_TICKS = [0, 2, 4, 6, 8, 10];

const MONTHLY_TREND = [
  { bulan: 'Mei', masuk: 2, tuntas: 2 },
  { bulan: 'Jun', masuk: 4, tuntas: 3 },
  { bulan: 'Jul', masuk: 3, tuntas: 3 },
  { bulan: 'Agu', masuk: 5, tuntas: 4 },
  { bulan: 'Sep', masuk: 6, tuntas: 5 },
  { bulan: 'Okt', masuk: 4, tuntas: 3 },
];

const MONTHLY_SERIES: BarSeriesConfig[] = [
  { dataKey: 'masuk', name: 'Aduan Masuk', fill: '#93c5fd' },
  { dataKey: 'tuntas', name: 'Aduan Tuntas', fill: '#2563eb' },
];

const MONTHLY_DOMAIN: [number, number] = [0, 8];
const MONTHLY_TICKS = [0, 2, 4, 6, 8];

export default function RekapAduanPage() {
  // Overdue / Escalation Dispositions
  const overdueDispositions = mockComplaints.flatMap((c) => {
    if (!c.dispositions) return [];
    return c.dispositions
      .filter((d) => d.status === 'AKTIF' && new Date(d.tenggat) < new Date('2025-10-15'))
      .map((d) => ({
        ...d,
        complaint: c,
      }));
  });

  const columnsEskalasi = [
    {
      key: 'nomor',
      header: 'Nomor Aduan',
      render: (item: any) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{item.complaint.nomor_aduan}</span>
          <div className="font-mono text-xs text-slate-500">{item.complaint.kode_tiket}</div>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (item: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {item.complaint.kategori.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'penanggung_jawab',
      header: 'Petugas Tertugaskan',
      render: (item: any) => {
        const staff = mockProfiles.find((p) => p.id === item.penanggung_jawab_id);
        return <span className="text-xs font-medium text-slate-800">{staff?.nama_lengkap || item.penanggung_jawab_id}</span>;
      },
    },
    {
      key: 'tenggat',
      header: 'Batas Tenggat',
      render: (item: any) => (
        <div>
          <span className="text-xs font-bold text-red-600">{formatDate(item.tenggat)}</span>
          <span className="block text-[11px] text-red-500">Melewati SLA Disposisi</span>
        </div>
      ),
    },
    {
      key: 'catatan',
      header: 'Instruksi',
      render: (item: any) => (
        <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">{item.catatan}</p>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi Eskalasi',
      className: 'text-right',
      render: (item: any) => (
        <Link
          href={`/dashboard/kelola/aduan/${item.complaint.id}`}
          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
        >
          Tinjau &amp; Tegur
          <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi &amp; Eskalasi Aduan Mahasiswa"
        subtitle="Analisis tren aduan, kecepatan penyelesaian (SLA), evaluasi kepuasan mahasiswa, dan eskalasi pimpinan."
        badge={
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Monitoring &amp; KPI
          </span>
        }
        actions={<ExportMenu filename="rekap-aduan-mahasiswa" title="Ekspor Rekapitulasi" />}
      />

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Laporan Masuk</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">19</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Semester Ganjil 2024/2025</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rasio Penyelesaian</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">89.5%</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">17 dari 19 aduan tuntas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rata-rata Durasi SLA</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">3.4 Hari</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Target batas maksimal: 7 hari</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Indeks Kepuasan</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">4.8 / 5.0</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Dari 15 mahasiswa pemberi rating</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart Kategori */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Distribusi Aduan Berdasarkan Kategori</h3>
          <p className="text-xs text-slate-500 mb-4">Pemetaan jenis kendala yang paling sering dilaporkan mahasiswa</p>
          <div className="h-64">
            <InteractiveBarChart
              data={CATEGORY_DATA}
              xKey="name"
              series={CATEGORY_SERIES}
              domain={CATEGORY_DOMAIN}
              ticks={CATEGORY_TICKS}
              tooltipFormatter={(val) => `${val} Laporan`}
              showLegend={false}
            />
          </div>
        </div>

        {/* Chart 2: Tren Bulanan */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tren Aduan Masuk vs Tuntas Bulanan</h3>
          <p className="text-xs text-slate-500 mb-4">Konsistensi tindak lanjut laporan sepanjang semester</p>
          <div className="h-64">
            <InteractiveBarChart
              data={MONTHLY_TREND}
              xKey="bulan"
              series={MONTHLY_SERIES}
              domain={MONTHLY_DOMAIN}
              ticks={MONTHLY_TICKS}
              showLegend
            />
          </div>
        </div>
      </div>

      {/* Escalation Section for Kaprodi */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Eskalasi Disposisi Melewati Tenggat (Kaprodi)</h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Daftar penugasan penanganan yang melewati batas waktu tanpa penyelesaian. Kaprodi berwenang melakukan teguran atau re-alokasi petugas.
            </p>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
            {overdueDispositions.length} Kasus Overdue
          </span>
        </div>

        {/* Anonymity Protection for Sensitive Escalation */}
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            <strong>Perhatian Privasi Bab 11:</strong> Untuk kasus berkategori sensitif, tabel pimpinan ini
            hanya menampilkan kode tiket, tanggal penerusan, dan status penanganan tanpa narasi detail maupun identitas saksi.
          </span>
        </div>

        <DataTable
          columns={columnsEskalasi}
          data={overdueDispositions}
          emptyMessage="Tidak ada disposisi yang melewati batas tenggat saat ini. Kinerja prodi berjalan sesuai SLA."
        />
      </div>
    </div>
  );
}

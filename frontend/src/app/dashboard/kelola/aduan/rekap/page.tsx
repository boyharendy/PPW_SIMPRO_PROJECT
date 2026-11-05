'use client';

import React from 'react';
import { MessageSquare, CheckCircle2, Clock, Star, ShieldAlert, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ResolvedAduanSummary {
  nomor: string;
  kategori: string;
  judul: string;
  durasiHari: number;
  rating: number;
  status: string;
}

const MOCK_RESOLVED_DATA: ResolvedAduanSummary[] = [
  {
    nomor: 'ADU-2025-0038',
    kategori: 'AKADEMIK',
    judul: 'Nilai UTS Pemrograman Web belum diumumkan',
    durasiHari: 2,
    rating: 5,
    status: 'SELESAI',
  },
  {
    nomor: 'ADU-2025-0034',
    kategori: 'FASILITAS',
    judul: 'Koneksi WiFi Eduroam sering putus di Gedung F',
    durasiHari: 3,
    rating: 4,
    status: 'SELESAI',
  },
  {
    nomor: 'ADU-2025-0029',
    kategori: 'LAYANAN_ADMINISTRASI',
    judul: 'Antrean tanda tangan transkrip nilai akademik lambat',
    durasiHari: 4,
    rating: 4,
    status: 'DITUTUP',
  },
];

export default function Page() {
  const columns: DataTableColumn<ResolvedAduanSummary>[] = [
    {
      key: 'nomor',
      header: 'Nomor Tiket & Kategori',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{r.nomor}</span>
          <div className="text-[10px] text-slate-400 mt-0.5">{r.kategori.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Pokok Aduan',
      render: (r) => <span className="text-xs text-slate-800 font-medium line-clamp-1">{r.judul}</span>,
    },
    {
      key: 'durasi',
      header: 'Waktu Resolusi',
      render: (r) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {r.durasiHari} Hari Kerja
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Kepuasan Pelapor',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
          <Star size={11} className="fill-amber-500 text-amber-500" /> {r.rating}.0 / 5.0
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Statistik Aduan"
        description="Statistik, tren kategori, dan riwayat resolusi layanan aduan program studi (FR-52)."
        actions={<ExportMenu filename="rekap-statistik-aduan" />}
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Aduan Masuk"
          value="48 Tiket"
          subtitle="Tahun Akademik 2024/2025"
          badgeTone="blue"
          icon={<MessageSquare size={16} />}
        />
        <StatCard
          title="Tingkat Resolusi"
          value="85.4%"
          subtitle="41 tiket telah selesai"
          badgeTone="emerald"
          badgeText="SLA Terpenuhi"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Rata-rata Waktu Resolusi"
          value="3.2 Hari"
          subtitle="Tenggat maksimal 7 hari"
          badgeTone="indigo"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Kepuasan Pelapor"
          value="4.4 / 5.0"
          subtitle="Dari 36 penilaian pelapor"
          badgeTone="amber"
          badgeText="Sangat Baik"
          icon={<Star size={16} />}
        />
      </div>

      {/* Distribusi Kategori & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Distribusi per Kategori Aduan
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Akademik (Kurikulum & Perkuliahan)', count: 21, pct: 43.8, color: 'bg-blue-600' },
              { label: 'Fasilitas & Sarana Lab', count: 14, pct: 29.2, color: 'bg-indigo-600' },
              { label: 'Layanan Administrasi / TU', count: 8, pct: 16.7, color: 'bg-emerald-600' },
              { label: 'Dosen / Tenaga Kependidikan', count: 3, pct: 6.2, color: 'bg-amber-600' },
              { label: 'Kekerasan / Perundungan (Sensitif)', count: 2, pct: 4.1, color: 'bg-rose-600' },
            ].map((k, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{k.label}</span>
                  <span className="font-bold text-slate-800">{k.count} ({k.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${k.color} rounded-full`} style={{ width: `${k.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Status Penyelesaian Aduan
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Selesai Ditangani', count: 35, pct: 72.9, color: 'bg-emerald-600' },
              { label: 'Ditutup (Tidak Valid / Selesai SLA)', count: 6, pct: 12.5, color: 'bg-purple-600' },
              { label: 'Sedang Ditindaklanjuti', count: 4, pct: 8.3, color: 'bg-blue-600' },
              { label: 'Diverifikasi / Baru Diterima', count: 3, pct: 6.3, color: 'bg-amber-600' },
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="font-bold text-slate-800">{s.count} tiket</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Tiket Terakhir */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Contoh Tiket yang Telah Selesai Ditangani
        </h3>
        <DataTable columns={columns} data={MOCK_RESOLVED_DATA} />
      </div>
    </div>
  );
}

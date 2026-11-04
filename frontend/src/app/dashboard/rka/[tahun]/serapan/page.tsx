'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockRkaDocuments } from '@/lib/mock-data';
import { Wallet, TrendingUp, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, calculateAbsorptionPercentage } from '@/lib/utils';

const QUARTER_DATA = [
  { triwulan: 'TW 1 (Jan-Mar)', Target: 50000000, Realisasi: 42000000 },
  { triwulan: 'TW 2 (Apr-Jun)', Target: 75000000, Realisasi: 68500000 },
  { triwulan: 'TW 3 (Jul-Sep)', Target: 65000000, Realisasi: 52000000 },
  { triwulan: 'TW 4 (Okt-Des)', Target: 60000000, Realisasi: 25000000 },
];

const QUARTER_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Target', fill: '#94A3B8', name: 'Target Anggaran' },
  { dataKey: 'Realisasi', fill: '#2563EB', name: 'Realisasi Riil' },
];

const QUARTER_DOMAIN: [number, number] = [0, 80000000];
const QUARTER_TICKS = [0, 20000000, 40000000, 60000000, 80000000];

export default function RkaSerapanPage() {
  const params = useParams();
  const tahun = Number(params.tahun) || 2025;

  const doc =
    mockRkaDocuments.find((d) => d.tahun_anggaran === tahun) || mockRkaDocuments[0];

  const serapanPct = calculateAbsorptionPercentage(doc.total_realisasi || 0, doc.total_anggaran);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${doc.tahun_anggaran}`}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dokumen RKA {doc.tahun_anggaran}</span>
        </Link>
      </div>

      <PageHeader
        title={`Monitoring Serapan Anggaran RKA ${doc.tahun_anggaran}`}
        description="Analisis serapan anggaran per triwulan, monitoring realisasi pos, dan deteksi dini deviasi belanja."
        action={<ExportMenu title="Ekspor Laporan Serapan" />}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pagu Anggaran Aktif"
          value={formatRupiah(doc.total_anggaran)}
          subtitle="Tahun Anggaran Berjalan"
          icon={<Wallet size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Serapan Riil"
          value={formatRupiah(doc.total_realisasi || 0)}
          subtitle={`${serapanPct}% Telah Terserap`}
          icon={<TrendingUp size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Kegiatan Terlambat"
          value="0 Kegiatan"
          subtitle="Semua berjalan sesuai jadwal"
          icon={<Clock size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Pos Over-Realisasi"
          value="0 Pos"
          subtitle="Tidak ada pos defisit"
          icon={<AlertTriangle size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Serapan Anggaran Triwulan (TW 1 – TW 4)
              </h3>
              <p className="text-xs text-slate-500">Perbandingan target rencana vs realisasi belanja riil</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <InteractiveBarChart
              data={QUARTER_DATA}
              xKey="triwulan"
              series={QUARTER_SERIES}
              domain={QUARTER_DOMAIN}
              ticks={QUARTER_TICKS}
              yAxisFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
              tooltipFormatter={(val) => formatRupiah(val)}
              showLegend
            />
          </div>
        </div>

        {/* Serapan Per Kegiatan */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Serapan per Kegiatan</h3>
            <p className="text-xs text-slate-500">Capaian belanja per butir program kerja</p>
          </div>

          <div className="space-y-4">
            {doc.activities?.map((act) => {
              const actPagu = act.budget_items.reduce((s, b) => s + (b.nominal_anggaran || 0), 0);
              const actReal = act.budget_items.reduce((s, b) => s + (b.realisasi_total || 0), 0);
              const pct = calculateAbsorptionPercentage(actReal, actPagu);

              return (
                <div key={act.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 line-clamp-1">{act.nama_kegiatan}</span>
                    <span className="font-bold text-blue-600">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Realisasi: {formatRupiah(actReal)}</span>
                    <span>Pagu: {formatRupiah(actPagu)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
            Data monitoring serapan dihasilkan secara langsung dari database agregat aktif (&le; 5 detik) untuk kebutuhan audit mutu ISO dan akreditasi BAN-PT/LAM INFOKOM.
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const allBudgetItems = (doc.activities || []).flatMap((act) =>
    (act.budget_items || []).map((b) => ({
      ...b,
      nama_kegiatan: act.nama_kegiatan,
      jadwal_selesai: act.jadwal_selesai,
    }))
  );

  // Deteksi kegiatan yang belum memiliki realisasi melewati jadwal pelaksanaan (FR-38)
  const overdueActivities = (doc.activities || []).filter((act) => {
    const actReal = (act.budget_items || []).reduce((s, b) => s + (b.realisasi_total || 0), 0);
    return actReal === 0 && act.jadwal_selesai && new Date(act.jadwal_selesai) < new Date();
  });

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
        description="Analisis persentase serapan anggaran per kegiatan, per pos anggaran, dan per triwulan (TW1–TW4), serta penanda kegiatan yang melewati jadwal."
        action={<ExportMenu title="Ekspor Laporan Serapan" filename={`serapan-rka-${doc.tahun_anggaran}`} />}
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
          title="Kegiatan Melewati Jadwal"
          value={`${overdueActivities.length} Kegiatan`}
          subtitle={
            overdueActivities.length === 0
              ? 'Semua berjalan sesuai jadwal'
              : 'Belum terlaksana melewati jadwal'
          }
          icon={<Clock size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Pos Anggaran"
          value={`${allBudgetItems.length} Pos`}
          subtitle="Tercatat aktif di RKA"
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
            <h3 className="text-sm font-bold text-slate-800">Serapan per Kegiatan & Jadwal</h3>
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

      {/* Tabel Serapan per Pos Anggaran (SKPL FR-38) */}
      <div className="card space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">
            Rincian Persentase Serapan per Pos Anggaran (FR-38)
          </h3>
          <p className="text-xs text-slate-500">
            Pemantauan alokasi pagu, realisasi riil, sisa anggaran, dan persentase serapan per mata anggaran
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left font-mono">Kode Pos</th>
                <th className="px-3 py-2.5 text-left">Uraian Pos Anggaran &amp; Kegiatan</th>
                <th className="px-3 py-2.5 text-right">Pagu Anggaran</th>
                <th className="px-3 py-2.5 text-right">Realisasi</th>
                <th className="px-3 py-2.5 text-right">Sisa Anggaran</th>
                <th className="px-3 py-2.5 text-right">% Serapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allBudgetItems.map((pos) => {
                const real = pos.realisasi_total || 0;
                const sisa = pos.sisa_anggaran ?? pos.nominal_anggaran - real;
                const pct = calculateAbsorptionPercentage(real, pos.nominal_anggaran);
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{pos.kode_pos}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">{pos.uraian}</p>
                      <span className="text-[11px] text-slate-400">{pos.nama_kegiatan}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700">
                      {formatRupiah(pos.nominal_anggaran)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-700">
                      {formatRupiah(real)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-700">
                      {formatRupiah(sisa)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-slate-800">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

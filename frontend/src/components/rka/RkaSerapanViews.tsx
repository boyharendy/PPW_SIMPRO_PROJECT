import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  computeActivityTotal,
  evaluateActivityMonitoring,
  formatActivityQuarters,
  resolveActivityPicName,
} from '@/lib/rka-utils';
import type { RkaActivity, RkaBudgetCategory, RkaBudgetItem, RkaQuarter } from '@/lib/types';
import { calculateAbsorptionPercentage, formatRupiah, getStatusLabel } from '@/lib/utils';

export type SerapanViewDimension = 'KEGIATAN' | 'POS_ANGGARAN' | 'TRIWULAN';

export interface CategoryAggregation {
  kategori: RkaBudgetCategory;
  label: string;
  jumlahPos: number;
  pagu: number;
  realisasi: number;
  sisa: number;
  pct: number;
  items: Array<RkaBudgetItem & { kodeKegiatan: string; namaKegiatan: string }>;
}

export interface QuarterAggregation {
  tw: RkaQuarter;
  jumlahKegiatan: number;
  kegiatanTerlambat: number;
  pagu: number;
  realisasi: number;
  pct: number;
  kegiatanList: string[];
}

interface RkaSerapanTableProps {
  isLoading: boolean;
  viewDimension: SerapanViewDimension;
  filteredActivities: RkaActivity[];
  byCategory: CategoryAggregation[];
  byQuarter: QuarterAggregation[];
  rkaYear: number;
  referenceYear: number;
  referenceQuarter: 1 | 2 | 3 | 4;
}

/**
 * Renders the 3-dimension RKA absorption tables (by activity, budget category, or quarter).
 */
export default function RkaSerapanTable({
  isLoading,
  viewDimension,
  filteredActivities,
  byCategory,
  byQuarter,
  rkaYear,
  referenceYear,
  referenceQuarter,
}: RkaSerapanTableProps) {
  const kegiatanColumns: DataTableColumn<RkaActivity>[] = [
    {
      key: 'kode_kegiatan',
      header: 'Kode & Kegiatan RKA',
      render: (r) => (
        <div className="space-y-0.5">
          <div>
            <span className="font-mono text-xs font-bold text-blue-600 mr-2">
              {r.kode_kegiatan}
            </span>
            <span className="font-semibold text-slate-800 text-sm">{r.nama_kegiatan}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Jadwal: <strong>{formatActivityQuarters(r)}</strong> • PIC: {resolveActivityPicName(r)}
          </div>
        </div>
      ),
    },
    {
      key: 'pagu',
      header: 'Alokasi Pagu',
      render: (r) => (
        <span className="text-xs text-slate-700 font-mono">
          {formatRupiah(computeActivityTotal(r))}
        </span>
      ),
    },
    {
      key: 'realisasi',
      header: 'Realisasi Berjalan',
      render: (r) => (
        <span className="text-xs text-slate-800 font-mono font-semibold">
          {formatRupiah(r.total_realisasi || 0)}
        </span>
      ),
    },
    {
      key: 'serapan',
      header: 'Persentase Serapan',
      render: (r) => {
        const pagu = computeActivityTotal(r);
        const real = r.total_realisasi || 0;
        const pct = calculateAbsorptionPercentage(real, pagu);
        const isOver = real > pagu;
        return (
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-xs gap-2">
              <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                {pct}%
              </span>
              <span className={`text-[10px] ${isOver ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                {isOver ? `Over ${formatRupiah(real - pagu)}` : `Sisa ${formatRupiah(Math.max(0, pagu - real))}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Penanda Jadwal',
      render: (r) => {
        const m = evaluateActivityMonitoring(r, rkaYear, referenceYear, referenceQuarter);
        return (
          <div className="flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                m.scheduleBadgeTone === 'rose'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : m.scheduleBadgeTone === 'amber'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : m.scheduleBadgeTone === 'emerald'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {m.scheduleBadgeTone === 'rose' || m.scheduleBadgeTone === 'amber' ? (
                <Clock size={10} />
              ) : (
                <CheckCircle2 size={10} />
              )}
              {m.scheduleBadgeText}
            </span>
            {m.isOverBudget && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertCircle size={10} /> Over-Pagu ({m.percentage}%)
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const categoryColumns: DataTableColumn<CategoryAggregation>[] = [
    {
      key: 'label',
      header: 'Kategori Pos Anggaran',
      render: (c) => (
        <div>
          <span className="font-semibold text-sm text-slate-800 block">{c.label}</span>
          <span className="text-[11px] text-slate-400">{c.jumlahPos} pos anggaran aktif</span>
        </div>
      ),
    },
    {
      key: 'pagu',
      header: 'Alokasi Pagu',
      render: (c) => <span className="text-xs font-mono text-slate-700">{formatRupiah(c.pagu)}</span>,
    },
    {
      key: 'realisasi',
      header: 'Realisasi Berjalan',
      render: (c) => (
        <span className="text-xs font-mono font-semibold text-slate-800">
          {formatRupiah(c.realisasi)}
        </span>
      ),
    },
    {
      key: 'sisa',
      header: 'Sisa / Selisih',
      render: (c) => (
        <span className={`text-xs font-mono font-semibold ${c.sisa < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
          {c.sisa < 0 ? `-${formatRupiah(Math.abs(c.sisa))}` : formatRupiah(c.sisa)}
        </span>
      ),
    },
    {
      key: 'pct',
      header: 'Persentase Serapan',
      render: (c) => {
        const isOver = c.realisasi > c.pagu;
        return (
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>{c.pct}%</span>
              {isOver && <span className="text-[10px] font-bold text-rose-600">Over-Pagu</span>}
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-rose-500' : c.pct >= 75 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(c.pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  const quarterColumns: DataTableColumn<QuarterAggregation>[] = [
    {
      key: 'tw',
      header: 'Triwulan',
      render: (q) => (
        <div>
          <span className="font-bold text-sm text-blue-700">{q.tw}</span>
          <span className="text-[11px] text-slate-400 block">
            {q.kegiatanList.length > 0 ? q.kegiatanList.join(', ') : 'Tidak ada jadwal'}
          </span>
        </div>
      ),
    },
    {
      key: 'jumlahKegiatan',
      header: 'Kegiatan Terjadwal',
      render: (q) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{q.jumlahKegiatan} kegiatan</span>
          {q.kegiatanTerlambat > 0 && (
            <span className="block text-[11px] text-rose-600 font-semibold">
              {q.kegiatanTerlambat} melewati jadwal
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'pagu',
      header: 'Pagu Terjadwal (Proporsional)',
      render: (q) => <span className="text-xs font-mono text-slate-700">{formatRupiah(q.pagu)}</span>,
    },
    {
      key: 'realisasi',
      header: 'Realisasi Tercatat di TW',
      render: (q) => (
        <span className="text-xs font-mono font-semibold text-slate-800">
          {formatRupiah(q.realisasi)}
        </span>
      ),
    },
    {
      key: 'pct',
      header: 'Serapan Triwulan',
      render: (q) => {
        const isOver = q.realisasi > q.pagu && q.pagu > 0;
        return (
          <div className="w-36 space-y-1">
            <span className={`text-xs font-bold block ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
              {q.pct}%
            </span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-rose-500' : q.pct >= 75 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(q.pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Memuat data monitoring...</div>;
  }

  if (viewDimension === 'KEGIATAN') {
    return (
      <DataTable
        columns={kegiatanColumns}
        data={filteredActivities}
        emptyMessage="Tidak ada kegiatan terjadwal pada triwulan ini."
      />
    );
  }

  if (viewDimension === 'POS_ANGGARAN') {
    return (
      <div className="space-y-4">
        <DataTable
          columns={categoryColumns}
          data={byCategory}
          emptyMessage="Belum ada pos anggaran pada filter ini."
        />
        {byCategory.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rincian Pos Anggaran Per Kategori
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {byCategory.map((cat) => (
                <div
                  key={cat.kategori}
                  className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                    <span className={`text-xs font-bold ${cat.realisasi > cat.pagu ? 'text-rose-600' : 'text-blue-700'}`}>
                      {cat.pct}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {cat.items.map((item) => {
                      const real = item.realisasi_total || 0;
                      const pct = calculateAbsorptionPercentage(real, item.nominal_anggaran);
                      const isOver = real > item.nominal_anggaran;
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg border border-slate-200/80 p-2 text-[11px] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-slate-500 mr-1.5">{item.kode_pos}</span>
                            <span className="font-medium text-slate-800 truncate">{item.nama_pos}</span>
                            <span className="block text-[10px] text-slate-400">
                              {item.kodeKegiatan} • {getStatusLabel(item.sumber_dana)}
                            </span>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span className={`font-bold block ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                              {formatRupiah(real)} ({pct}%)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Pagu {formatRupiah(item.nominal_anggaran)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <DataTable columns={quarterColumns} data={byQuarter} />;
}

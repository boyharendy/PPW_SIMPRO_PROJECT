import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Paperclip, Plane, Receipt, Upload } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { formatFileSize } from '@/lib/rka-utils';
import type { RkaActivity, RkaBudgetItem, RkaRealization } from '@/lib/types';
import { formatDateShort, formatRupiah } from '@/lib/utils';

interface RkaRealizationSummaryCardsProps {
  totalPagu: number;
  totalRealisasi: number;
  realizationCount: number;
  totalManual: number;
  manualCount: number;
  totalTrip: number;
  tripCount: number;
}

/**
 * Renders the 4 summary KPI cards for RKA budget realization.
 */
export function RkaRealizationSummaryCards({
  totalPagu,
  totalRealisasi,
  realizationCount,
  totalManual,
  manualCount,
  totalTrip,
  tripCount,
}: RkaRealizationSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        animationIndex={0}
        title="Total Pagu RKA"
        value={formatRupiah(totalPagu)}
        subtitle="Pagu aktif terhitung otomatis"
        icon={<FileText size={16} />}
        color="blue"
      />
      <StatCard
        animationIndex={1}
        title="Total Realisasi Terbukukan"
        value={formatRupiah(totalRealisasi)}
        subtitle={`${realizationCount} transaksi aktif`}
        icon={<Receipt size={16} />}
        color="emerald"
      />
      <StatCard
        animationIndex={2}
        title="Realisasi Input Manual"
        value={formatRupiah(totalManual)}
        subtitle={`${manualCount} pencatatan langsung`}
        icon={<Upload size={16} />}
        color="slate"
      />
      <StatCard
        animationIndex={3}
        title="Tertaut Perjalanan Dinas"
        value={formatRupiah(totalTrip)}
        subtitle={`${tripCount} perjalanan dinas selesai`}
        icon={<Plane size={16} />}
        color="blue"
      />
    </div>
  );
}

/**
 * Builds column definitions for the RKA realization history table.
 */
export function buildRkaRealizationColumns(
  posLookup: Map<string, { activity: RkaActivity; item: RkaBudgetItem }>
): DataTableColumn<RkaRealization>[] {
  return [
    {
      key: 'tanggal_realisasi',
      header: 'Tanggal',
      render: (r) => (
        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
          {formatDateShort(r.tanggal_realisasi)}
        </span>
      ),
    },
    {
      key: 'pos',
      header: 'Kegiatan & Pos Anggaran RKA',
      render: (r) => {
        const ref = posLookup.get(r.rka_budget_item_id);
        return (
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {ref?.item.kode_pos || r.rka_budget_item_id}
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {ref?.item.nama_pos || 'Pos Anggaran'}
              </span>
            </div>
            {ref?.activity && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {ref.activity.kode_kegiatan} — {ref.activity.nama_kegiatan}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'uraian',
      header: 'Uraian & Bukti',
      render: (r) => (
        <div className="max-w-md space-y-1">
          <div className="text-xs text-slate-700">{r.uraian}</div>
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
              <Paperclip size={11} /> {r.nama_berkas_bukti || 'Bukti terlampir'}
              {r.ukuran_berkas_bukti ? ` (${formatFileSize(r.ukuran_berkas_bukti)})` : ''}
            </span>
            {r.business_trip_id && (
              <Link
                href={`/dashboard/perjalanan-dinas/${r.business_trip_id}`}
                className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
              >
                Lihat Perjalanan Dinas <ExternalLink size={11} />
              </Link>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sumber_pencatatan',
      header: 'Sumber Catat',
      render: (r) => (
        <span
          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border whitespace-nowrap ${
            r.sumber_pencatatan === 'PERJALANAN_DINAS'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {r.sumber_pencatatan === 'PERJALANAN_DINAS' ? 'Tertaut Perjalanan Dinas' : 'Input Manual'}
        </span>
      ),
    },
    {
      key: 'nominal_realisasi',
      header: 'Nominal Realisasi',
      className: 'text-right',
      render: (r) => (
        <span className="text-xs font-mono font-bold text-slate-800 whitespace-nowrap">
          {formatRupiah(r.nominal_realisasi)}
        </span>
      ),
    },
  ];
}

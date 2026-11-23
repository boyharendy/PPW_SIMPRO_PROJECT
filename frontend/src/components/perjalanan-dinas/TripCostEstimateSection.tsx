'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';
import type { TripCostComponent } from '@/lib/types';
import type { TripRkaBudgetOption } from '@/components/perjalanan-dinas/TripInfoSection';
import { formatRupiah } from '@/lib/utils';

export const TRIP_COST_LABELS: Array<{ key: TripCostComponent; label: string }> = [
  { key: 'TRANSPORTASI', label: 'Transportasi' },
  { key: 'AKOMODASI', label: 'Akomodasi' },
  { key: 'UANG_HARIAN', label: 'Uang Harian' },
  { key: 'LAINNYA', label: 'Lain-lain' },
];

interface TripCostEstimateSectionProps {
  biaya: Partial<Record<TripCostComponent, number>>;
  keteranganBiaya: Record<TripCostComponent, string>;
  onChangeBiaya: (key: TripCostComponent, val: number | undefined) => void;
  onChangeKeterangan: (key: TripCostComponent, val: string) => void;
  totalBiaya: number;
  showPosRka: boolean;
  selectedBudgetItem?: TripRkaBudgetOption;
  sisaAnggaran: number;
  overBudget: boolean;
  tooSoon: boolean;
}

/**
 * Renders the itemized estimated trip cost breakdown and policy warning alerts.
 */
export default function TripCostEstimateSection({
  biaya,
  keteranganBiaya,
  onChangeBiaya,
  onChangeKeterangan,
  totalBiaya,
  showPosRka,
  selectedBudgetItem,
  sisaAnggaran,
  overBudget,
  tooSoon,
}: TripCostEstimateSectionProps) {
  return (
    <>
      <MotionCard
        index={1}
        interactive={false}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <WordRevealHeading
            as="h2"
            text="Estimasi Biaya per Komponen"
            className="text-lg font-semibold text-slate-800"
          />
          <span className="text-xs text-slate-400">Wajib diisi ≥ 0</span>
        </div>

        <div className="space-y-3">
          {TRIP_COST_LABELS.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
            >
              <span className="text-sm font-medium text-slate-700 sm:col-span-3">
                {item.label}
              </span>
              <div className="sm:col-span-5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  aria-label={'Estimasi ' + item.label}
                  value={biaya[item.key] ?? ''}
                  placeholder="Rp"
                  onChange={(e) => {
                    const amount = e.target.valueAsNumber;
                    onChangeBiaya(item.key, Number.isFinite(amount) ? amount : undefined);
                  }}
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={keteranganBiaya[item.key]}
                  onChange={(e) => onChangeKeterangan(item.key, e.target.value)}
                  placeholder="Keterangan (opsional)"
                  className="input-field text-xs py-2"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-800">Total Estimasi</span>
          <span className="text-lg font-bold text-blue-700">{formatRupiah(totalBiaya)}</span>
        </div>

        {showPosRka && selectedBudgetItem && (
          <p className="text-xs text-slate-500">
            Sisa anggaran pos RKA ({selectedBudgetItem.kode_pos}):{' '}
            <span className={`font-semibold ${overBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatRupiah(sisaAnggaran)}
            </span>
          </p>
        )}
      </MotionCard>

      {(overBudget || tooSoon) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          {overBudget && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Total estimasi biaya <span className="font-semibold">melebihi sisa anggaran</span> pos RKA ({formatRupiah(sisaAnggaran)}).
              </p>
            </div>
          )}
          {tooSoon && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Tanggal keberangkatan <span className="font-semibold">kurang dari 3 hari</span> dari sekarang.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

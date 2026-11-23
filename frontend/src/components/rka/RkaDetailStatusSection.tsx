'use client';

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  PieChart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { RkaVersion } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';

interface RkaDetailStatusSectionProps {
  bannerMessage: { tone: 'success' | 'error'; text: string } | null;
  onDismissBanner: () => void;
  isViewingArchivedSnapshot: boolean;
  isLockedActive: boolean;
  isKaprodi: boolean;
  isViewingEditableVersion: boolean;
  validation: { valid: boolean; errors: string[] };
  selectedVersion?: RkaVersion;
  activeVersion?: RkaVersion;
  onSelectVersion: (num: number) => void;
  displayedTotalPagu: number;
  displayedActivityCount: number;
  totalRealisasi: number;
  serapanPct: number;
}

export default function RkaDetailStatusSection({
  bannerMessage,
  onDismissBanner,
  isViewingArchivedSnapshot,
  isLockedActive,
  isKaprodi,
  isViewingEditableVersion,
  validation,
  selectedVersion,
  activeVersion,
  onSelectVersion,
  displayedTotalPagu,
  displayedActivityCount,
  totalRealisasi,
  serapanPct,
}: RkaDetailStatusSectionProps) {
  return (
    <>
      {bannerMessage && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-start justify-between gap-3 ${
            bannerMessage.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {bannerMessage.tone === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            className="text-[11px] font-semibold opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {isViewingArchivedSnapshot && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3.5 text-xs text-purple-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-purple-600 shrink-0" />
            <span>
              Anda sedang melihat <strong>Arsip Snapshot Versi v{selectedVersion?.nomor_versi} (Read-Only)</strong>.
              Perubahan tidak diizinkan pada versi historis.
            </span>
          </div>
          {activeVersion && (
            <button
              type="button"
              onClick={() => onSelectVersion(activeVersion.nomor_versi)}
              className="text-xs font-semibold text-purple-700 underline"
            >
              Kembali ke Versi Aktif (v{activeVersion.nomor_versi})
            </button>
          )}
        </div>
      )}

      {isLockedActive && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex items-center gap-2">
          <Lock size={15} className="text-slate-500 shrink-0" />
          <span>
            RKA berstatus <strong>Aktif (Disetujui Kaprodi)</strong> — pengeditan langsung butir kegiatan &amp; pagu dikunci.
            {isKaprodi
              ? ' Gunakan tombol "Buat Revisi RKA" untuk membuat versi revisi baru sambil mengarsipkan versi aktif saat ini.'
              : ' Anda memiliki akses lihat-saja pada struktur pagu utama.'}
          </span>
        </div>
      )}

      {isViewingEditableVersion && !validation.valid && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" />
            Syarat Pengesahan RKA (NF-01 &amp; NF-07) Belum Terpenuhi:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          animationIndex={0}
          title="Total Pagu (Otomatis)"
          value={formatRupiah(displayedTotalPagu)}
          subtitle={`Dari ${displayedActivityCount} butir kegiatan`}
          icon={<Wallet size={16} />}
          color="blue"
        />
        <StatCard
          animationIndex={1}
          title="Total Realisasi Berjalan"
          value={formatRupiah(totalRealisasi)}
          subtitle={
            displayedTotalPagu >= totalRealisasi
              ? `Sisa pagu: ${formatRupiah(displayedTotalPagu - totalRealisasi)}`
              : `Over-pagu: ${formatRupiah(totalRealisasi - displayedTotalPagu)}`
          }
          icon={<TrendingUp size={16} />}
          color={totalRealisasi > displayedTotalPagu ? 'rose' : 'emerald'}
        />
        <StatCard
          animationIndex={2}
          title="Persentase Serapan"
          value={`${serapanPct}%`}
          subtitle={`Versi ditampilkan: v${selectedVersion?.nomor_versi ?? 1}`}
          icon={<PieChart size={16} />}
          color={serapanPct > 100 ? 'rose' : serapanPct >= 75 ? 'emerald' : 'amber'}
        />
      </div>
    </>
  );
}

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  History,
  Lock,
  PieChart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { RkaVersion } from '@/lib/types';
import { formatRupiah, getStatusLabel } from '@/lib/utils';

export function RkaNotFoundState({ tahun }: { tahun: string }) {
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/rka"
        className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
      >
        <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
      </Link>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <AlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-lg font-bold text-slate-800">Dokumen RKA TA {tahun} Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Dokumen RKA untuk tahun anggaran ini belum dibuat atau telah dihapus.
        </p>
        <Link href="/dashboard/rka" className="btn-primary text-xs px-4 py-2 inline-flex">
          Kembali ke Daftar RKA
        </Link>
      </div>
    </div>
  );
}

interface RkaVersionTopBarProps {
  versions: RkaVersion[];
  selectedVersionNum?: number;
  onSelectVersion: (num: number) => void;
  onOpenHistory: () => void;
}

export function RkaVersionTopBar({
  versions,
  selectedVersionNum,
  onSelectVersion,
  onOpenHistory,
}: RkaVersionTopBarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <Link
        href="/dashboard/rka"
        className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
      >
        <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <GitBranch size={13} className="text-blue-600" />
          <span className="text-slate-500 font-medium">Versi:</span>
          <select
            value={selectedVersionNum ?? 1}
            onChange={(e) => onSelectVersion(Number(e.target.value))}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.nomor_versi}>
                v{v.nomor_versi} — {getStatusLabel(v.status)} ({formatRupiah(v.total_anggaran)})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          <History size={14} /> Riwayat Versi &amp; Audit Log
        </button>
      </div>
    </div>
  );
}

interface RkaStatusBannersAndStatsProps {
  bannerMessage: { tone: 'success' | 'error'; text: string } | null;
  onDismissBanner: () => void;
  isViewingArchivedSnapshot: boolean;
  selectedVersion?: RkaVersion;
  activeVersion?: RkaVersion;
  onSelectActiveVersion: (nomorVersi: number) => void;
  isLockedActive: boolean;
  isKaprodi: boolean;
  isViewingEditableVersion: boolean;
  validation: { valid: boolean; errors: string[] };
  displayedTotalPagu: number;
  activityCount: number;
  totalRealisasi: number;
  serapanPct: number;
}

/**
 * Renders contextual RKA feedback/status banners and the 3-card budget summary row.
 */
export default function RkaStatusBannersAndStats({
  bannerMessage,
  onDismissBanner,
  isViewingArchivedSnapshot,
  selectedVersion,
  activeVersion,
  onSelectActiveVersion,
  isLockedActive,
  isKaprodi,
  isViewingEditableVersion,
  validation,
  displayedTotalPagu,
  activityCount,
  totalRealisasi,
  serapanPct,
}: RkaStatusBannersAndStatsProps) {
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
              onClick={() => onSelectActiveVersion(activeVersion.nomor_versi)}
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
            Syarat Pengesahan RKA Belum Terpenuhi:
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
          title="Total Pagu (Otomatis)"
          value={formatRupiah(displayedTotalPagu)}
          subtitle={`Dari ${activityCount} butir kegiatan`}
          icon={<Wallet size={16} />}
          color="blue"
        />
        <StatCard
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

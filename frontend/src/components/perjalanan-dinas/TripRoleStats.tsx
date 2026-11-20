import React from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck,
  Plane,
  RotateCcw,
  UploadCloud,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { formatRupiah } from '@/lib/utils';

export interface TripRoleStatsData {
  draftCount: number;
  pendingCount: number;
  revisionCount: number;
  approvedCount: number;
  reportedCount: number;
  completedCount: number;
  rejectedCount: number;
  pendingBudget: number;
}

interface TripRoleStatsProps {
  isKaprodi: boolean;
  isAdminProdi: boolean;
  isDosen: boolean;
  stats: TripRoleStatsData;
}

/**
 * Renders the 4-card KPI summary row tailored to the active user role in Perjalanan Dinas.
 */
export default function TripRoleStats({
  isKaprodi,
  isAdminProdi,
  isDosen,
  stats,
}: TripRoleStatsProps) {
  if (isKaprodi) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Menunggu Persetujuan"
          value={stats.pendingCount}
          subtitle="Perlu keputusan Kaprodi"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Disetujui / Berjalan"
          value={stats.approvedCount + stats.reportedCount}
          subtitle="Sedang berjalan & dilaporkan"
          badgeTone="emerald"
          icon={<Plane size={16} />}
        />
        <StatCard
          title="Revisi / Ditolak"
          value={stats.revisionCount + stats.rejectedCount}
          subtitle="Perlu perbaikan atau ditolak"
          badgeTone="rose"
          icon={<RotateCcw size={16} />}
        />
        <StatCard
          title="Estimasi Antrean"
          value={formatRupiah(stats.pendingBudget)}
          subtitle="Total usulan berstatus Diajukan"
          badgeTone="blue"
          icon={<Wallet size={16} />}
        />
      </div>
    );
  }

  if (isAdminProdi) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Perlu Verifikasi Berkas"
          value={stats.reportedCount}
          subtitle="Menunggu konfirmasi Admin Prodi"
          badgeTone="amber"
          icon={<FileCheck size={16} />}
        />
        <StatCard
          title="Berjalan / Belum Lapor"
          value={stats.approvedCount}
          subtitle="Disetujui, menanti laporan hasil"
          badgeTone="blue"
          icon={<Plane size={16} />}
        />
        <StatCard
          title="Menunggu Kaprodi"
          value={stats.pendingCount}
          subtitle="Sedang dalam antrean persetujuan"
          badgeTone="slate"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Selesai"
          value={stats.completedCount}
          subtitle="Berkas lengkap & terverifikasi"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
      </div>
    );
  }

  if (isDosen) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Draf & Perlu Revisi"
          value={stats.draftCount + stats.revisionCount}
          subtitle="Perlu dilengkapi atau diajukan"
          badgeTone="amber"
          icon={<Edit3 size={16} />}
        />
        <StatCard
          title="Menunggu Kaprodi"
          value={stats.pendingCount}
          subtitle="Usulan sedang ditinjau"
          badgeTone="blue"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Perlu Laporan Hasil"
          value={stats.approvedCount}
          subtitle="Siap unggah bukti & realisasi"
          badgeTone="indigo"
          icon={<UploadCloud size={16} />}
        />
        <StatCard
          title="Dilaporkan & Selesai"
          value={stats.reportedCount + stats.completedCount}
          subtitle="Telah dilaporkan / tuntas"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
      </div>
    );
  }

  return null;
}

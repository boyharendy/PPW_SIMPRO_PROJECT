'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import TripApprovalModal, { type TripDecision } from '@/components/perjalanan-dinas/TripApprovalModal';
import { useBusinessTrips } from '@/lib/use-business-trips';
import {
  getTripLeadName,
  getTripPolicyWarnings,
  getTripTotalEstimasi,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

export default function PersetujuanPerjalananDinasPage() {
  const { trips, rkaDocs, reload } = useBusinessTrips();
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Tampilkan semua usulan yang pernah diajukan (kecuali DRAF), prioritaskan antrean DIAJUKAN di atas
  const approvalRows = useMemo(() => {
    const submitted = trips.filter((t) => t.status !== 'DRAF');
    return [...submitted].sort((a, b) => {
      if (a.status === 'DIAJUKAN' && b.status !== 'DIAJUKAN') return -1;
      if (a.status !== 'DIAJUKAN' && b.status === 'DIAJUKAN') return 1;
      return (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at);
    });
  }, [trips]);

  const stats = useMemo(() => {
    const pending = approvalRows.filter((t) => t.status === 'DIAJUKAN');
    const approved = approvalRows.filter(
      (t) => t.status === 'DISETUJUI' || t.status === 'DILAPORKAN' || t.status === 'SELESAI'
    );
    const revisedOrRejected = approvalRows.filter(
      (t) => t.status === 'PERLU_REVISI' || t.status === 'DITOLAK'
    );
    const pendingBudget = pending.reduce((sum, t) => sum + getTripTotalEstimasi(t), 0);
    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      revisedOrRejectedCount: revisedOrRejected.length,
      pendingBudget,
    };
  }, [approvalRows]);

  const handleDecided = (updatedTrip: BusinessTrip, decision: TripDecision) => {
    setSelectedTrip(null);
    reload();
    const labelMap: Record<TripDecision, string> = {
      DISETUJUI: 'disetujui',
      PERLU_REVISI: 'dikembalikan untuk revisi',
      DITOLAK: 'ditolak',
    };
    setSuccessToast(
      `Usulan perjalanan dinas ke ${updatedTrip.tujuan} berhasil ${labelMap[decision]}.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const columns: DataTableColumn<BusinessTrip>[] = [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud',
      render: (r) => {
        const warnings = getTripPolicyWarnings(r, rkaDocs);
        return (
          <div className="min-w-0 max-w-md">
            <div className="font-semibold text-slate-800 text-sm">{r.tujuan}</div>
            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.maksud_kegiatan}</div>
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1 mr-1"
              >
                <AlertTriangle size={11} /> {w}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'pelaksana',
      header: 'Pelaksana Usulan',
      render: (r) => {
        const participantCount = r.participants?.length || 1;
        return (
          <div>
            <span className="text-sm font-medium text-slate-800 block">
              {getTripLeadName(r)}
            </span>
            {participantCount > 1 && (
              <span className="text-[11px] text-slate-500">
                +{participantCount - 1} anggota rombongan
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'tgl',
      header: 'Jadwal',
      render: (r) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {formatDateShort(r.tanggal_berangkat)} – {formatDateShort(r.tanggal_kembali)}
        </span>
      ),
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="text-xs font-semibold text-slate-800">
            {formatRupiah(getTripTotalEstimasi(r))}
          </span>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {getStatusLabel(r.sumber_dana)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="space-y-1">
          <StatusBadge status={r.status} size="sm" />
          {r.nomor_surat_tugas && (
            <div className="text-[10px] font-mono text-slate-500">{r.nomor_surat_tugas}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setSelectedTrip(r)}
          className={
            r.status === 'DIAJUKAN'
              ? 'btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5'
              : 'btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5'
          }
        >
          {r.status === 'DIAJUKAN' ? (
            <>
              <CheckCircle2 size={13} /> Persetujuan
            </>
          ) : (
            <>
              <Eye size={13} /> Detail
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan Perjalanan Dinas"
        description="Tinjauan, validasi estimasi biaya, dan keputusan persetujuan rencana perjalanan dinas oleh Ketua Program Studi (Kaprodi)."
        badge={
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            Otoritas Kaprodi
          </span>
        }
        actions={
          <Link
            href="/dashboard/perjalanan-dinas"
            className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Daftar Perjalanan Dinas
          </Link>
        }
      />

      {successToast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Ringkasan Antrean Persetujuan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Menunggu Persetujuan"
          value={stats.pendingCount}
          subtitle="Usulan berstatus Diajukan"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Telah Disetujui"
          value={stats.approvedCount}
          subtitle="Disetujui / Berjalan / Selesai"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Revisi / Ditolak"
          value={stats.revisedOrRejectedCount}
          subtitle="Dikembalikan atau ditolak"
          badgeTone="rose"
          icon={<RotateCcw size={16} />}
        />
        <StatCard
          title="Estimasi Antrean"
          value={formatRupiah(stats.pendingBudget)}
          subtitle="Total pagu menunggu persetujuan"
          badgeTone="blue"
          icon={<Wallet size={16} />}
        />
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={approvalRows}
          emptyMessage="Tidak ada usulan perjalanan dinas yang perlu ditinjau."
        />
      </div>

      <TripApprovalModal
        trip={selectedTrip}
        rkaDocs={rkaDocs}
        open={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        onDecided={handleDecided}
      />
    </div>
  );
}

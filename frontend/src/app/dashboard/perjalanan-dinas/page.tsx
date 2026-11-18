'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Plane,
  Plus,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import TripApprovalModal, { type TripDecision } from '@/components/perjalanan-dinas/TripApprovalModal';
import { useUser } from '@/lib/context';
import { useBusinessTrips } from '@/lib/use-business-trips';
import {
  getTripLeadName,
  getTripPolicyWarnings,
  getTripTotalEstimasi,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

const TABS = [
  'Semua',
  'DIAJUKAN',
  'PERLU_REVISI',
  'DISETUJUI',
  'DILAPORKAN',
  'SELESAI',
  'DITOLAK',
] as const;

const TAB_LABELS: Record<string, string> = {
  Semua: 'Semua',
  DIAJUKAN: 'Menunggu Persetujuan',
  PERLU_REVISI: 'Perlu Revisi',
  DISETUJUI: 'Disetujui',
  DILAPORKAN: 'Dilaporkan',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

export default function PerjalananDinasPage() {
  const router = useRouter();
  const { currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const { trips, rkaDocs, reload } = useBusinessTrips();
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [selectedTripForApproval, setSelectedTripForApproval] = useState<BusinessTrip | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const visibleTrips = useMemo(() => {
    // Prioritaskan pengajuan yang menunggu persetujuan di urutan atas untuk Kaprodi
    return [...trips].sort((a, b) => {
      if (isKaprodi) {
        if (a.status === 'DIAJUKAN' && b.status !== 'DIAJUKAN') return -1;
        if (a.status !== 'DIAJUKAN' && b.status === 'DIAJUKAN') return 1;
      }
      return (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at);
    });
  }, [trips, isKaprodi]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { Semua: visibleTrips.length };
    for (const tab of TABS) {
      if (tab !== 'Semua') {
        counts[tab] = visibleTrips.filter((t) => t.status === tab).length;
      }
    }
    return counts;
  }, [visibleTrips]);

  const kaprodiStats = useMemo(() => {
    const pending = visibleTrips.filter((t) => t.status === 'DIAJUKAN');
    const ongoing = visibleTrips.filter(
      (t) => t.status === 'DISETUJUI' || t.status === 'DILAPORKAN'
    );
    const revisedOrRejected = visibleTrips.filter(
      (t) => t.status === 'PERLU_REVISI' || t.status === 'DITOLAK'
    );
    const pendingBudget = pending.reduce((sum, t) => sum + getTripTotalEstimasi(t), 0);
    return {
      pendingCount: pending.length,
      ongoingCount: ongoing.length,
      revisedOrRejectedCount: revisedOrRejected.length,
      pendingBudget,
    };
  }, [visibleTrips]);

  const filtered = useMemo(
    () =>
      activeTab === 'Semua'
        ? visibleTrips
        : visibleTrips.filter((d) => d.status === activeTab),
    [activeTab, visibleTrips]
  );

  const handleDecided = (updatedTrip: BusinessTrip, decision: TripDecision) => {
    setSelectedTripForApproval(null);
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
      render: (row) => {
        const warnings = isKaprodi ? getTripPolicyWarnings(row, rkaDocs) : [];
        return (
          <div className="min-w-0 max-w-md">
            <p className="text-sm font-semibold text-slate-800">{row.tujuan}</p>
            <p className="text-xs text-slate-500 truncate max-w-[300px]">{row.maksud_kegiatan}</p>
            {warnings.map((w, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1 mr-1"
              >
                <AlertTriangle size={11} /> {w}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'pelaksana',
      header: 'Pelaksana',
      render: (row) => {
        const participantCount = row.participants?.length || 1;
        return (
          <div>
            <span className="text-sm font-medium text-slate-800 block">
              {getTripLeadName(row)}
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
      key: 'tanggal',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs sm:text-sm text-slate-700 whitespace-nowrap">
          {formatDateShort(row.tanggal_berangkat)} – {formatDateShort(row.tanggal_kembali)}
        </span>
      ),
    },
    {
      key: 'sumberDana',
      header: 'Sumber Dana & Estimasi',
      render: (row) => (
        <div className="whitespace-nowrap">
          <span className="text-xs font-semibold text-slate-800 block">
            {formatRupiah(getTripTotalEstimasi(row))}
          </span>
          <span className="text-[11px] text-slate-500">{getStatusLabel(row.sumber_dana)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          {isKaprodi && row.status === 'DIAJUKAN' && (
            <button
              onClick={() => setSelectedTripForApproval(row)}
              className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} /> Tinjau &amp; Setujui
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/perjalanan-dinas/${row.id}`)}
            className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
          >
            <Eye size={13} /> Detail
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perjalanan Dinas"
        description={
          isKaprodi
            ? 'Tinjau, setujui, dan pantau pengajuan rencana perjalanan dinas serta laporan pelaksanaannya.'
            : 'Kelola pengajuan, persetujuan, dan pelaporan perjalanan dinas.'
        }
        badge={
          isKaprodi ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
              Mode Kaprodi
            </span>
          ) : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isKaprodi && (
              <Link
                href="/dashboard/perjalanan-dinas/persetujuan"
                className="btn-primary text-xs sm:text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <FileCheck size={16} />
                Halaman Persetujuan
                {kaprodiStats.pendingCount > 0 && (
                  <span className="rounded-full bg-white text-blue-700 text-xs font-bold px-2 py-0.5">
                    {kaprodiStats.pendingCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => router.push('/dashboard/perjalanan-dinas/baru')}
              className={
                isKaprodi
                  ? 'btn-secondary text-xs sm:text-sm px-3.5 py-2 inline-flex items-center gap-1.5'
                  : 'btn-primary text-xs sm:text-sm px-4 py-2 inline-flex items-center gap-2'
              }
            >
              <Plus size={16} /> Ajukan Perjalanan
            </button>
          </div>
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

      {/* Ringkasan Khusus Aktor Kaprodi */}
      {isKaprodi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Menunggu Persetujuan"
            value={kaprodiStats.pendingCount}
            subtitle="Perlu keputusan Kaprodi"
            badgeTone="amber"
            icon={<Clock size={16} />}
          />
          <StatCard
            title="Disetujui / Berjalan"
            value={kaprodiStats.ongoingCount}
            subtitle="Sedang berjalan & dilaporkan"
            badgeTone="emerald"
            icon={<Plane size={16} />}
          />
          <StatCard
            title="Revisi / Ditolak"
            value={kaprodiStats.revisedOrRejectedCount}
            subtitle="Perlu perbaikan atau ditolak"
            badgeTone="rose"
            icon={<RotateCcw size={16} />}
          />
          <StatCard
            title="Estimasi Antrean"
            value={formatRupiah(kaprodiStats.pendingBudget)}
            subtitle="Total usulan berstatus Diajukan"
            badgeTone="blue"
            icon={<Wallet size={16} />}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab) => {
          const count = countsByStatus[tab] || 0;
          const isPendingTab = tab === 'DIAJUKAN';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{TAB_LABELS[tab]}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isPendingTab && isKaprodi
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Belum ada data perjalanan dinas untuk filter ini"
        />
      </div>

      <TripApprovalModal
        trip={selectedTripForApproval}
        rkaDocs={rkaDocs}
        open={Boolean(selectedTripForApproval)}
        onClose={() => setSelectedTripForApproval(null)}
        onDecided={handleDecided}
      />
    </div>
  );
}

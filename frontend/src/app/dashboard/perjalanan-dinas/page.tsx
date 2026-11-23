'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import TripApprovalModal, { type TripDecision } from '@/components/perjalanan-dinas/TripApprovalModal';
import TripCompletenessModal from '@/components/perjalanan-dinas/TripCompletenessModal';
import TripRoleStats from '@/components/perjalanan-dinas/TripRoleStats';
import { buildTripTableColumns } from '@/components/perjalanan-dinas/tripTableColumns';
import { useUser } from '@/lib/context';
import { useBusinessTrips } from '@/lib/use-business-trips';
import { getTripTotalEstimasi, isTripOwnedByUser } from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import MotionCard from '@/components/motion/MotionCard';

const TABS = [
  'Semua',
  'DRAF',
  'DIAJUKAN',
  'PERLU_REVISI',
  'DISETUJUI',
  'DILAPORKAN',
  'SELESAI',
  'DITOLAK',
] as const;

const TAB_LABELS: Record<string, string> = {
  Semua: 'Semua',
  DRAF: 'Draf',
  DIAJUKAN: 'Menunggu Persetujuan',
  PERLU_REVISI: 'Perlu Revisi',
  DISETUJUI: 'Disetujui',
  DILAPORKAN: 'Dilaporkan',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

export default function PerjalananDinasPage() {
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';
  const isAdminProdi = currentRole === 'ADMIN_PRODI';
  const isDosen = currentRole === 'DOSEN';

  const { trips, rkaDocs, reload } = useBusinessTrips();
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [dosenScope, setDosenScope] = useState<'MINE' | 'ALL'>('MINE');
  const [selectedTripForApproval, setSelectedTripForApproval] = useState<BusinessTrip | null>(null);
  const [selectedTripForCompleteness, setSelectedTripForCompleteness] = useState<BusinessTrip | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const scopedTrips = useMemo(() => {
    let base = trips;
    if (isDosen && dosenScope === 'MINE') {
      base = trips.filter((t) => isTripOwnedByUser(t, user.id));
    }

    return [...base].sort((a, b) => {
      if (isKaprodi) {
        if (a.status === 'DIAJUKAN' && b.status !== 'DIAJUKAN') return -1;
        if (a.status !== 'DIAJUKAN' && b.status === 'DIAJUKAN') return 1;
      } else if (isAdminProdi) {
        if (a.status === 'DILAPORKAN' && b.status !== 'DILAPORKAN') return -1;
        if (a.status !== 'DILAPORKAN' && b.status === 'DILAPORKAN') return 1;
      } else if (isDosen) {
        const priority = (s: BusinessTrip['status']) =>
          s === 'PERLU_REVISI' ? 0 : s === 'DISETUJUI' ? 1 : s === 'DRAF' ? 2 : 3;
        const diff = priority(a.status) - priority(b.status);
        if (diff !== 0) return diff;
      }
      return (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at);
    });
  }, [trips, isKaprodi, isAdminProdi, isDosen, dosenScope, user.id]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { Semua: scopedTrips.length };
    for (const tab of TABS) {
      if (tab !== 'Semua') {
        counts[tab] = scopedTrips.filter((t) => t.status === tab).length;
      }
    }
    return counts;
  }, [scopedTrips]);

  const roleStats = useMemo(() => {
    const draftCount = scopedTrips.filter((t) => t.status === 'DRAF').length;
    const pendingCount = scopedTrips.filter((t) => t.status === 'DIAJUKAN').length;
    const revisionCount = scopedTrips.filter((t) => t.status === 'PERLU_REVISI').length;
    const approvedCount = scopedTrips.filter((t) => t.status === 'DISETUJUI').length;
    const reportedCount = scopedTrips.filter((t) => t.status === 'DILAPORKAN').length;
    const completedCount = scopedTrips.filter((t) => t.status === 'SELESAI').length;
    const rejectedCount = scopedTrips.filter((t) => t.status === 'DITOLAK').length;
    const pendingBudget = scopedTrips
      .filter((t) => t.status === 'DIAJUKAN')
      .reduce((sum, t) => sum + getTripTotalEstimasi(t), 0);

    return {
      draftCount,
      pendingCount,
      revisionCount,
      approvedCount,
      reportedCount,
      completedCount,
      rejectedCount,
      pendingBudget,
    };
  }, [scopedTrips]);

  const filtered = useMemo(
    () =>
      activeTab === 'Semua'
        ? scopedTrips
        : scopedTrips.filter((d) => d.status === activeTab),
    [activeTab, scopedTrips]
  );

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleDecided = (updatedTrip: BusinessTrip, decision: TripDecision) => {
    setSelectedTripForApproval(null);
    reload();
    const labelMap: Record<TripDecision, string> = {
      DISETUJUI: 'disetujui',
      PERLU_REVISI: 'dikembalikan untuk revisi',
      DITOLAK: 'ditolak',
    };
    showToast(`Usulan perjalanan dinas ke ${updatedTrip.tujuan} berhasil ${labelMap[decision]}.`);
  };

  const handleConfirmedCompleteness = (updatedTrip: BusinessTrip, lengkap: boolean) => {
    setSelectedTripForCompleteness(null);
    reload();
    showToast(
      lengkap
        ? `Kelengkapan bukti perjalanan ke ${updatedTrip.tujuan} dikonfirmasi selesai.`
        : `Perjalanan ke ${updatedTrip.tujuan} ditandai belum lengkap untuk dilengkapi pelaksana.`
    );
  };

  const columns = buildTripTableColumns({
    userId: user.id,
    isKaprodi,
    isAdminProdi,
    isDosen,
    dosenScope,
    rkaDocs,
    onApprove: setSelectedTripForApproval,
    onVerifyCompleteness: setSelectedTripForCompleteness,
    onViewDetail: (tripId) => router.push(`/dashboard/perjalanan-dinas/${tripId}`),
  });

  const pageDescription = isKaprodi
    ? 'Tinjau, setujui, dan pantau pengajuan rencana perjalanan dinas serta laporan pelaksanaannya.'
    : isAdminProdi
    ? 'Kelola administrasi perjalanan dinas, verifikasi kelengkapan bukti, dan pantau realisasi biaya prodi.'
    : 'Ajukan rencana perjalanan dinas, pantau status persetujuan Kaprodi, dan unggah laporan realisasi.';

  const roleBadgeLabel = isKaprodi
    ? 'Mode Kaprodi'
    : isAdminProdi
    ? 'Mode Admin Prodi'
    : isDosen
    ? 'Mode Dosen'
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perjalanan Dinas"
        description={pageDescription}
        badge={
          roleBadgeLabel ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
              {roleBadgeLabel}
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
                {roleStats.pendingCount > 0 && (
                  <span className="rounded-full bg-white text-blue-700 text-xs font-bold px-2 py-0.5">
                    {roleStats.pendingCount}
                  </span>
                )}
              </Link>
            )}

            {isAdminProdi && (
              <Link
                href="/dashboard/perjalanan-dinas/rekap"
                className="btn-primary text-xs sm:text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <FileSpreadsheet size={16} />
                Rekap &amp; Biaya
              </Link>
            )}

            <button
              onClick={() => router.push('/dashboard/perjalanan-dinas/baru')}
              className={
                isKaprodi || isAdminProdi
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

      {/* Ringkasan StatCard sesuai Peran */}
      <TripRoleStats
        isKaprodi={isKaprodi}
        isAdminProdi={isAdminProdi}
        isDosen={isDosen}
        roleStats={roleStats}
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map((tab) => {
            const count = countsByStatus[tab] || 0;
            const highlightTab =
              (isKaprodi && tab === 'DIAJUKAN') ||
              (isAdminProdi && tab === 'DILAPORKAN') ||
              (isDosen && (tab === 'PERLU_REVISI' || tab === 'DISETUJUI'));
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
                      highlightTab
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

        {isDosen && (
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit shrink-0">
            <button
              type="button"
              onClick={() => setDosenScope('MINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dosenScope === 'MINE'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Perjalanan Saya
            </button>
            <button
              type="button"
              onClick={() => setDosenScope('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dosenScope === 'ALL'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Semua Perjalanan Prodi
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <MotionCard index={0} interactive={false} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Belum ada data perjalanan dinas untuk filter ini"
        />
      </MotionCard>

      <TripApprovalModal
        trip={selectedTripForApproval}
        rkaDocs={rkaDocs}
        open={Boolean(selectedTripForApproval)}
        onClose={() => setSelectedTripForApproval(null)}
        onDecided={handleDecided}
      />

      <TripCompletenessModal
        trip={selectedTripForCompleteness}
        open={Boolean(selectedTripForCompleteness)}
        onClose={() => setSelectedTripForCompleteness(null)}
        onConfirmed={handleConfirmedCompleteness}
      />
    </div>
  );
}

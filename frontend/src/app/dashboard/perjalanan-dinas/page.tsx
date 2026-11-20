'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  Plus,
  UploadCloud,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import TripApprovalModal, { type TripDecision } from '@/components/perjalanan-dinas/TripApprovalModal';
import TripCompletenessModal from '@/components/perjalanan-dinas/TripCompletenessModal';
import TripRoleStats from '@/components/perjalanan-dinas/TripRoleStats';
import TripFilterBar, { TRIP_TABS } from '@/components/perjalanan-dinas/TripFilterBar';
import { useUser } from '@/lib/context';
import { useBusinessTrips } from '@/lib/use-business-trips';
import {
  getTripLeadName,
  getTripPolicyWarnings,
  getTripTotalEstimasi,
  isTripIncomplete,
  isTripLateReport,
  isTripOwnedByUser,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

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
    for (const tab of TRIP_TABS) {
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

  const columns: DataTableColumn<BusinessTrip>[] = [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud',
      render: (row) => {
        const isOwner = isTripOwnedByUser(row, user.id);
        const warnings = isKaprodi ? getTripPolicyWarnings(row, rkaDocs) : [];
        const incompleteFlag = (isAdminProdi || isOwner) && isTripIncomplete(row);
        const lateFlag = (isAdminProdi || isOwner) && isTripLateReport(row);

        return (
          <div className="min-w-0 max-w-md">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">{row.tujuan}</p>
              {isDosen && dosenScope === 'ALL' && isOwner && (
                <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                  Milik Saya
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[320px]">{row.maksud_kegiatan}</p>

            {row.status === 'PERLU_REVISI' && row.catatan_keputusan && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1 line-clamp-1">
                Revisi Kaprodi: {row.catatan_keputusan}
              </p>
            )}

            {warnings.map((w, idx) => (
              <span
                key={`w-${idx}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1 mr-1"
              >
                <AlertTriangle size={11} /> {w}
              </span>
            ))}

            {incompleteFlag && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1 mr-1">
                <AlertTriangle size={11} /> Bukti/Laporan Belum Lengkap
              </span>
            )}

            {lateFlag && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded mt-1 mr-1">
                <Clock size={11} /> Melewati Tenggat Laporan
              </span>
            )}
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
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.nomor_surat_tugas && (
            <div className="text-[10px] font-mono text-slate-500">{row.nomor_surat_tugas}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => {
        const isOwner = isTripOwnedByUser(row, user.id);
        const canDosenEdit = isDosen && isOwner && (row.status === 'DRAF' || row.status === 'PERLU_REVISI');
        const canDosenReport =
          isDosen &&
          isOwner &&
          (row.status === 'DISETUJUI' || (row.status === 'DILAPORKAN' && Boolean(row.is_belum_lengkap)));

        return (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            {isKaprodi && row.status === 'DIAJUKAN' && (
              <button
                onClick={() => setSelectedTripForApproval(row)}
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Tinjau &amp; Setujui
              </button>
            )}

            {isAdminProdi && row.status === 'DILAPORKAN' && (
              <button
                onClick={() => setSelectedTripForCompleteness(row)}
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <FileCheck size={13} /> Verifikasi Berkas
              </button>
            )}

            {canDosenEdit && (
              <Link
                href={`/dashboard/perjalanan-dinas/baru?edit=${row.id}`}
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <Edit3 size={13} /> {row.status === 'PERLU_REVISI' ? 'Revisi & Ajukan' : 'Lanjutkan Draf'}
              </Link>
            )}

            {canDosenReport && (
              <Link
                href={`/dashboard/perjalanan-dinas/${row.id}/laporan`}
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <UploadCloud size={13} /> {row.is_belum_lengkap ? 'Lengkapi Bukti' : 'Laporkan Hasil'}
              </Link>
            )}

            <button
              onClick={() => router.push(`/dashboard/perjalanan-dinas/${row.id}`)}
              className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
            >
              <Eye size={13} /> Detail
            </button>
          </div>
        );
      },
    },
  ];

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

      <TripRoleStats
        isKaprodi={isKaprodi}
        isAdminProdi={isAdminProdi}
        isDosen={isDosen}
        stats={roleStats}
      />

      <TripFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        countsByStatus={countsByStatus}
        isKaprodi={isKaprodi}
        isAdminProdi={isAdminProdi}
        isDosen={isDosen}
        dosenScope={dosenScope}
        onDosenScopeChange={setDosenScope}
      />

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

      <TripCompletenessModal
        trip={selectedTripForCompleteness}
        open={Boolean(selectedTripForCompleteness)}
        onClose={() => setSelectedTripForCompleteness(null)}
        onConfirmed={handleConfirmedCompleteness}
      />
    </div>
  );
}

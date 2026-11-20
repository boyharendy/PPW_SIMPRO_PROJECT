'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileCheck,
  UploadCloud,
} from 'lucide-react';
import type { DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  getTripLeadName,
  getTripPolicyWarnings,
  getTripTotalEstimasi,
  isTripIncomplete,
  isTripLateReport,
  isTripOwnedByUser,
} from '@/lib/trip-utils';
import type { BusinessTrip, RkaDocument } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

interface BuildTripColumnsOptions {
  userId: string;
  isKaprodi: boolean;
  isAdminProdi: boolean;
  isDosen: boolean;
  dosenScope: 'MINE' | 'ALL';
  rkaDocs: RkaDocument[];
  onApprove: (trip: BusinessTrip) => void;
  onVerifyCompleteness: (trip: BusinessTrip) => void;
  onViewDetail: (tripId: string) => void;
}

export function buildTripTableColumns({
  userId,
  isKaprodi,
  isAdminProdi,
  isDosen,
  dosenScope,
  rkaDocs,
  onApprove,
  onVerifyCompleteness,
  onViewDetail,
}: BuildTripColumnsOptions): DataTableColumn<BusinessTrip>[] {
  return [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud',
      render: (row) => {
        const isOwner = isTripOwnedByUser(row, userId);
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
        const isOwner = isTripOwnedByUser(row, userId);
        const canDosenEdit =
          isDosen && isOwner && (row.status === 'DRAF' || row.status === 'PERLU_REVISI');
        const canDosenReport =
          isDosen &&
          isOwner &&
          (row.status === 'DISETUJUI' ||
            (row.status === 'DILAPORKAN' && Boolean(row.is_belum_lengkap)));

        return (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            {isKaprodi && row.status === 'DIAJUKAN' && (
              <button
                onClick={() => onApprove(row)}
                className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Tinjau &amp; Setujui
              </button>
            )}

            {isAdminProdi && row.status === 'DILAPORKAN' && (
              <button
                onClick={() => onVerifyCompleteness(row)}
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
              onClick={() => onViewDetail(row.id)}
              className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
            >
              <Eye size={13} /> Detail
            </button>
          </div>
        );
      },
    },
  ];
}

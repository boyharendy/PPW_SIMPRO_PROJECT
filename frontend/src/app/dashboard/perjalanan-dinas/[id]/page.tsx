'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  FileCheck,
  MapPin,
  Paperclip,
  UploadCloud,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import TripApprovalModal, { type TripDecision } from '@/components/perjalanan-dinas/TripApprovalModal';
import TripCompletenessModal from '@/components/perjalanan-dinas/TripCompletenessModal';
import { useUser } from '@/lib/context';
import { useBusinessTrips } from '@/lib/use-business-trips';
import {
  getTripBudgetItem,
  getTripLeadName,
  getTripParticipantsDisplay,
  getTripTotalEstimasi,
  getTripTotalRealisasi,
  isTripOwnedByUser,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatDateTime, formatRupiah, getStatusLabel } from '@/lib/utils';

export default function DetailPerjalananDinasPage() {
  const { id } = useParams<{ id: string }>();
  const { user, currentRole } = useUser();
  const { trips, rkaDocs, isLoading, reload } = useBusinessTrips();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCompletenessModal, setShowCompletenessModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  const participants = useMemo(
    () => (trip ? getTripParticipantsDisplay(trip) : []),
    [trip]
  );
  const budgetItem = useMemo(
    () => (trip ? getTripBudgetItem(trip, rkaDocs) : undefined),
    [trip, rkaDocs]
  );

  if (!trip && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/perjalanan-dinas"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Perjalanan Dinas
        </Link>
        <div className="card text-center py-12 space-y-2">
          <p className="text-sm font-semibold text-slate-800">Data perjalanan dinas tidak ditemukan.</p>
          <p className="text-xs text-slate-500">ID: {id}</p>
        </div>
      </div>
    );
  }

  const isKaprodi = currentRole === 'KAPRODI';
  const isAdminProdi = currentRole === 'ADMIN_PRODI';
  const isDosen = currentRole === 'DOSEN';
  const isOwner = isTripOwnedByUser(trip, user.id);

  const canEditOrResubmit =
    (isAdminProdi || (isDosen && isOwner) || (isKaprodi && isOwner)) &&
    (trip.status === 'DRAF' || trip.status === 'PERLU_REVISI');

  const canSubmitReport =
    (isAdminProdi || (isDosen && isOwner) || (isKaprodi && isOwner)) &&
    (trip.status === 'DISETUJUI' || (trip.status === 'DILAPORKAN' && Boolean(trip.is_belum_lengkap)));

  const totalEstimasi = getTripTotalEstimasi(trip);
  const totalRealisasi = getTripTotalRealisasi(trip);
  const anggotaOnly = participants
    .filter((p) => p.peran === 'ANGGOTA')
    .map((p) => p.nama);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleDecided = (_updated: BusinessTrip, decision: TripDecision) => {
    setShowApprovalModal(false);
    reload();
    const labelMap: Record<TripDecision, string> = {
      DISETUJUI: 'disetujui',
      PERLU_REVISI: 'dikembalikan untuk revisi',
      DITOLAK: 'ditolak',
    };
    showToast(`Usulan perjalanan dinas berhasil ${labelMap[decision]}.`);
  };

  const handleConfirmedCompleteness = (_updated: BusinessTrip, lengkap: boolean) => {
    setShowCompletenessModal(false);
    reload();
    showToast(
      lengkap
        ? 'Kelengkapan berkas perjalanan dinas dikonfirmasi selesai.'
        : 'Perjalanan dinas ditandai belum lengkap.'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/perjalanan-dinas"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Perjalanan Dinas
        </Link>
      </div>

      <PageHeader
        title={`Perjalanan Dinas ke ${trip.tujuan}`}
        description={`Nomor Surat Tugas: ${trip.nomor_surat_tugas || 'Belum Diterbitkan'} • ID: ${trip.id}`}
        badge={<StatusBadge status={trip.status} size="sm" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isKaprodi && trip.status === 'DIAJUKAN' && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Tinjau &amp; Setujui
              </button>
            )}

            {isAdminProdi && trip.status === 'DILAPORKAN' && (
              <button
                onClick={() => setShowCompletenessModal(true)}
                className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <FileCheck size={14} /> Verifikasi Berkas
              </button>
            )}

            {canEditOrResubmit && (
              <Link
                href={`/dashboard/perjalanan-dinas/baru?edit=${trip.id}`}
                className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <Edit3 size={14} /> {trip.status === 'PERLU_REVISI' ? 'Revisi & Ajukan Ulang' : 'Edit & Ajukan'}
              </Link>
            )}

            {canSubmitReport && (
              <Link
                href={`/dashboard/perjalanan-dinas/${trip.id}/laporan`}
                className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <UploadCloud size={14} /> {trip.is_belum_lengkap ? 'Lengkapi Bukti & Laporan' : 'Kirim Laporan Realisasi'}
              </Link>
            )}
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

      {/* Catatan Keputusan / Kelengkapan */}
      {(trip.catatan_keputusan || trip.catatan_kelengkapan) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.catatan_keputusan && (
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1 ${
                trip.status === 'PERLU_REVISI'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : trip.status === 'DITOLAK'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                {trip.status === 'PERLU_REVISI' && <AlertTriangle size={14} className="text-amber-600" />}
                Catatan Keputusan Kaprodi
              </div>
              <p className="leading-relaxed">{trip.catatan_keputusan}</p>
              {trip.disetujui_at && (
                <p className="text-[11px] opacity-75">
                  Diputuskan pada {formatDateTime(trip.disetujui_at)}
                </p>
              )}
            </div>
          )}

          {trip.catatan_kelengkapan && (
            <div
              className={`rounded-2xl border p-4 text-xs space-y-1 ${
                trip.is_belum_lengkap
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileCheck size={14} /> Catatan Kelengkapan Admin Prodi
              </div>
              <p className="leading-relaxed">{trip.catatan_kelengkapan}</p>
              {trip.dikonfirmasi_at && (
                <p className="text-[11px] opacity-75">
                  Dikonfirmasi pada {formatDateTime(trip.dikonfirmasi_at)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rincian Kegiatan & Pembiayaan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Informasi Surat Tugas &amp; Jadwal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Kota / Lokasi Tujuan:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin size={13} className="text-rose-500" /> {trip.tujuan}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Jadwal Perjalanan:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar size={13} className="text-blue-500" /> {formatDateShort(trip.tanggal_berangkat)} s.d.{' '}
                {formatDateShort(trip.tanggal_kembali)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Pelaksana Utama:</span>
              <span className="font-medium text-slate-800">{getTripLeadName(trip)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Anggota Rombongan:</span>
              <span className="font-medium text-slate-800">{anggotaOnly.join(', ') || '-'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Maksud &amp; Output Kegiatan:</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                {trip.maksud_kegiatan}
              </p>
            </div>
            {trip.laporan_hasil && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Laporan Hasil Perjalanan:</span>
                <p className="text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
                  {trip.laporan_hasil}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Anggaran & Pos RKA */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Sumber Pembiayaan
          </h3>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Sumber Dana:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 inline-block">
              {getStatusLabel(trip.sumber_dana)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Alokasi Pos RKA:</span>
            <span className="text-xs text-slate-700 font-medium block">
              {budgetItem
                ? `${budgetItem.kode_pos} — ${budgetItem.nama_pos}`
                : trip.sumber_dana === 'RKA_PRODI'
                ? trip.rka_budget_item_id || 'Belum ditautkan'
                : 'Non-RKA Prodi'}
            </span>
            {budgetItem?.sisa_anggaran !== undefined && (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Sisa Anggaran: {formatRupiah(budgetItem.sisa_anggaran)}
              </span>
            )}
          </div>
          {trip.batas_laporan && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 block mb-0.5">Batas Pengumpulan Laporan:</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                {formatDateShort(trip.batas_laporan)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Komparasi Estimasi vs Realisasi Biaya */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Rincian Estimasi vs Realisasi Biaya
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Komponen Biaya</th>
                <th className="py-2.5 px-3">Keterangan</th>
                <th className="py-2.5 px-3 text-right">Estimasi Usulan</th>
                <th className="py-2.5 px-3 text-right">Realisasi Riil</th>
                <th className="py-2.5 px-3">Bukti Berkas</th>
                <th className="py-2.5 px-3 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(trip.costs || []).map((b) => {
                const real = b.realisasi_biaya ?? 0;
                const diff = real - b.estimasi_biaya;
                const hasReal = b.realisasi_biaya !== undefined;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {getStatusLabel(b.komponen)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{b.keterangan || '-'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatRupiah(b.estimasi_biaya)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                      {hasReal ? formatRupiah(real) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {b.nama_berkas_bukti?.trim() ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <Paperclip size={11} /> {b.nama_berkas_bukti}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        !hasReal
                          ? 'text-slate-400'
                          : diff <= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {!hasReal
                        ? '-'
                        : diff <= 0
                        ? `- ${formatRupiah(Math.abs(diff))}`
                        : `+ ${formatRupiah(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-medium bg-slate-50/70">
                <td colSpan={2} className="py-3 px-3 text-slate-900 font-semibold">
                  Total Akumulasi Biaya
                </td>
                <td className="py-3 px-3 text-right text-slate-700">
                  {formatRupiah(totalEstimasi)}
                </td>
                <td className="py-3 px-3 text-right text-blue-700 font-semibold">
                  {totalRealisasi > 0 ? formatRupiah(totalRealisasi) : '-'}
                </td>
                <td />
                <td className="py-3 px-3 text-right font-medium">
                  {totalRealisasi <= 0 ? (
                    <span className="text-slate-400">-</span>
                  ) : totalRealisasi <= totalEstimasi ? (
                    <span className="text-emerald-700">
                      Hemat {formatRupiah(totalEstimasi - totalRealisasi)}
                    </span>
                  ) : (
                    <span className="text-rose-600">
                      Lebih {formatRupiah(totalRealisasi - totalEstimasi)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <TripApprovalModal
        trip={trip}
        rkaDocs={rkaDocs}
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onDecided={handleDecided}
      />

      <TripCompletenessModal
        trip={trip}
        open={showCompletenessModal}
        onClose={() => setShowCompletenessModal(false)}
        onConfirmed={handleConfirmedCompleteness}
      />
    </div>
  );
}

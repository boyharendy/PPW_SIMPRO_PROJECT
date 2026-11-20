'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  RotateCcw,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { BusinessTrip, RkaDocument } from '@/lib/types';
import { tripService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  getTripBudgetItem,
  getTripParticipantsDisplay,
  getTripPolicyWarnings,
  getTripTotalEstimasi,
  suggestSuratTugasNumber,
} from '@/lib/trip-utils';
import { formatDateShort, formatDateTime, formatRupiah, getStatusLabel } from '@/lib/utils';

export type TripDecision = 'DISETUJUI' | 'PERLU_REVISI' | 'DITOLAK';

interface TripApprovalModalProps {
  trip: BusinessTrip | null;
  rkaDocs: RkaDocument[];
  open: boolean;
  onClose: () => void;
  onDecided: (updatedTrip: BusinessTrip, decision: TripDecision) => void;
}

export default function TripApprovalModal({
  trip,
  rkaDocs,
  open,
  onClose,
  onDecided,
}: TripApprovalModalProps) {
  const { user, currentRole } = useUser();
  const [noSuratTugas, setNoSuratTugas] = useState('');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trip || !open) return;
    setNoSuratTugas(suggestSuratTugasNumber(trip));
    setCatatan(trip.catatan_keputusan || '');
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [trip, open]);

  useEffect(() => {
    if (errorMsg) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [errorMsg]);

  const participants = useMemo(
    () => (trip ? getTripParticipantsDisplay(trip) : []),
    [trip]
  );
  const totalEstimasi = useMemo(
    () => (trip ? getTripTotalEstimasi(trip) : 0),
    [trip]
  );
  const budgetItem = useMemo(
    () => (trip ? getTripBudgetItem(trip, rkaDocs) : undefined),
    [trip, rkaDocs]
  );
  const warnings = useMemo(
    () => (trip ? getTripPolicyWarnings(trip, rkaDocs) : []),
    [trip, rkaDocs]
  );

  if (!trip) return null;

  const isPending = trip.status === 'DIAJUKAN';
  const canApprove = currentRole === 'KAPRODI' && isPending;

  const handleDecision = async (decision: TripDecision) => {
    setErrorMsg(null);

    if (decision === 'DISETUJUI' && !noSuratTugas.trim()) {
      setErrorMsg('Nomor Surat Tugas wajib diisi sebelum menyetujui perjalanan dinas.');
      return;
    }

    if ((decision === 'PERLU_REVISI' || decision === 'DITOLAK') && !catatan.trim()) {
      setErrorMsg(
        decision === 'PERLU_REVISI'
          ? 'Catatan revisi wajib diisi agar pengaju mengetahui bagian yang perlu diperbaiki.'
          : 'Alasan penolakan wajib diisi sebelum menolak usulan perjalanan dinas.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await tripService.approveTrip(trip.id, {
        status: decision,
        nomor_surat_tugas: decision === 'DISETUJUI' ? noSuratTugas.trim() : undefined,
        catatan: catatan.trim() || (decision === 'DISETUJUI' ? 'Disetujui oleh Kaprodi.' : undefined),
        disetujui_oleh: user.id || 'u-kaprodi',
      });

      const updatedTrip: BusinessTrip = res.data || {
        ...trip,
        status: decision,
        nomor_surat_tugas: decision === 'DISETUJUI' ? noSuratTugas.trim() : trip.nomor_surat_tugas,
        catatan_keputusan: catatan.trim(),
      };

      onDecided(updatedTrip, decision);
    } catch {
      setErrorMsg('Terjadi kesalahan saat menyimpan keputusan persetujuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = canApprove ? (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onClose}
        className="btn-secondary text-xs px-3.5 py-2"
      >
        Tutup
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleDecision('DITOLAK')}
          className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <XCircle size={14} /> Tolak
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleDecision('PERLU_REVISI')}
          className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCcw size={14} /> Minta Revisi
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleDecision('DISETUJUI')}
          className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <CheckCircle2 size={14} /> Setujui Usulan
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary text-xs px-4 py-2"
      >
        Tutup
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        canApprove
          ? `Persetujuan Perjalanan Dinas: ${trip.tujuan}`
          : `Detail Usulan Perjalanan Dinas: ${trip.tujuan}`
      }
      footer={footerContent}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div
            ref={errorRef}
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Ringkasan Informasi Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin size={11} /> Tujuan
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">{trip.tujuan}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar size={11} /> Jadwal
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {formatDateShort(trip.tanggal_berangkat)} – {formatDateShort(trip.tanggal_kembali)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Wallet size={11} /> Sumber Dana
            </span>
            <span className="font-semibold text-blue-700 mt-0.5 block">
              {getStatusLabel(trip.sumber_dana)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Status
            </span>
            <div className="mt-0.5">
              <StatusBadge status={trip.status} size="sm" />
            </div>
          </div>
        </div>

        {/* Maksud Kegiatan & Pelaksana */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText size={13} className="text-blue-600" /> Maksud Kegiatan
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">{trip.maksud_kegiatan}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users size={13} className="text-indigo-600" /> Pelaksana &amp; Peserta ({participants.length})
            </span>
            <ul className="space-y-1.5">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-800 truncate">{p.nama}</span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      p.peran === 'KETUA_ROMBONGAN'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {p.peran === 'KETUA_ROMBONGAN' ? 'Ketua' : 'Anggota'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pos RKA (jika terkait RKA Prodi) */}
        {(trip.sumber_dana === 'RKA_PRODI' || budgetItem) && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Alokasi Pos Anggaran RKA
              </span>
              <span className="font-semibold text-slate-900">
                {budgetItem
                  ? `${budgetItem.kode_pos} — ${budgetItem.nama_pos}`
                  : trip.rka_budget_item_id || 'Pos RKA Perjalanan Dinas'}
              </span>
            </div>
            {budgetItem?.sisa_anggaran !== undefined && (
              <div className="sm:text-right">
                <span className="text-[10px] text-slate-500 block">Sisa Anggaran Pos RKA</span>
                <span
                  className={`font-bold ${
                    totalEstimasi > budgetItem.sisa_anggaran ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(budgetItem.sisa_anggaran)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Peringatan Kebijakan */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2 text-amber-800">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Peringatan Kebijakan:</strong> {w}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rincian Estimasi Biaya per Komponen (FR-33) */}
        <div>
          <h4 className="font-bold text-slate-800 mb-2">Rincian Estimasi Biaya per Komponen</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Komponen</th>
                  <th className="px-3 py-2">Keterangan</th>
                  <th className="px-3 py-2 text-right">Estimasi Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(trip.costs || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                      Tidak ada rincian komponen biaya.
                    </td>
                  </tr>
                ) : (
                  trip.costs.map((cost) => (
                    <tr key={cost.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {getStatusLabel(cost.komponen)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{cost.keterangan || '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {formatRupiah(cost.estimasi_biaya)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                  <td colSpan={2} className="px-3 py-2.5">
                    Total Estimasi Biaya
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-700">
                    {formatRupiah(totalEstimasi)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Form Keputusan Kaprodi vs Riwayat Keputusan */}
        {canApprove ? (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Surat Tugas <span className="text-slate-400 font-normal">(Wajib saat menyetujui)</span>
              </label>
              <input
                type="text"
                value={noSuratTugas}
                onChange={(e) => setNoSuratTugas(e.target.value)}
                placeholder="Contoh: ST/096/UNIV-SI/XI/2026"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Keputusan Kaprodi <span className="text-slate-400 font-normal">(Wajib jika meminta revisi atau menolak)</span>
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan arahan persetujuan, poin revisi, atau alasan penolakan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Catatan &amp; Status Keputusan
              </span>
              {trip.nomor_surat_tugas && (
                <div className="text-xs text-slate-700">
                  <strong>No. Surat Tugas:</strong>{' '}
                  <span className="font-mono font-semibold text-slate-900">{trip.nomor_surat_tugas}</span>
                </div>
              )}
              {trip.disetujui_at && (
                <div className="text-xs text-slate-700">
                  <strong>Waktu Persetujuan:</strong> {formatDateTime(trip.disetujui_at)}
                </div>
              )}
              <div className="text-xs text-slate-700">
                <strong>Catatan Keputusan:</strong> {trip.catatan_keputusan || 'Belum ada catatan keputusan.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

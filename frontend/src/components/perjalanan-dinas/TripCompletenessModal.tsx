'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  MapPin,
  Paperclip,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { tripService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  getTripLeadName,
  getTripTotalEstimasi,
  getTripTotalRealisasi,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatDateTime, formatRupiah, getStatusLabel } from '@/lib/utils';

interface TripCompletenessModalProps {
  trip: BusinessTrip | null;
  open: boolean;
  onClose: () => void;
  onConfirmed: (updatedTrip: BusinessTrip, lengkap: boolean) => void;
}

export default function TripCompletenessModal({
  trip,
  open,
  onClose,
  onConfirmed,
}: TripCompletenessModalProps) {
  const { user } = useUser();
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trip || !open) return;
    setCatatan(trip.catatan_kelengkapan || '');
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [trip, open]);

  useEffect(() => {
    if (errorMsg) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [errorMsg]);

  const totalEstimasi = useMemo(
    () => (trip ? getTripTotalEstimasi(trip) : 0),
    [trip]
  );
  const totalRealisasi = useMemo(
    () => (trip ? getTripTotalRealisasi(trip) : 0),
    [trip]
  );

  if (!trip) return null;

  const missingProofCount = (trip.costs || []).filter(
    (c) => (c.realisasi_biaya ?? 0) > 0 && !c.nama_berkas_bukti?.trim()
  ).length;

  const handleConfirm = async (lengkap: boolean) => {
    setErrorMsg(null);

    if (!lengkap && !catatan.trim()) {
      setErrorMsg('Catatan kekurangan berkas wajib diisi agar pelaksana dapat melengkapi bukti perjalanan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await tripService.confirmCompleteness(trip.id, {
        lengkap,
        catatan:
          catatan.trim() ||
          (lengkap ? 'Seluruh bukti pengeluaran dan laporan perjalanan dinas telah lengkap.' : undefined),
        dikonfirmasi_oleh: user.id || 'u-admin',
      });
      onConfirmed(res.data || trip, lengkap);
    } catch {
      setErrorMsg('Gagal menyimpan verifikasi kelengkapan perjalanan dinas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
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
          onClick={() => handleConfirm(false)}
          className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <AlertTriangle size={14} /> Tandai Belum Lengkap
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleConfirm(true)}
          className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <FileCheck size={14} /> Konfirmasi Lengkap &amp; Selesai
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Verifikasi Kelengkapan Berkas: ${trip.tujuan}`}
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

        {/* Ringkasan Perjalanan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin size={11} /> Pelaksana &amp; Tujuan
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">{trip.tujuan}</span>
            <span className="text-[11px] text-slate-500 block truncate">{getTripLeadName(trip)}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar size={11} /> Jadwal &amp; Lapor
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {formatDateShort(trip.tanggal_berangkat)} – {formatDateShort(trip.tanggal_kembali)}
            </span>
            {trip.laporan_dikirim_at && (
              <span className="text-[11px] text-slate-500 block">
                Dilaporkan: {formatDateTime(trip.laporan_dikirim_at)}
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              No. Surat Tugas
            </span>
            <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
              {trip.nomor_surat_tugas || '-'}
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

        {/* Laporan Hasil */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText size={13} className="text-blue-600" /> Laporan Hasil Perjalanan
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {trip.laporan_hasil || 'Belum ada uraian laporan hasil perjalanan.'}
          </p>
        </div>

        {missingProofCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-amber-800">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Terdapat <strong>{missingProofCount} komponen biaya</strong> dengan nominal realisasi yang belum melampirkan nama/berkas bukti.
            </span>
          </div>
        )}

        {/* Tabel Komparasi Biaya & Bukti */}
        <div>
          <h4 className="font-bold text-slate-800 mb-2">Rincian Realisasi Biaya &amp; Berkas Bukti</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Komponen</th>
                  <th className="px-3 py-2 text-right">Estimasi</th>
                  <th className="px-3 py-2 text-right">Realisasi</th>
                  <th className="px-3 py-2">Berkas Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(trip.costs || []).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {getStatusLabel(c.komponen)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {formatRupiah(c.estimasi_biaya)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {formatRupiah(c.realisasi_biaya ?? 0)}
                    </td>
                    <td className="px-3 py-2">
                      {c.nama_berkas_bukti?.trim() ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <Paperclip size={11} /> {c.nama_berkas_bukti}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Belum diunggah</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                  <td className="px-3 py-2.5">Total</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {formatRupiah(totalEstimasi)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-700">
                    {formatRupiah(totalRealisasi)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-medium text-slate-500">
                    {totalRealisasi <= totalEstimasi ? (
                      <span className="text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Hemat {formatRupiah(totalEstimasi - totalRealisasi)}
                      </span>
                    ) : (
                      <span className="text-rose-600">
                        Melebihi {formatRupiah(totalRealisasi - totalEstimasi)}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Catatan Kelengkapan Admin Prodi */}
        <div className="border-t border-slate-200 pt-4">
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Catatan Kelengkapan Admin Prodi{' '}
            <span className="text-slate-400 font-normal">(Wajib jika menandai belum lengkap)</span>
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catat kelengkapan kuitansi, tiket, bukti penginapan, atau berkas yang masih kurang..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}

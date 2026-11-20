'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Paperclip,
  Send,
  Upload,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { tripService } from '@/lib/api';
import { useBusinessTrips } from '@/lib/use-business-trips';
import type { BusinessTripCost, TripCostComponent } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

const DEFAULT_COMPONENTS: TripCostComponent[] = [
  'TRANSPORTASI',
  'AKOMODASI',
  'UANG_HARIAN',
  'LAINNYA',
];

export default function LaporanPerjalananDinasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, isLoading } = useBusinessTrips();

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  const [costRows, setCostRows] = useState<BusinessTripCost[]>([]);
  const [laporanHasil, setLaporanHasil] = useState('');
  const [initializedId, setInitializedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!trip || initializedId === trip.id) return;

    const initialRows: BusinessTripCost[] =
      trip.costs && trip.costs.length > 0
        ? trip.costs.map((c) => ({
            ...c,
            realisasi_biaya: c.realisasi_biaya ?? c.estimasi_biaya ?? 0,
            nama_berkas_bukti: c.nama_berkas_bukti || '',
          }))
        : DEFAULT_COMPONENTS.map((comp, idx) => ({
            id: `tc-${trip.id}-${idx}`,
            trip_id: trip.id,
            komponen: comp,
            estimasi_biaya: 0,
            realisasi_biaya: 0,
            nama_berkas_bukti: '',
          }));

    setCostRows(initialRows);
    setLaporanHasil(trip.laporan_hasil || '');
    setInitializedId(trip.id);
  }, [trip, initializedId]);

  const totalEstimasi = useMemo(
    () => costRows.reduce((sum, c) => sum + (c.estimasi_biaya || 0), 0),
    [costRows]
  );
  const totalRealisasi = useMemo(
    () => costRows.reduce((sum, c) => sum + (c.realisasi_biaya || 0), 0),
    [costRows]
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
        <div className="card text-center py-12">
          <p className="text-sm font-semibold text-slate-800">Data perjalanan dinas tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const updateRowRealisasi = (rowId: string, val: number) => {
    setCostRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, realisasi_biaya: Math.max(0, val) } : row))
    );
  };

  const updateRowProof = (rowId: string, fileName: string) => {
    setCostRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, nama_berkas_bukti: fileName } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!laporanHasil.trim()) {
      setErrorMsg('Uraian laporan hasil perjalanan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await tripService.submitReport(trip.id, {
        ringkasan_hasil: laporanHasil.trim(),
        biaya_realisasi: totalRealisasi,
        costs: costRows,
      });
      router.push(`/dashboard/perjalanan-dinas/${trip.id}`);
    } catch {
      setErrorMsg('Gagal mengirim laporan realisasi perjalanan dinas.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/perjalanan-dinas/${trip.id}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Detail Perjalanan
        </Link>
      </div>

      <PageHeader
        title={`Laporan Realisasi Perjalanan Dinas: ${trip.tujuan}`}
        description={`No. Surat Tugas: ${trip.nomor_surat_tugas || '-'} • Jadwal: ${formatDateShort(
          trip.tanggal_berangkat
        )} – ${formatDateShort(trip.tanggal_kembali)}`}
      />

      {trip.is_belum_lengkap && trip.catatan_kelengkapan && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Catatan Kelengkapan dari Admin Prodi:</strong>
            <p className="mt-0.5">{trip.catatan_kelengkapan}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Realisasi Biaya & Unggah Bukti Per Komponen */}
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Realisasi Biaya Riil &amp; Bukti Pengeluaran
            </h3>
            <div className="text-xs text-slate-500">
              Estimasi: <strong>{formatRupiah(totalEstimasi)}</strong> &bull; Total Realisasi:{' '}
              <strong className="text-blue-700 font-mono text-sm">{formatRupiah(totalRealisasi)}</strong>
            </div>
          </div>

          <div className="space-y-3">
            {costRows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {getStatusLabel(row.komponen)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Estimasi: {formatRupiah(row.estimasi_biaya)}
                  </span>
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Realisasi Riil
                  </label>
                  <CurrencyInput
                    value={row.realisasi_biaya ?? 0}
                    onChange={(val) => updateRowRealisasi(row.id, val)}
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Bukti (PDF/JPG/PNG)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload size={13} /> Pilih Berkas
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) updateRowProof(row.id, file.name);
                        }}
                      />
                    </label>
                    <div className="min-w-0 flex-1 text-xs truncate">
                      {row.nama_berkas_bukti?.trim() ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <Paperclip size={12} /> {row.nama_berkas_bukti}
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum ada berkas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Laporan Naratif Hasil */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            2. Uraian Laporan Hasil Perjalanan
          </h3>
          <textarea
            rows={4}
            value={laporanHasil}
            onChange={(e) => setLaporanHasil(e.target.value)}
            placeholder="Jelaskan ringkasan jalannya kegiatan, capaian output, serta tindak lanjut yang diperlukan..."
            className="input-field resize-none text-xs leading-relaxed"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.back()}
            className="btn-secondary text-xs px-4 py-2"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? <CheckCircle2 size={14} /> : <Send size={14} />}
            {isSubmitting ? 'Menyimpan...' : 'Kirim Laporan Realisasi'}
          </button>
        </div>
      </form>
    </div>
  );
}

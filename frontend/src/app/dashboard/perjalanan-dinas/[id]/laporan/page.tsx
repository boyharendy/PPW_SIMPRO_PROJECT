'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FileUploader from '@/components/ui/FileUploader';
import { mockBusinessTrips } from '@/lib/mock-data';
import { tripService } from '@/lib/api/services/trip.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { BusinessTrip } from '@/lib/types';
import { ArrowLeft, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRupiah } from '@/lib/utils';

export default function LaporanPerjalananPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const trips = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
  const trip = trips.find((t) => t.id === tripId) || mockBusinessTrips[1];

  const [realTransport, setRealTransport] = useState(
    trip.costs.find((c) => c.komponen === 'TRANSPORTASI')?.estimasi_biaya || 0
  );
  const [realAkomodasi, setRealAkomodasi] = useState(
    trip.costs.find((c) => c.komponen === 'AKOMODASI')?.estimasi_biaya || 0
  );
  const [realUangHarian, setRealUangHarian] = useState(
    trip.costs.find((c) => c.komponen === 'UANG_HARIAN')?.estimasi_biaya || 0
  );
  const [realLainnya, setRealLainnya] = useState(0);
  const [laporanHasil, setLaporanHasil] = useState('');

  const totalRealisasi = realTransport + realAkomodasi + realUangHarian + realLainnya;
  const totalEstimasi = trip.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
  const isMelebihiEstimasi = totalRealisasi > totalEstimasi * 1.1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporanHasil.trim()) {
      alert('Teks laporan hasil kegiatan wajib diisi.');
      return;
    }

    const updatedPatch: Partial<BusinessTrip> = {
      status: 'DILAPORKAN',
      laporan_hasil: laporanHasil,
      laporan_dikirim_at: new Date().toISOString(),
      costs: trip.costs.map((c) => {
        if (c.komponen === 'TRANSPORTASI') return { ...c, realisasi_biaya: realTransport };
        if (c.komponen === 'AKOMODASI') return { ...c, realisasi_biaya: realAkomodasi };
        if (c.komponen === 'UANG_HARIAN') return { ...c, realisasi_biaya: realUangHarian };
        if (c.komponen === 'LAINNYA') return { ...c, realisasi_biaya: realLainnya };
        return c;
      }),
    };

    storageSync.update(STORAGE_KEYS.TRIPS, trip.id, updatedPatch, mockBusinessTrips);

    try {
      await tripService.submitReport(trip.id, {
        ringkasan_hasil: laporanHasil,
        realisasi_biaya: totalRealisasi,
        catatan: isMelebihiEstimasi ? 'Realisasi melebihi estimasi > 10%' : undefined,
      });
    } catch {
      // Offline fallback
    }

    router.push(`/dashboard/perjalanan-dinas/${trip.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/perjalanan-dinas/${trip.id}`}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Detail Perjalanan</span>
        </Link>
      </div>

      <PageHeader
        title="Laporan & Bukti Riil Perjalanan Dinas"
        description={`Tujuan: ${trip.tujuan} • Periode: ${formatDate(trip.tanggal_berangkat)} – ${formatDate(trip.tanggal_kembali)}`}
      />

      {isMelebihiEstimasi && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Realisasi Melebihi Estimasi &gt; 10%</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Total realisasi ({formatRupiah(totalRealisasi)}) lebih besar dari batas deviasi 10% estimasi awal ({formatRupiah(totalEstimasi)}). Mohon lampirkan kuitansi dan penjelasan kendala di laporan.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Realisasi Biaya Per Komponen */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                1. Realisasi Biaya Pengeluaran Riil
              </h3>
              <p className="text-xs text-slate-500">
                Isi nominal aktual yang dikeluarkan (boleh 0 bila tidak terpakai)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Realisasi</span>
              <p className="text-base font-extrabold text-emerald-700">{formatRupiah(totalRealisasi)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Realisasi Transportasi</label>
              <CurrencyInput value={realTransport} onChange={setRealTransport} className="text-xs" />
            </div>

            <div>
              <label className="label">Realisasi Akomodasi (Hotel)</label>
              <CurrencyInput value={realAkomodasi} onChange={setRealAkomodasi} className="text-xs" />
            </div>

            <div>
              <label className="label">Realisasi Uang Harian</label>
              <CurrencyInput value={realUangHarian} onChange={setRealUangHarian} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="label">Realisasi Biaya Lainnya (Opsional)</label>
              <CurrencyInput value={realLainnya} onChange={setRealLainnya} className="text-xs" />
            </div>
          </div>
        </div>

        {/* Upload Bukti */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              2. Unggah Berkas Bukti Pengeluaran & Foto Kegiatan
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai SKPL Bab 11 D2, kelengkapan wajib meliputi bukti tiket/kuitansi serta minimal satu Foto Kegiatan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUploader
              label="Tiket Perjalanan (Boarding Pass / Tiket KA / Kuitansi BBM)"
              category="TIKET"
            />
            <FileUploader
              label="Bukti Penginapan (Invoice Hotel / Penginapan)"
              category="BUKTI_PENGINAPAN"
            />
            <FileUploader
              label="Kuitansi Uang Harian & Transport Lokal"
              category="KUITANSI"
            />
            <FileUploader
              label="Foto Dokumentasi Kegiatan Resmi (Wajib)"
              category="FOTO_KEGIATAN"
              accept=".jpg,.jpeg,.png"
              helperText="Format: JPG, PNG (Foto di lokasi kegiatan)"
            />
          </div>
        </div>

        {/* Laporan Hasil */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800">3. Uraian Laporan Hasil Kegiatan</h3>
          <textarea
            rows={4}
            required
            value={laporanHasil}
            onChange={(e) => setLaporanHasil(e.target.value)}
            placeholder="Jelaskan ringkasan jalannya kegiatan, hasil capaian, tindak lanjut kerja sama, atau rekomendasi untuk prodi..."
            className="textarea-field text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/dashboard/perjalanan-dinas/${trip.id}`} className="btn-secondary text-xs">
            Batal
          </Link>
          <button type="submit" className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
            <Send size={15} />
            <span>Kirim Laporan & Bukti</span>
          </button>
        </div>
      </form>
    </div>
  );
}


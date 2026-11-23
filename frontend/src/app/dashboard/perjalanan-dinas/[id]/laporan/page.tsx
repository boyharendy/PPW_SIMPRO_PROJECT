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
import { tripService } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import { useBusinessTrips } from '@/lib/use-business-trips';
import type { BusinessTripCost, TripCostComponent } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

const DEFAULT_COMPONENTS: TripCostComponent[] = [
  'TRANSPORTASI',
  'AKOMODASI',
  'UANG_HARIAN',
  'LAINNYA',
];

export default function LaporanPerjalananDinasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, isLoading } = useBusinessTrips(id);

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  const [uploads,setUploads]=useState<Record<string,File>>({});
  const [photo,setPhoto]=useState<File | null>(null);
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
            realisasi_biaya: c.realisasi_biaya,
            nama_berkas_bukti: c.nama_berkas_bukti || '',
          }))
        : DEFAULT_COMPONENTS.map((comp, idx) => ({
            id: `tc-${trip.id}-${idx}`,
            trip_id: trip.id,
            komponen: comp,
            estimasi_biaya: 0,
            realisasi_biaya: undefined,
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

  const updateRowRealisasi = (rowId: string, val: number | undefined) => {
    setCostRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, realisasi_biaya: val } : row))
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

    if (costRows.some(c => c.realisasi_biaya === undefined || c.realisasi_biaya < 0)) {
      setErrorMsg('Isi realisasi setiap komponen. Masukkan 0 bila tidak ada biaya.');
      return;
    }
    setIsSubmitting(true);
    try {
      const sendProof = async (file:File,kategori:string) => {
        const data=new FormData();data.set('file',file);data.set('kategori',kategori);
        await apiClient.upload('/trips/'+trip.id+'/proofs',data);
      };
      for (const row of costRows) {
        if(uploads[row.id]) {
          await sendProof(uploads[row.id],row.komponen==='TRANSPORTASI'?'TIKET':row.komponen==='AKOMODASI'?'BUKTI_PENGINAPAN':'KUITANSI');
          setUploads(prev=>{const next={...prev};delete next[row.id];return next;});
        }
      }
      if(photo){await sendProof(photo,'FOTO_KEGIATAN');setPhoto(null);}
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
        )} – ${formatDateShort(trip.tanggal_kembali)} (FR-34)`}
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
        <MotionCard index={0} interactive={false} className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <WordRevealHeading as="h3" text="1. Realisasi Biaya Riil & Bukti Pengeluaran (NF-07 & NF-08)" className="text-sm font-bold text-slate-800 uppercase tracking-wider" />
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
                  <input type="number" min="0" step="0.01" required className="input-field"
                    aria-label={'Realisasi ' + getStatusLabel(row.komponen)} value={row.realisasi_biaya ?? ''} placeholder="Rp"
                    onChange={e => updateRowRealisasi(row.id, e.target.value === '' ? undefined : e.target.valueAsNumber)}
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
                          if (file) {updateRowProof(row.id,file.name);setUploads(prev=>({...prev,[row.id]:file}));}
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
        </MotionCard>

        {/* 2. Laporan Naratif Hasil */}
        <MotionCard index={1} interactive={false} className="card space-y-3">
          <WordRevealHeading as="h3" text="2. Uraian Laporan Hasil Perjalanan" className="text-sm font-bold text-slate-800 uppercase tracking-wider" />
          <textarea
            rows={4}
            value={laporanHasil}
            onChange={(e) => setLaporanHasil(e.target.value)}
            placeholder="Jelaskan ringkasan jalannya kegiatan, capaian output, serta tindak lanjut yang diperlukan..."
            className="input-field resize-none text-xs leading-relaxed"
            required
          />
        </MotionCard>

        {/* Action Buttons */}
        <label className="block text-sm">Foto kegiatan<input type="file" accept=".png,.jpg,.jpeg" className="input-field" onChange={e=>setPhoto(e.target.files?.[0] || null)} /></label>
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

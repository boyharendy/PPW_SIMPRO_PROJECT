'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Upload, FileText, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { formatRupiah } from '@/lib/utils';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [realisasi, setRealisasi] = useState({
    transportasi: 2350000,
    akomodasi: 1100000,
    uangHarian: 1050000,
    lainLain: 750000,
  });

  const [laporanHasil, setLaporanHasil] = useState(
    'Perjalanan dinas ke Surabaya telah terlaksana dengan lancar. Tim telah mempresentasikan makalah ilmiah serta menandatangani nota kesepahaman penelitian bersama.'
  );

  const [submitted, setSubmitted] = useState(false);

  const totalRealisasi =
    realisasi.transportasi + realisasi.akomodasi + realisasi.uangHarian + realisasi.lainLain;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push(`/dashboard/perjalanan-dinas/${id}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/perjalanan-dinas/${id}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Detail Perjalanan
        </Link>
      </div>

      <PageHeader
        title="Laporan Realisasi Perjalanan Dinas"
        description="Unggah laporan kegiatan dan bukti pertanggungjawaban riil perjalanan dinas (FR-37)."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Realisasi Biaya */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Realisasi Biaya Riil (Pertanggungjawaban)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total Realisasi: <strong className="text-blue-700 font-mono text-sm">{formatRupiah(totalRealisasi)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Realisasi Tiket & Transportasi (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={realisasi.transportasi}
                onChange={(e) => setRealisasi({ ...realisasi, transportasi: Number(e.target.value) })}
                className="input-field font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Realisasi Penginapan & Akomodasi (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={realisasi.akomodasi}
                onChange={(e) => setRealisasi({ ...realisasi, akomodasi: Number(e.target.value) })}
                className="input-field font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Uang Harian & Konsumsi Riil (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={realisasi.uangHarian}
                onChange={(e) => setRealisasi({ ...realisasi, uangHarian: Number(e.target.value) })}
                className="input-field font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Biaya Lain-lain / Registrasi (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={realisasi.lainLain}
                onChange={(e) => setRealisasi({ ...realisasi, lainLain: Number(e.target.value) })}
                className="input-field font-mono text-xs"
                required
              />
            </div>
          </div>
        </div>

        {/* Unggah Berkas & Bukti */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            2. Berkas Bukti Pengeluaran & Dokumentasi Kegiatan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tiket Perjalanan', name: 'Tiket_PP_Surabaya.pdf' },
              { label: 'Bukti Penginapan', name: 'Invoice_Hotel_Santika.pdf' },
              { label: 'Kuitansi Registrasi', name: 'Kuitansi_Semnas.pdf' },
              { label: 'Foto Kegiatan', name: 'Foto_Presentasi_01.jpg' },
            ].map((b, i) => (
              <div key={i} className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center text-center justify-between min-h-[110px]">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <FileText size={16} />
                </div>
                <div className="text-xs font-semibold text-slate-700">{b.label}</div>
                <span className="text-[10px] text-emerald-600 font-medium truncate max-w-full">
                  ✓ {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Laporan Naratif Hasil */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            3. Uraian Laporan Hasil Perjalanan
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
            onClick={() => router.back()}
            className="btn-secondary text-xs px-4 py-2"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitted}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
          >
            {submitted ? <CheckCircle2 size={14} /> : <Send size={14} />}
            {submitted ? 'Terkirim...' : 'Kirim Laporan Realisasi'}
          </button>
        </div>
      </form>
    </div>
  );
}

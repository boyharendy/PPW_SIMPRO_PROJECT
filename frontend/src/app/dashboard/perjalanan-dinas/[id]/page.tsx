'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, UploadCloud, CheckCircle2, Clock, MapPin, Calendar, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function Page() {
  const { id } = useParams<{ id: string }>();

  const [trip] = useState({
    id: id || 'PD-001',
    tujuan: 'Surabaya, Jawa Timur',
    maksud: 'Menghadiri Seminar Nasional Teknologi Informasi dan Komunikasi 2025 serta koordinasi forum prodi SI.',
    pelaksana: 'Dr. Budi Santoso, M.Kom.',
    anggota: ['Siti Aminah, M.T.'],
    tglBerangkat: '2025-03-10',
    tglKembali: '2025-03-12',
    sumberDana: 'RKA_PRODI',
    posRka: 'POS-04 — Perjalanan Dinas Konferensi & Seminar',
    noSuratTugas: 'ST/088/UN-SI/III/2025',
    status: 'DISETUJUI',
    batasLaporan: '2025-03-19',
    biaya: [
      { komponen: 'Transportasi (Tiket Kereta/Pesawat)', estimasi: 2400000, realisasi: 2350000 },
      { komponen: 'Akomodasi (Penginapan 2 Malam)', estimasi: 1200000, realisasi: 1100000 },
      { komponen: 'Uang Harian & Konsumsi (3 Hari)', estimasi: 1050000, realisasi: 1050000 },
      { komponen: 'Lain-lain (Registrasi Seminar)', estimasi: 750000, realisasi: 750000 },
    ],
  });

  const totalEstimasi = trip.biaya.reduce((s, b) => s + b.estimasi, 0);
  const totalRealisasi = trip.biaya.reduce((s, b) => s + (b.realisasi || 0), 0);

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
        description={`Nomor Surat Tugas: ${trip.noSuratTugas || 'Belum Diterbitkan'} • ID: ${trip.id}`}
        badge={<StatusBadge status={trip.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/perjalanan-dinas/${trip.id}/laporan`}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <UploadCloud size={14} /> Kirim Laporan Realisasi
            </Link>
          </div>
        }
      />

      {/* Rincian Kegiatan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Informasi Surat Tugas & Jadwal
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Kota / Lokasi Tujuan:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin size={13} className="text-rose-500" /> {trip.tujuan}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Jadwal Perjalanan:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar size={13} className="text-blue-500" /> {formatDateShort(trip.tglBerangkat)} s.d. {formatDateShort(trip.tglKembali)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Pelaksana Utama:</span>
              <span className="font-medium text-slate-800">{trip.pelaksana}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Anggota Rombongan:</span>
              <span className="font-medium text-slate-800">{trip.anggota.join(', ') || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Maksud & Output Kegiatan:</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                {trip.maksud}
              </p>
            </div>
          </div>
        </div>

        {/* Anggaran & Pos RKA */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Sumber Pembiayaan
          </h3>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Sumber Dana:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {trip.sumberDana.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Alokasi Pos RKA:</span>
            <span className="text-xs text-slate-700 font-medium">{trip.posRka}</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400 block mb-0.5">Batas Pengumpulan Laporan:</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {formatDateShort(trip.batasLaporan)} (7 Hari kerja)
            </span>
          </div>
        </div>
      </div>

      {/* Komparasi Estimasi vs Realisasi Biaya */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Rincian Estimasi vs Realisasi Biaya (FR-35)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Komponen Biaya</th>
                <th className="py-2.5 px-3 text-right">Estimasi Usulan</th>
                <th className="py-2.5 px-3 text-right">Realisasi Riil</th>
                <th className="py-2.5 px-3 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trip.biaya.map((b, idx) => {
                const diff = (b.realisasi || 0) - b.estimasi;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{b.komponen}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-mono">{formatRupiah(b.estimasi)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 font-mono font-semibold">{formatRupiah(b.realisasi)}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${diff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {diff <= 0 ? `- ${formatRupiah(Math.abs(diff))}` : `+ ${formatRupiah(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/70">
                <td className="py-3 px-3 text-slate-900">Total Akumulasi Biaya</td>
                <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatRupiah(totalEstimasi)}</td>
                <td className="py-3 px-3 text-right text-blue-700 font-mono text-sm">{formatRupiah(totalRealisasi)}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  Hemat {formatRupiah(totalEstimasi - totalRealisasi)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

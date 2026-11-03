'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusStepper from '@/components/ui/StatusStepper';
import { mockBusinessTrips } from '@/lib/mock-data';
import type { BusinessTrip } from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Wallet,
  FileCheck,
  FileText,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRupiah } from '@/lib/utils';

const TRIP_STEPS = [
  { id: 'DRAF', label: 'Draf' },
  { id: 'DIAJUKAN', label: 'Diajukan' },
  { id: 'DISETUJUI', label: 'Disetujui' },
  { id: 'DILAPORKAN', label: 'Dilaporkan' },
  { id: 'SELESAI', label: 'Selesai' },
];

export default function DetailPerjalananPage() {
  const params = useParams();
  const tripId = params.id as string;

  const trip =
    mockBusinessTrips.find((t) => t.id === tripId) || mockBusinessTrips[0];

  const totalEstimasi = trip.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
  const totalRealisasi = trip.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/perjalanan-dinas"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Perjalanan</span>
        </Link>
      </div>

      <PageHeader
        title={`Perjalanan Dinas: ${trip.tujuan}`}
        description={`Pelaksana: ${trip.pengaju?.nama_lengkap} • Periode: ${formatDate(trip.tanggal_berangkat)} s.d. ${formatDate(trip.tanggal_kembali)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={trip.status} size="md" />
            {trip.status === 'DISETUJUI' && (
              <Link
                href={`/dashboard/perjalanan-dinas/${trip.id}/laporan`}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Upload size={14} />
                <span>Kirim Laporan & Bukti</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Stepper Card */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Alur Perjalanan Dinas
          </span>
          {trip.batas_laporan && (
            <span className="text-[11px] text-amber-600 font-medium">
              Batas Pelaporan: {formatDate(trip.batas_laporan)}
            </span>
          )}
        </div>
        <StatusStepper steps={TRIP_STEPS} currentStepId={trip.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cost Breakdown & Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biaya Estimasi vs Realisasi */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Rincian Biaya: Estimasi vs Realisasi
                </h3>
                <p className="text-xs text-slate-500">Perbandingan per komponen pembiayaan dinas</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Komponen Biaya</th>
                    <th className="px-3 py-2 text-right">Estimasi Diajukan</th>
                    <th className="px-3 py-2 text-right">Realisasi Riil</th>
                    <th className="px-3 py-2 text-left">Bukti Pendukung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trip.costs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-800">{c.komponen.replace('_', ' ')}</p>
                        {c.keterangan && (
                          <p className="text-[10px] text-slate-400">{c.keterangan}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-600">
                        {formatRupiah(c.estimasi_biaya)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                        {c.realisasi_biaya !== undefined ? formatRupiah(c.realisasi_biaya) : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {c.nama_berkas_bukti ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                            <FileText size={12} />
                            {c.nama_berkas_bukti}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum ada berkas</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                    <td className="px-3 py-2.5">Total Biaya</td>
                    <td className="px-3 py-2.5 text-right text-blue-600">{formatRupiah(totalEstimasi)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600">
                      {totalRealisasi > 0 ? formatRupiah(totalRealisasi) : '-'}
                    </td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Laporan Hasil Perjalanan */}
          {trip.laporan_hasil && (
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Laporan Hasil Perjalanan
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                {trip.laporan_hasil}
              </p>
              {trip.catatan_kelengkapan && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <FileCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Verifikasi Admin Prodi: </span>
                    <span>{trip.catatan_kelengkapan}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Metadata Details */}
        <div className="space-y-6">
          <div className="card space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Informasi Administrasi
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Nomor Surat Tugas</p>
                <p className="font-mono font-bold text-slate-800">
                  {trip.nomor_surat_tugas || 'Belum Diterbitkan'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Sumber Pembiayaan</p>
                <p className="font-semibold text-blue-700">{trip.sumber_dana.replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Maksud Perjalanan</p>
                <p className="text-slate-700 leading-relaxed">{trip.maksud_kegiatan}</p>
              </div>

              {trip.catatan_keputusan && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Catatan Keputusan Kaprodi</p>
                  <p className="text-slate-700 italic mt-0.5">&ldquo;{trip.catatan_keputusan}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


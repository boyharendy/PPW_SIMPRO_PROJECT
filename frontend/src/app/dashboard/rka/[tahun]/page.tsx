'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockRkaDocuments } from '@/lib/mock-data';
import type { RkaDocument } from '@/lib/types';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  History,
  Layers,
  Edit,
  FileText,
  PieChart,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, calculateAbsorptionPercentage, formatDateShort } from '@/lib/utils';

export default function DetailRkaPage() {
  const params = useParams();
  const router = useRouter();
  const tahun = Number(params.tahun) || 2025;

  const doc =
    mockRkaDocuments.find((d) => d.tahun_anggaran === tahun) || mockRkaDocuments[0];

  const [modalRevisiOpen, setModalRevisiOpen] = useState(false);
  const [alasanRevisi, setAlasanRevisi] = useState('');

  const serapanPct = calculateAbsorptionPercentage(doc.total_realisasi || 0, doc.total_anggaran);
  const sisaPagu = (doc.total_anggaran || 0) - (doc.total_realisasi || 0);

  const handleBukaRevisi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasanRevisi.trim()) {
      alert('Alasan revisi wajib diisi.');
      return;
    }

    const nextVerNomor = (doc.versions?.length || 1) + 1;
    doc.versions?.push({
      id: `rka-ver-${doc.tahun_anggaran}-${nextVerNomor}`,
      rka_id: doc.id,
      nomor_versi: nextVerNomor,
      status: 'DRAF',
      total_anggaran: doc.total_anggaran,
      alasan_revisi: alasanRevisi,
      row_version: 1,
      dibuat_oleh: 'u-admin',
      created_at: new Date().toISOString(),
    });

    setModalRevisiOpen(false);
    router.push(`/dashboard/rka/${doc.tahun_anggaran}/versi-kerja`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rka"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dokumen RKA</span>
        </Link>
      </div>

      <PageHeader
        title={doc.judul}
        description={`Tahun Anggaran ${doc.tahun_anggaran} • Dokumen Resmi Penganggaran Operasional Prodi SI`}
        action={
          doc.status === 'AKTIF' ? (
            <button
              type="button"
              onClick={() => setModalRevisiOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Edit size={14} />
              <span>Buka Revisi RKA</span>
            </button>
          ) : undefined
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Anggaran Aktif"
          value={formatRupiah(doc.total_anggaran)}
          subtitle="Pagu resmi yang berlaku"
          icon={<Wallet size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Serapan Riil"
          value={formatRupiah(doc.total_realisasi || 0)}
          subtitle="Tercatat dalam realisasi & SPJ"
          icon={<TrendingUp size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Persentase Serapan"
          value={`${serapanPct}%`}
          subtitle="Dari target pagu tahunan"
          icon={<PieChart size={20} />}
          color="blue"
        />
        <StatCard
          title="Sisa Pagu Tersedia"
          value={formatRupiah(sisaPagu)}
          subtitle="Dapat dialokasikan"
          icon={<Layers size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Activities and Versions Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Activities List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Kegiatan Aktif & Alokasi Pos Anggaran
                </h3>
                <p className="text-xs text-slate-500">
                  Data aktif resmi yang menjadi acuan pengajuan perjalanan dinas dan serapan anggaran
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {doc.activities?.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {act.kode_kegiatan}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          {act.nama_kegiatan}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Indikator: {act.indikator_kinerja} ({act.target_indikator})
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <StatusBadge status={act.status_pelaksanaan} size="sm" />
                    </div>
                  </div>

                  {/* Pos Anggaran Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-mono">Kode</th>
                          <th className="px-3 py-1.5 text-left">Nama Pos Anggaran</th>
                          <th className="px-3 py-1.5 text-right">Pagu Anggaran</th>
                          <th className="px-3 py-1.5 text-right">Realisasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {act.budget_items.map((pos) => (
                          <tr key={pos.id}>
                            <td className="px-3 py-2 font-mono text-slate-400">{pos.kode_pos}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{pos.nama_pos}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">
                              {formatRupiah(pos.nominal_anggaran)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                              {formatRupiah(pos.realisasi_total || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Versions History Timeline */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Riwayat Versi RKA</h3>
                <p className="text-xs text-slate-500">Jejak revisi tak berubah (Bab 11 D3)</p>
              </div>
              <History size={16} className="text-slate-400" />
            </div>

            <div className="space-y-3">
              {doc.versions?.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Versi {ver.nomor_versi}</span>
                    <StatusBadge status={ver.status} size="sm" />
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    Total: <strong className="text-slate-800">{formatRupiah(ver.total_anggaran)}</strong>
                  </p>

                  {ver.alasan_revisi && (
                    <p className="text-[10px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                      &ldquo;{ver.alasan_revisi}&rdquo;
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatDateShort(ver.created_at)}</span>
                    <Link
                      href={`/dashboard/rka/${doc.tahun_anggaran}/versi/${ver.nomor_versi}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Lihat Snapshot / Diff →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Buka Revisi Baru */}
      <Modal open={modalRevisiOpen} onClose={() => setModalRevisiOpen(false)} title="Buka Revisi RKA Baru" size="md">
        <form onSubmit={handleBukaRevisi} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
            Sesuai keputusan PRD (Bab 11 D3): Membuka revisi akan <strong>menyalin data aktif menjadi versi kerja baru</strong>. Data aktif resmi dan monitoring serapan tidak akan terpengaruh sampai versi revisi disetujui resmi oleh Kaprodi.
          </div>

          <div>
            <label className="label">Alasan Pembukaan Revisi (Wajib)</label>
            <textarea
              rows={3}
              required
              value={alasanRevisi}
              onChange={(e) => setAlasanRevisi(e.target.value)}
              placeholder="Contoh: Pergeseran anggaran pos perjalanan dinas ke pos registrasi konferensi internasional..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalRevisiOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Mulai Susun Versi Kerja
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


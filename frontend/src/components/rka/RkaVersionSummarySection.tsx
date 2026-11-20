'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, GitBranch, History } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import type { RkaVersion } from '@/lib/types';
import { formatDateShort, formatRupiah, getStatusLabel } from '@/lib/utils';

export function RkaNotFoundState({ tahun }: { tahun: string }) {
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/rka"
        className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
      >
        <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
      </Link>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <AlertCircle className="mx-auto text-amber-500" size={32} />
        <h2 className="text-lg font-bold text-slate-800">Dokumen RKA TA {tahun} Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Dokumen RKA untuk tahun anggaran ini belum dibuat atau telah dihapus.
        </p>
        <Link href="/dashboard/rka" className="btn-primary text-xs px-4 py-2 inline-flex">
          Kembali ke Daftar RKA
        </Link>
      </div>
    </div>
  );
}

interface RkaVersionToolbarProps {
  versions: RkaVersion[];
  selectedVersionNumber?: number;
  onSelectVersion: (num: number) => void;
  onOpenHistory: () => void;
}

export function RkaVersionToolbar({
  versions,
  selectedVersionNumber,
  onSelectVersion,
  onOpenHistory,
}: RkaVersionToolbarProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <Link
        href="/dashboard/rka"
        className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
      >
        <ArrowLeft size={14} /> Kembali ke Daftar Dokumen RKA
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <GitBranch size={13} className="text-blue-600" />
          <span className="text-slate-500 font-medium">Versi:</span>
          <select
            value={selectedVersionNumber ?? 1}
            onChange={(e) => onSelectVersion(Number(e.target.value))}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.nomor_versi}>
                v{v.nomor_versi} — {getStatusLabel(v.status)} ({formatRupiah(v.total_anggaran)})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          <History size={14} /> Riwayat Versi &amp; Audit Log
        </button>
      </div>
    </div>
  );
}

interface RkaVersionSummarySectionProps {
  versions: RkaVersion[];
  selectedVersionNumber?: number;
  onSelectVersion: (num: number) => void;
  onOpenHistory: () => void;
  isKaprodi: boolean;
  tahunAnggaran: number;
  revisionModalOpen: boolean;
  onCloseRevisionModal: () => void;
  onSubmitRevision: (alasan: string) => Promise<void>;
}

export default function RkaVersionSummarySection({
  versions,
  selectedVersionNumber,
  onSelectVersion,
  onOpenHistory,
  isKaprodi,
  tahunAnggaran,
  revisionModalOpen,
  onCloseRevisionModal,
  onSubmitRevision,
}: RkaVersionSummarySectionProps) {
  const [alasanRevisi, setAlasanRevisi] = useState('');

  useEffect(() => {
    if (revisionModalOpen) setAlasanRevisi('');
  }, [revisionModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasanRevisi.trim()) return;
    await onSubmitRevision(alasanRevisi.trim());
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">Riwayat Versi Dokumen</h2>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Bandingkan Versi &amp; Audit Log →
          </button>
        </div>
        <div className="space-y-2.5">
          {versions.map((v) => {
            const isSelected = v.nomor_versi === selectedVersionNumber;
            return (
              <div
                key={v.id}
                onClick={() => onSelectVersion(v.nomor_versi)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50/40'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    v{v.nomor_versi}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Versi {v.nomor_versi} • {formatRupiah(v.total_anggaran)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.alasan_revisi || 'Penyusunan RKA'} • {formatDateShort(v.diterapkan_at || v.created_at)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {isKaprodi && (
        <Modal
          open={revisionModalOpen}
          onClose={onCloseRevisionModal}
          title={`Buat Revisi RKA TA ${tahunAnggaran}`}
          size="sm"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-800 leading-relaxed">
              Membuat revisi akan mengarsipkan versi aktif saat ini sebagai snapshot <strong>read-only</strong> dan
              membuka draf versi baru (<strong>v{(versions[0]?.nomor_versi ?? 1) + 1}</strong>) untuk disunting dan disahkan.
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Alasan / Justifikasi Revisi *
              </label>
              <textarea
                rows={3}
                value={alasanRevisi}
                onChange={(e) => setAlasanRevisi(e.target.value)}
                placeholder="Contoh: Pergeseran pagu perjalanan dinas & penambahan alokasi lab..."
                className="input-field text-xs resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCloseRevisionModal}
                className="btn-secondary text-xs px-4 py-2"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary text-xs px-4 py-2">
                Buka Draf Revisi
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

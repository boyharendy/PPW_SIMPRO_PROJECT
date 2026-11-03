'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DiffViewer, { DiffItem } from '@/components/ui/DiffViewer';
import Modal from '@/components/ui/Modal';
import { mockRkaDocuments } from '@/lib/mock-data';
import type { RkaVersion } from '@/lib/types';
import { ArrowLeft, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function DetailVersiRkaPage() {
  const params = useParams();
  const router = useRouter();
  const tahun = Number(params.tahun) || 2025;
  const nomorVersi = Number(params.nomor) || 1;

  const doc =
    mockRkaDocuments.find((d) => d.tahun_anggaran === tahun) || mockRkaDocuments[0];

  const version =
    doc.versions?.find((v) => v.nomor_versi === nomorVersi) || doc.versions?.[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [decision, setDecision] = useState<'SETUJU' | 'REVISI'>('SETUJU');
  const [catatan, setCatatan] = useState('');

  // Sample Diffs generated against active data
  const sampleDiffs: DiffItem[] = [
    {
      id: 'diff-1',
      type: 'MODIFIED',
      kegiatan: 'Peningkatan Kompetensi Dosen & Partisipasi Ilmiah',
      kode_pos: '5.2.2.01',
      nama_pos: 'Biaya Perjalanan Dinas Dosen & Narasumber',
      old_nominal: 60000000,
      new_nominal: 75000000,
      keterangan: 'Penambahan volume perjalanan dinas dari 15 menjadi 18 orang',
    },
    {
      id: 'diff-2',
      type: 'ADDED',
      kegiatan: 'Penguatan Akreditasi & Sertifikasi Internasional',
      kode_pos: '5.2.3.01',
      nama_pos: 'Biaya Asesmen Akreditasi Internasional ASIIN',
      new_nominal: 15000000,
      keterangan: 'Alokasi pos baru persiapan borang asesmen',
    },
  ];

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (version) {
      if (decision === 'SETUJU') {
        version.status = 'DISETUJUI';
        version.diterapkan_at = new Date().toISOString();
        doc.status = 'AKTIF';
        doc.total_anggaran = version.total_anggaran;
      } else {
        version.status = 'PERLU_REVISI';
        version.catatan_peninjauan = catatan;
      }
    }
    setModalOpen(false);
    router.push(`/dashboard/rka/${doc.tahun_anggaran}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${doc.tahun_anggaran}`}
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dokumen RKA {doc.tahun_anggaran}</span>
        </Link>
      </div>

      <PageHeader
        title={`RKA ${doc.tahun_anggaran} — Snapshot Versi ${version?.nomor_versi || 1}`}
        description={`Diajukan: ${formatDateShort(version?.created_at)} • Total Pagu Versi: ${formatRupiah(version?.total_anggaran || 0)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={version?.status || 'DRAF'} size="md" />

            {version?.status === 'DIAJUKAN' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDecision('SETUJU');
                    setModalOpen(true);
                  }}
                  className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Setujui & Terapkan Versi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDecision('REVISI');
                    setModalOpen(true);
                  }}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw size={14} />
                  <span>Minta Revisi</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {version?.alasan_revisi && (
        <div className="card space-y-1 bg-blue-50/50 border-blue-200 text-xs">
          <p className="font-bold text-blue-900">Alasan Revisi / Pemutakhiran Anggaran:</p>
          <p className="text-slate-700 leading-relaxed italic">&ldquo;{version.alasan_revisi}&rdquo;</p>
        </div>
      )}

      {/* Diff Perbandingan Versi Terhadap Data Aktif */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Perbandingan Perubahan Terhadap Data Aktif (Diff Viewer)
            </h3>
            <p className="text-xs text-slate-500">
              Analisis penambahan, perubahan nominal, atau penonaktifan pos anggaran pada versi ini
            </p>
          </div>
        </div>

        <DiffViewer diffs={sampleDiffs} />
      </div>

      {/* Modal Keputusan Kaprodi */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={decision === 'SETUJU' ? 'Persetujuan & Penerapan Versi RKA' : 'Permintaan Perbaikan Versi'}
        size="md"
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4 text-xs">
          {decision === 'SETUJU' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed">
              Sesuai aturan SKPL (Bab 11 D3): Menyetujui versi ini akan <strong>menerapkan perubahan ke data aktif secara atomik</strong>. Versi sebelumnya akan otomatis berstatus <strong>DIGANTIKAN</strong> dan monitoring serapan akan beralih menggunakan angka baru ini.
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
              Status versi akan dikembalikan ke <strong>PERLU_REVISI</strong> agar penyusun anggaran dapat memperbaiki rincian pos sebelum diajukan kembali.
            </div>
          )}

          <div>
            <label className="label">Catatan Keputusan Kaprodi</label>
            <textarea
              rows={3}
              required={decision === 'REVISI'}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan arahan atau pertimbangan persetujuan..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button
              type="submit"
              className={
                decision === 'SETUJU'
                  ? 'btn-primary text-xs bg-emerald-600 hover:bg-emerald-700'
                  : 'btn-secondary text-xs text-amber-800 border-amber-300'
              }
            >
              Konfirmasi Keputusan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockPublications } from '@/lib/mock-data';
import type { Publication } from '@/lib/types';
import { ClipboardCheck, Check, ArrowRight, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export default function ReviewSayaPublikasiPage() {
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [rekomendasi, setRekomendasi] = useState<'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN'>('LAYAK_DIAJUKAN');
  const [catatanReview, setCatatanReview] = useState('');

  // Reviews assigned to current user
  const assigned = publications.filter(
    (p) => p.status === 'REVIEW_INTERNAL' || (p.reviews && p.reviews.length > 0)
  );

  const handleOpenReview = (pub: Publication) => {
    setSelectedPub(pub);
    setRekomendasi('LAYAK_DIAJUKAN');
    setCatatanReview('');
    setModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPub) return;

    const updated = publications.map((p) => {
      if (p.id !== selectedPub.id) return p;
      return {
        ...p,
        status: rekomendasi === 'LAYAK_DIAJUKAN' ? ('DIAJUKAN' as const) : ('DRAF' as const),
        reviews: [
          ...(p.reviews || []),
          {
            id: `rev-${Date.now()}`,
            publication_id: p.id,
            reviewer_id: 'u-dosen2',
            ditetapkan_oleh: 'u-kaprodi',
            status: 'SELESAI' as const,
            rekomendasi,
            catatan_review: catatanReview,
            ditugaskan_at: new Date().toISOString(),
            selesai_at: new Date().toISOString(),
          },
        ],
      };
    });

    setPublications(updated);
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'judul',
      header: 'Judul Naskah Publikasi',
      render: (row: Publication) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/publikasi/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-2"
          >
            {row.judul}
          </Link>
          <p className="text-[11px] text-slate-500">
            Target: {row.nama_target} • Peringkat: {row.peringkat.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    {
      key: 'penulis',
      header: 'Penulis Utama',
      render: (row: Publication) => (
        <span className="text-xs font-medium text-slate-700">
          {row.authors[0]?.nama_penulis || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Naskah',
      render: (row: Publication) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Aksi Review',
      className: 'text-right',
      render: (row: Publication) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenReview(row)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <ClipboardCheck size={13} />
            <span>Isi Hasil Review</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan Review Internal Publikasi"
        description="Daftar manuskrip karya ilmiah yang ditugaskan kepada Anda untuk penilaian kelayakan substansi sebelum diajukan ke penerbit."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={assigned as unknown as Record<string, unknown>[]}
          emptyMessage="Tidak ada penugasan review naskah yang aktif saat ini."
        />
      </div>

      {/* Modal Review */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Form Telaah Review Internal" size="md">
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          {selectedPub && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-bold text-slate-800 text-xs">{selectedPub.judul}</p>
              <p className="text-[11px] text-slate-500">
                Target: {selectedPub.nama_target} ({selectedPub.jenis})
              </p>
            </div>
          )}

          <div>
            <label className="label">Rekomendasi Kelayakan</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                  rekomendasi === 'LAYAK_DIAJUKAN'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="rekomendasi"
                  value="LAYAK_DIAJUKAN"
                  checked={rekomendasi === 'LAYAK_DIAJUKAN'}
                  onChange={() => setRekomendasi('LAYAK_DIAJUKAN')}
                  className="hidden"
                />
                <span className="font-semibold text-xs">Layak Diajukan</span>
              </label>

              <label
                className={`p-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                  rekomendasi === 'PERLU_PERBAIKAN'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="rekomendasi"
                  value="PERLU_PERBAIKAN"
                  checked={rekomendasi === 'PERLU_PERBAIKAN'}
                  onChange={() => setRekomendasi('PERLU_PERBAIKAN')}
                  className="hidden"
                />
                <span className="font-semibold text-xs">Perlu Perbaikan</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Catatan Telaah & Masukan Substansi</label>
            <textarea
              rows={4}
              required
              value={catatanReview}
              onChange={(e) => setCatatanReview(e.target.value)}
              placeholder="Berikan masukan terkait kebaruan (novelty), metodologi, kejelasan grafik, dan daftar pustaka..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Selesaikan Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


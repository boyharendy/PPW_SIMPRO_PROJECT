'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockPublications } from '@/lib/mock-data';
import type { Publication } from '@/lib/types';
import { CheckCircle2, XCircle, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifikasiPublikasiPage() {
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [actionType, setActionType] = useState<'VERIFIKASI' | 'TOLAK'>('VERIFIKASI');
  const [modalOpen, setModalOpen] = useState(false);
  const [alasan, setAlasan] = useState('');

  // Items waiting for verification
  const pendingPubs = publications.filter((p) => p.status_verifikasi === 'MENUNGGU');

  const handleOpenAction = (pub: Publication, type: 'VERIFIKASI' | 'TOLAK') => {
    setSelectedPub(pub);
    setActionType(type);
    setAlasan('');
    setModalOpen(true);
  };

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPub) return;

    if (actionType === 'TOLAK' && !alasan.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    const updated = publications.map((p) => {
      if (p.id !== selectedPub.id) return p;
      return {
        ...p,
        status_verifikasi: actionType === 'VERIFIKASI' ? ('TERVERIFIKASI' as const) : ('DITOLAK' as const),
        catatan_verifikasi: alasan || undefined,
        diverifikasi_at: new Date().toISOString(),
      };
    });

    setPublications(updated);
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'judul',
      header: 'Judul & Target Publikasi',
      render: (row: Publication) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/publikasi/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-2"
          >
            {row.judul}
          </Link>
          <p className="text-[11px] text-slate-500">
            Target: <strong>{row.nama_target}</strong> • {row.jenis}
          </p>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Pencatat',
      render: (row: Publication) => {
        const student = row.authors.find((a) => a.tipe_penulis === 'MAHASISWA');
        return (
          <div className="text-xs">
            <p className="font-semibold text-slate-700">{student?.nama_penulis || '-'}</p>
            <p className="text-[10px] text-slate-400">Mahasiswa Aktif</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (row: Publication) => <StatusBadge status={row.status_verifikasi} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Tindakan',
      className: 'text-right',
      render: (row: Publication) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenAction(row, 'VERIFIKASI')}
            className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
          >
            <CheckCircle2 size={13} />
            <span>Verifikasi</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAction(row, 'TOLAK')}
            className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <XCircle size={13} />
            <span>Tolak</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Verifikasi Publikasi Mahasiswa"
        description="Persetujuan pencatatan publikasi karya ilmiah mahasiswa oleh Dosen Pembimbing / Dosen Verifikator."
      />

      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Menunggu Persetujuan ({pendingPubs.length})
            </h3>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={pendingPubs}
          emptyMessage="Tidak ada publikasi mahasiswa yang menunggu verifikasi saat ini."
        />
      </div>

      {/* Modal Verifikasi / Tolak */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={actionType === 'VERIFIKASI' ? 'Verifikasi Publikasi Mahasiswa' : 'Tolak Pencatatan Publikasi'}
        size="md"
      >
        <form onSubmit={handleSubmitAction} className="space-y-4 text-xs">
          {selectedPub && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-bold text-slate-800 text-xs">{selectedPub.judul}</p>
              <p className="text-[11px] text-slate-500">
                Target: {selectedPub.nama_target} ({selectedPub.jenis})
              </p>
            </div>
          )}

          {actionType === 'VERIFIKASI' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed">
              Dengan memverifikasi, data publikasi ini akan resmi masuk ke dalam capaian kinerja dan laporan rekap akreditasi prodi.
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
              Tuliskan alasan penolakan secara jelas agar mahasiswa dapat memperbaiki data naskah atau berkas bukti submit.
            </div>
          )}

          <div>
            <label className="label">
              {actionType === 'VERIFIKASI' ? 'Catatan Verifikasi (Opsional)' : 'Alasan Penolakan (Wajib)'}
            </label>
            <textarea
              rows={3}
              required={actionType === 'TOLAK'}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder={
                actionType === 'VERIFIKASI'
                  ? 'Catatan apresiasi atau tindak lanjut...'
                  : 'Sebutkan alasan penolakan atau kekurangan berkas...'
              }
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button
              type="submit"
              className={actionType === 'VERIFIKASI' ? 'btn-primary text-xs bg-emerald-600 hover:bg-emerald-700' : 'btn-danger text-xs'}
            >
              {actionType === 'VERIFIKASI' ? 'Konfirmasi Verifikasi' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


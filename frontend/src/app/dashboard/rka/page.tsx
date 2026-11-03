'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockRkaDocuments } from '@/lib/mock-data';
import { rkaService } from '@/lib/api/services/rka.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RkaDocument } from '@/lib/types';
import { Plus, Wallet, ArrowRight, Eye, Layers } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, calculateAbsorptionPercentage } from '@/lib/utils';

export default function RkaListPage() {
  const [rkaList, setRkaList] = useState<RkaDocument[]>(mockRkaDocuments);
  const [modalOpen, setModalOpen] = useState(false);
  const [tahunBaru, setTahunBaru] = useState(new Date().getFullYear() + 1);
  const [judulBaru, setJudulBaru] = useState('');

  useEffect(() => {
    // Sinkronisasi data lokal saat mount di client
    const local = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
    if (local && local.length > 0) {
      setRkaList(local);
    }

    let active = true;
    rkaService
      .getRkaList()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setRkaList(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: RkaDocument = {
      id: `rka-${tahunBaru}`,
      tahun_anggaran: tahunBaru,
      judul: judulBaru || `Rencana Kerja dan Anggaran (RKA) Prodi SI Tahun ${tahunBaru}`,
      status: 'DRAF',
      total_anggaran: 0,
      dibuat_oleh: 'u-admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: [
        {
          id: `rka-ver-${tahunBaru}-1`,
          rka_id: `rka-${tahunBaru}`,
          nomor_versi: 1,
          status: 'DRAF',
          total_anggaran: 0,
          row_version: 1,
          dibuat_oleh: 'u-admin',
          created_at: new Date().toISOString(),
        },
      ],
    };

    const updated = storageSync.prepend(STORAGE_KEYS.RKA_DOCUMENTS, newDoc, rkaList);
    setRkaList(updated);
    setModalOpen(false);

    try {
      await rkaService.createRka(newDoc);
    } catch {
      // Offline fallback
    }
  };

  const columns = [
    {
      key: 'tahun',
      header: 'Tahun Anggaran & Dokumen',
      render: (row: RkaDocument) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/rka/${row.tahun_anggaran}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-sm sm:text-base line-clamp-1"
          >
            {row.judul}
          </Link>
          <p className="text-xs text-slate-500">
            Tahun Anggaran: <strong className="text-blue-700">{row.tahun_anggaran}</strong>
          </p>
        </div>
      ),
    },
    {
      key: 'anggaran',
      header: 'Pagu Anggaran',
      render: (row: RkaDocument) => (
        <div className="text-sm space-y-0.5">
          <p className="font-bold text-slate-800">{formatRupiah(row.total_anggaran)}</p>
          <p className="text-xs text-slate-500">
            Realisasi: {formatRupiah(row.total_realisasi || 0)}
          </p>
        </div>
      ),
    },
    {
      key: 'serapan',
      header: 'Serapan Anggaran',
      render: (row: RkaDocument) => {
        const pct = calculateAbsorptionPercentage(row.total_realisasi || 0, row.total_anggaran);
        return (
          <div className="text-sm space-y-1 w-32">
            <div className="flex items-center justify-between font-bold">
              <span className="text-blue-700">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Dokumen',
      render: (row: RkaDocument) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: RkaDocument) => (
        <Link
          href={`/dashboard/rka/${row.tahun_anggaran}`}
          className="btn-secondary text-sm py-1.5 px-3.5 inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-600"
        >
          <Eye size={13} />
          <span>Buka RKA</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rencana Kerja dan Anggaran (RKA) Prodi"
        description="Penyusunan RKA tahunan berversi, pengelolaan kegiatan, dan pemantauan serapan biaya anggaran prodi."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Buat RKA Tahun Anggaran</span>
          </button>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={rkaList}
          emptyMessage="Belum ada dokumen RKA terdaftar."
        />
      </div>

      {/* Modal Buat RKA Baru */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat RKA Tahun Anggaran Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          <div>
            <label className="label">Tahun Anggaran</label>
            <input
              type="number"
              min={2024}
              max={2035}
              required
              value={tahunBaru}
              onChange={(e) => setTahunBaru(Number(e.target.value) || 2026)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="label">Judul Dokumen RKA</label>
            <input
              type="text"
              required
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
              placeholder={`Rencana Kerja dan Anggaran (RKA) Prodi SI Tahun ${tahunBaru}`}
              className="input-field text-sm"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 leading-relaxed">
            Sistem akan secara otomatis menerbitkan dokumen RKA berstatus <strong>DRAF</strong> beserta <strong>Versi Kerja Nomor 1</strong> yang siap diisi dengan daftar kegiatan dan pos anggaran.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">
              Batal
            </button>
            <button type="submit" className="btn-primary text-sm">
              Buat Dokumen RKA
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


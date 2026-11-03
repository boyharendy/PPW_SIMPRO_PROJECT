'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FileUploader from '@/components/ui/FileUploader';
import { mockRkaRealizations, mockRkaDocuments } from '@/lib/mock-data';
import { rkaService } from '@/lib/api/services/rka.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RkaRealization } from '@/lib/types';
import { Plus, Wallet, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function RkaRealisasiPage() {
  const params = useParams();
  const tahun = Number(params.tahun) || 2025;

  const doc =
    mockRkaDocuments.find((d) => d.tahun_anggaran === tahun) || mockRkaDocuments[0];

  const [realizations, setRealizations] = useState<RkaRealization[]>(() =>
    storageSync.get<RkaRealization[]>(STORAGE_KEYS.RKA_REALIZATIONS, mockRkaRealizations)
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [selectedPosId, setSelectedPosId] = useState('pos-101');
  const [tglRealisasi, setTglRealisasi] = useState(new Date().toISOString().split('T')[0]);
  const [nominal, setNominal] = useState(2500000);
  const [uraian, setUraian] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uraian.trim()) {
      alert('Uraian realisasi wajib diisi.');
      return;
    }

    const newReal: RkaRealization = {
      id: `real-${Date.now()}`,
      rka_budget_item_id: selectedPosId,
      tanggal_realisasi: tglRealisasi,
      nominal_realisasi: nominal,
      uraian,
      sumber_pencatatan: 'MANUAL',
      status: 'AKTIF',
      dicatat_oleh: 'u-admin',
      created_at: new Date().toISOString(),
    };

    const updated = storageSync.prepend(STORAGE_KEYS.RKA_REALIZATIONS, newReal, realizations);
    setRealizations(updated);
    setModalOpen(false);
    setUraian('');

    try {
      await rkaService.addRealization({
        rka_budget_item_id: selectedPosId,
        tanggal_realisasi: tglRealisasi,
        nominal_realisasi: nominal,
        uraian,
        sumber_pencatatan: 'MANUAL',
      });
    } catch {
      // Offline fallback
    }
  };

  const columns = [
    {
      key: 'tanggal',
      header: 'Tanggal & Pos Anggaran',
      render: (row: RkaRealization) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-xs sm:text-sm">
            {formatDateShort(row.tanggal_realisasi)}
          </p>
          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            Pos: {row.rka_budget_item_id}
          </span>
        </div>
      ),
    },
    {
      key: 'uraian',
      header: 'Uraian Pengeluaran Riil',
      render: (row: RkaRealization) => (
        <div className="space-y-1 text-xs">
          <p className="text-slate-800 font-medium leading-relaxed">{row.uraian}</p>
          <span className="text-[10px] text-slate-400">
            Sumber: <strong>{row.sumber_pencatatan.replace('_', ' ')}</strong>
          </span>
        </div>
      ),
    },
    {
      key: 'nominal',
      header: 'Nominal Realisasi',
      render: (row: RkaRealization) => (
        <span className="text-xs font-extrabold text-emerald-700">
          {formatRupiah(row.nominal_realisasi)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: RkaRealization) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

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
        title={`Pencatatan Realisasi Biaya RKA ${doc.tahun_anggaran}`}
        description="Rekam jejak realisasi pengeluaran anggaran baik yang dicatat manual maupun otomatis dari perjalanan dinas."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Catat Realisasi Manual</span>
          </button>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={realizations}
          emptyMessage="Belum ada riwayat realisasi anggaran."
        />
      </div>

      {/* Modal Realisasi Manual */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pencatatan Realisasi Anggaran Manual" size="md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="label">Pilih Pos Anggaran Aktif</label>
            <select
              value={selectedPosId}
              onChange={(e) => setSelectedPosId(e.target.value)}
              className="select-field text-xs"
            >
              <option value="pos-101">5.2.2.01 - Biaya Perjalanan Dinas Dosen</option>
              <option value="pos-102">5.2.2.02 - Registrasi Konferensi & Publikasi</option>
              <option value="pos-201">5.2.1.03 - Honorarium Reviewer Internal RPS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Realisasi Pengeluaran</label>
              <input
                type="date"
                required
                value={tglRealisasi}
                onChange={(e) => setTglRealisasi(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="label">Nominal Realisasi (Rp)</label>
              <CurrencyInput value={nominal} onChange={setNominal} className="text-xs" />
            </div>
          </div>

          <div>
            <label className="label">Uraian / Keterangan Pengeluaran Riil</label>
            <textarea
              rows={2}
              required
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Contoh: Pembayaran honorarium narasumber lokakarya kurikulum..."
              className="textarea-field text-xs"
            />
          </div>

          <FileUploader label="Unggah Bukti Kuitansi / Faktur (PDF / JPG)" />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Simpan Realisasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockPublications } from '@/lib/mock-data';
import type { Publication } from '@/lib/types';

export interface VerificationItem {
  id: string;
  judul: string;
  jenis: string;
  mahasiswa: string;
  nim: string;
  tahap: string;
  bukti: string;
  tanggal: string;
  status: 'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK';
  catatan?: string;
  verifikator?: string;
  publication_id?: string;
}

export const MOCK_VERIF: VerificationItem[] = [
  {
    id: 'ver-1',
    publication_id: 'PUB-002',
    judul: 'Rancang Bangun Sistem Informasi Monitoring Magang Berbasis Web',
    jenis: 'PROSIDING',
    mahasiswa: 'Ilham Ramadhan',
    nim: '1201210088',
    tahap: 'DITERIMA',
    bukti: 'LoA_Prosiding_SNIK_2025.pdf',
    tanggal: '2025-10-18',
    status: 'MENUNGGU',
    verifikator: 'Budi Hartono, M.Kom.',
  },
  {
    id: 'ver-2',
    publication_id: 'PUB-003',
    judul: 'Penerapan Algoritma K-Means untuk Segmentasi Pelanggan E-Commerce',
    jenis: 'JURNAL',
    mahasiswa: 'Siti Nur Aini',
    nim: '1201210043',
    tahap: 'DIAJUKAN',
    bukti: 'Bukti_Submit_Jurnal_Techno.pdf',
    tanggal: '2025-10-14',
    status: 'MENUNGGU',
    verifikator: 'Dr. Rina Fitriani, M.Kom.',
  },
  {
    id: 'ver-3',
    publication_id: 'PUB-001',
    judul: 'Analisis Keamanan Jaringan Wireless dengan Metode PPDIOO',
    jenis: 'JURNAL',
    mahasiswa: 'Dodi Alamsyah',
    nim: '1201200012',
    tahap: 'TERBIT',
    bukti: 'DOI: 10.1234/jsi.2025.8812',
    tanggal: '2025-09-02',
    status: 'TERVERIFIKASI',
    catatan: 'Bukti DOI terverifikasi aktif pada repositori jurnal.',
    verifikator: 'Dr. Rina Fitriani, M.Kom.',
  },
];

export default function Page() {
  const [items, setItems] = useState<VerificationItem[]>(() => {
    return storageSync.get<VerificationItem[]>(STORAGE_KEYS.PUBLICATION_VERIFICATIONS, MOCK_VERIF);
  });
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [decision, setDecision] = useState<'TERVERIFIKASI' | 'DITOLAK'>('TERVERIFIKASI');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    const handleSync = () => {
      setItems(storageSync.get<VerificationItem[]>(STORAGE_KEYS.PUBLICATION_VERIFICATIONS, MOCK_VERIF));
    };
    window.addEventListener('simpro_storage_change', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('simpro_storage_change', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const handleDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const updated = storageSync.update<VerificationItem>(
      STORAGE_KEYS.PUBLICATION_VERIFICATIONS,
      selectedItem.id,
      { status: decision, catatan: catatan.trim() || undefined },
      MOCK_VERIF
    );
    setItems(updated);

    // Sync to STORAGE_KEYS.PUBLICATIONS
    const targetPubId = selectedItem.publication_id || selectedItem.id;
    const currentPubs = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    const existingPub = currentPubs.find(
      (p) => p.id === targetPubId || p.judul.trim().toLowerCase() === selectedItem.judul.trim().toLowerCase()
    );
    if (existingPub) {
      storageSync.update<Publication>(
        STORAGE_KEYS.PUBLICATIONS,
        existingPub.id,
        {
          status_verifikasi: decision,
          status:
            decision === 'TERVERIFIKASI'
              ? existingPub.status === 'DRAF'
                ? 'DIAJUKAN'
                : existingPub.status
              : 'DRAF',
          verifikator_nama: selectedItem.verifikator || existingPub.verifikator_nama,
        },
        mockPublications
      );
    }

    setSelectedItem(null);
  };

  const columns: DataTableColumn<VerificationItem>[] = [
    {
      key: 'judul',
      header: 'Judul Publikasi & Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{r.judul}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Oleh: {r.mahasiswa} ({r.nim}) • <span className="font-semibold text-emerald-600">{r.jenis}</span>
            {r.verifikator && <span className="text-slate-400"> • Verifikator: {r.verifikator}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'tahap',
      header: 'Tahapan & Bukti',
      render: (r) => (
        <div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {r.tahap}
          </span>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{r.bukti}</div>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal Pengajuan',
      render: (r) => <span className="text-xs text-slate-500">{formatDateShort(r.tanggal)}</span>,
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => {
            setSelectedItem(r);
            setDecision('TERVERIFIKASI');
            setCatatan(r.catatan || '');
          }}
          className={
            r.status === 'MENUNGGU'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-sm'
              : 'btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5 cursor-pointer'
          }
        >
          {r.status === 'MENUNGGU' ? (
            <>
              <CheckCircle2 size={12} /> Periksa
            </>
          ) : (
            <>
              <Eye size={13} /> Detail
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Publikasi Mahasiswa"
        description="Validasi keabsahan bukti publikasi karya mahasiswa oleh Dosen Verifikator."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={items}
          emptyMessage="Tidak ada publikasi mahasiswa yang memerlukan verifikasi."
        />
      </div>

      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Verifikasi Dokumen Publikasi Mahasiswa"
        size="md"
      >
        {selectedItem && (
          <form onSubmit={handleDecision} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>Judul:</strong> {selectedItem.judul}</div>
              <div><strong>Mahasiswa:</strong> {selectedItem.mahasiswa} ({selectedItem.nim})</div>
              {selectedItem.verifikator && <div><strong>Dosen Verifikator:</strong> {selectedItem.verifikator}</div>}
              <div><strong>Tahap Saat Ini:</strong> {selectedItem.tahap}</div>
              <div><strong>Bukti Lampiran:</strong> {selectedItem.bukti}</div>
            </div>

            {selectedItem.status !== 'MENUNGGU' ? (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Status Keputusan:</span>
                <StatusBadge status={selectedItem.status} size="md" />
                {selectedItem.catatan && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    {selectedItem.catatan}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Keputusan Verifikasi
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 flex-1 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'TERVERIFIKASI'}
                        onChange={() => setDecision('TERVERIFIKASI')}
                      />
                      <span className="text-xs font-semibold text-emerald-700">Verifikasi (Setujui)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 flex-1 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'DITOLAK'}
                        onChange={() => setDecision('DITOLAK')}
                      />
                      <span className="text-xs font-semibold text-rose-700">Tolak (Perlu Revisi)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Catatan Verifikator (Wajib jika ditolak)
                  </label>
                  <textarea
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Masukkan alasan atau catatan keabsahan bukti..."
                    className="input-field resize-none text-xs"
                    required={decision === 'DITOLAK'}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Tutup
              </button>
              {selectedItem.status === 'MENUNGGU' && (
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold px-4 py-2 transition-colors cursor-pointer shadow-sm"
                >
                  Simpan Keputusan
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Check, X, FileText, CheckCircle2, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

interface VerificationItem {
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
}

const MOCK_VERIF: VerificationItem[] = [
  {
    id: 'ver-1',
    judul: 'Rancang Bangun Sistem Informasi Monitoring Magang Berbasis Web',
    jenis: 'PROSIDING',
    mahasiswa: 'Ilham Ramadhan',
    nim: '1201210088',
    tahap: 'DITERIMA',
    bukti: 'LoA_Prosiding_SNIK_2025.pdf',
    tanggal: '2025-10-18',
    status: 'MENUNGGU',
  },
  {
    id: 'ver-2',
    judul: 'Penerapan Algoritma K-Means untuk Segmentasi Pelanggan E-Commerce',
    jenis: 'JURNAL',
    mahasiswa: 'Siti Nur Aini',
    nim: '1201210043',
    tahap: 'DIAJUKAN',
    bukti: 'Bukti_Submit_Jurnal_Techno.pdf',
    tanggal: '2025-10-14',
    status: 'MENUNGGU',
  },
  {
    id: 'ver-3',
    judul: 'Analisis Keamanan Jaringan Wireless dengan Metode PPDIOO',
    jenis: 'JURNAL',
    mahasiswa: 'Dodi Alamsyah',
    nim: '1201200012',
    tahap: 'TERBIT',
    bukti: 'DOI: 10.1234/jsi.2025.8812',
    tanggal: '2025-09-02',
    status: 'TERVERIFIKASI',
    catatan: 'Bukti DOI terverifikasi aktif pada repositori jurnal.',
  },
];

export default function Page() {
  const [items, setItems] = useState<VerificationItem[]>(MOCK_VERIF);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [decision, setDecision] = useState<'TERVERIFIKASI' | 'DITOLAK'>('TERVERIFIKASI');
  const [catatan, setCatatan] = useState('');

  const handleDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setItems(
      items.map((it) =>
        it.id === selectedItem.id
          ? { ...it, status: decision, catatan: catatan.trim() || undefined }
          : it
      )
    );
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
            Oleh: {r.mahasiswa} ({r.nim}) • <span className="font-semibold text-blue-600">{r.jenis}</span>
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
              ? 'btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1'
              : 'btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5'
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
        description="Validasi keabsahan bukti publikasi karya mahasiswa oleh Dosen Verifikator (FR-32)."
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
                className="btn-secondary text-xs px-4 py-2"
              >
                Tutup
              </button>
              {selectedItem.status === 'MENUNGGU' && (
                <button type="submit" className="btn-primary text-xs px-4 py-2">
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

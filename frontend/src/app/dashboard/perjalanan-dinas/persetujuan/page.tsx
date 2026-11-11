'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Check, X, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatRupiah, formatDateShort } from '@/lib/utils';

interface PendingTrip {
  id: string;
  tujuan: string;
  maksud: string;
  pelaksana: string;
  tglBerangkat: string;
  tglKembali: string;
  estimasi: number;
  sumberDana: string;
  peringatan?: string;
  status: 'DIAJUKAN' | 'DISETUJUI' | 'PERLU_REVISI' | 'DITOLAK';
}

const MOCK_PENDING: PendingTrip[] = [
  {
    id: 'PD-101',
    tujuan: 'Yogyakarta',
    maksud: 'Workshop Kurikulum Berbasis Outcome Based Education (OBE) di UGM',
    pelaksana: 'Dr. Andi Wijaya, M.Kom.',
    tglBerangkat: '2025-11-12',
    tglKembali: '2025-11-14',
    estimasi: 4200000,
    sumberDana: 'RKA_PRODI',
    status: 'DIAJUKAN',
  },
  {
    id: 'PD-102',
    tujuan: 'Bandung',
    maksud: 'Penandatanganan PKS Magang Industri PT Pos Finansial Indonesia',
    pelaksana: 'Siti Aminah, M.T.',
    tglBerangkat: '2025-11-08',
    tglKembali: '2025-11-09',
    estimasi: 2850000,
    sumberDana: 'RKA_PRODI',
    peringatan: 'Pengajuan mendadak (< 3 hari kerja sebelum berangkat)',
    status: 'DIAJUKAN',
  },
  {
    id: 'PD-103',
    tujuan: 'Jakarta',
    maksud: 'Rapat Koordinasi Asosiasi Pendidikan Tinggi Informatika (APTIKOM)',
    pelaksana: 'Dr. Ahmad Fauzi (Kaprodi)',
    tglBerangkat: '2025-11-25',
    tglKembali: '2025-11-27',
    estimasi: 5100000,
    sumberDana: 'FAKULTAS',
    status: 'DIAJUKAN',
  },
];

export default function Page() {
  const [trips, setTrips] = useState<PendingTrip[]>(MOCK_PENDING);
  const [selectedTrip, setSelectedTrip] = useState<PendingTrip | null>(null);
  const [noSuratTugas, setNoSuratTugas] = useState('');
  const [catatan, setCatatan] = useState('');

  const handleDecision = (decision: 'DISETUJUI' | 'PERLU_REVISI' | 'DITOLAK') => {
    if (!selectedTrip) return;
    if (decision === 'DISETUJUI' && !noSuratTugas.trim()) {
      alert('Nomor surat tugas wajib diisi sebelum menyetujui perjalanan dinas.');
      return;
    }

    setTrips(
      trips.map((t) =>
        t.id === selectedTrip.id ? { ...t, status: decision } : t
      )
    );
    setSelectedTrip(null);
  };

  const columns: DataTableColumn<PendingTrip>[] = [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.tujuan}</div>
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.maksud}</div>
          {r.peringatan && (
            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
              <AlertTriangle size={11} /> {r.peringatan}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'pelaksana',
      header: 'Pelaksana Usulan',
      render: (r) => <span className="text-sm font-medium text-slate-800">{r.pelaksana}</span>,
    },
    {
      key: 'tgl',
      header: 'Jadwal',
      render: (r) => (
        <span className="text-xs text-slate-600">
          {formatDateShort(r.tglBerangkat)} - {formatDateShort(r.tglKembali)}
        </span>
      ),
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {formatRupiah(r.estimasi)}
          </span>
          <div className="text-[10px] text-slate-400">{r.sumberDana.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => {
            setSelectedTrip(r);
            setNoSuratTugas(`ST/09${r.id.replace('PD-', '')}/UN-SI/XI/2025`);
            setCatatan('');
          }}
          className={
            r.status === 'DIAJUKAN'
              ? 'btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1'
              : 'btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5'
          }
        >
          {r.status === 'DIAJUKAN' ? (
            <>
              <CheckCircle2 size={12} /> Persetujuan
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
        title="Persetujuan Perjalanan Dinas"
        description="Verifikasi dan persetujuan usulan perjalanan dinas oleh Kaprodi / Pimpinan (FR-36)."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={trips}
          emptyMessage="Tidak ada usulan perjalanan dinas yang menunggu persetujuan."
        />
      </div>

      <Modal
        open={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        title="Persetujuan Usulan Perjalanan Dinas"
        size="md"
      >
        {selectedTrip && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>Tujuan:</strong> {selectedTrip.tujuan}</div>
              <div><strong>Pelaksana:</strong> {selectedTrip.pelaksana}</div>
              <div><strong>Jadwal:</strong> {formatDateShort(selectedTrip.tglBerangkat)} s.d. {formatDateShort(selectedTrip.tglKembali)}</div>
              <div><strong>Estimasi Biaya:</strong> {formatRupiah(selectedTrip.estimasi)} ({selectedTrip.sumberDana})</div>
            </div>

            {selectedTrip.peringatan && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan Kebijakan:</strong> {selectedTrip.peringatan}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor Surat Tugas (Wajib diisi sebelum menyetujui)
              </label>
              <input
                type="text"
                value={noSuratTugas}
                onChange={(e) => setNoSuratTugas(e.target.value)}
                placeholder="Contoh: ST/088/UN-SI/XI/2025"
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Persetujuan / Alasan Revisi
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Opsional untuk persetujuan, wajib jika meminta revisi..."
                className="input-field resize-none text-xs"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Tutup
              </button>

              {selectedTrip.status === 'DIAJUKAN' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision('PERLU_REVISI')}
                    className="btn-secondary text-xs px-3 py-1.5 text-amber-700 hover:bg-amber-50"
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('DISETUJUI')}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    Setujui Usulan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockBusinessTrips } from '@/lib/mock-data';
import { tripService } from '@/lib/api/services/trip.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { BusinessTrip } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, FileEdit, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort, formatRupiah } from '@/lib/utils';

export default function PersetujuanPerjalananPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>(() =>
    storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips)
  );
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null);
  const [decisionType, setDecisionType] = useState<'SETUJU' | 'REVISI' | 'TOLAK'>('SETUJU');
  const [nomorST, setNomorST] = useState('');
  const [catatan, setCatatan] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    tripService
      .getTrips()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setTrips(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const pendingTrips = trips.filter((t) => t.status === 'DIAJUKAN');

  const handleOpenDecision = (trip: BusinessTrip, decision: 'SETUJU' | 'REVISI' | 'TOLAK') => {
    setSelectedTrip(trip);
    setDecisionType(decision);
    setNomorST(trip.nomor_surat_tugas || `ST/10${Math.floor(Math.random() * 90)}/UNIV-SI/XI/2025`);
    setCatatan('');
    setModalOpen(true);
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    if (decisionType === 'SETUJU' && !nomorST.trim()) {
      alert('Nomor surat tugas wajib diisi sebelum menyetujui perjalanan dinas.');
      return;
    }

    const updated = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;
      let nextStatus = t.status;
      if (decisionType === 'SETUJU') nextStatus = 'DISETUJUI';
      if (decisionType === 'REVISI') nextStatus = 'PERLU_REVISI';
      if (decisionType === 'TOLAK') nextStatus = 'DITOLAK';

      return {
        ...t,
        status: nextStatus,
        nomor_surat_tugas: decisionType === 'SETUJU' ? nomorST : t.nomor_surat_tugas,
        catatan_keputusan: catatan,
        disetujui_at: decisionType === 'SETUJU' ? new Date().toISOString() : undefined,
      };
    });

    setTrips(updated);
    storageSync.set(STORAGE_KEYS.TRIPS, updated);
    setModalOpen(false);

    try {
      if (decisionType === 'SETUJU') {
        await tripService.approveTrip(selectedTrip.id, { nomor_surat_tugas: nomorST, catatan });
      } else if (decisionType === 'TOLAK') {
        await tripService.rejectTrip(selectedTrip.id, catatan);
      }
    } catch {
      // Offline fallback
    }
  };

  const columns = [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud Kegiatan',
      render: (row: BusinessTrip) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/perjalanan-dinas/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-1"
          >
            {row.tujuan}
          </Link>
          <p className="text-[11px] text-slate-500 line-clamp-2">{row.maksud_kegiatan}</p>
        </div>
      ),
    },
    {
      key: 'pelaksana',
      header: 'Pelaksana & Tanggal',
      render: (row: BusinessTrip) => (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-700">{row.pengaju?.nama_lengkap}</p>
          <p className="text-[11px] text-slate-400">
            {formatDateShort(row.tanggal_berangkat)} – {formatDateShort(row.tanggal_kembali)}
          </p>
        </div>
      ),
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (row: BusinessTrip) => {
        const total = row.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-slate-800">{formatRupiah(total)}</p>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
              {row.sumber_dana.replace('_', ' ')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Keputusan Kaprodi',
      className: 'text-right',
      render: (row: BusinessTrip) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenDecision(row, 'SETUJU')}
            className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
          >
            <CheckCircle2 size={13} />
            <span>Setujui</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenDecision(row, 'REVISI')}
            className="btn-secondary text-xs py-1.5 px-2.5 text-amber-700 border-amber-200 hover:bg-amber-50"
          >
            <FileEdit size={13} />
            <span>Revisi</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenDecision(row, 'TOLAK')}
            className="btn-danger text-xs py-1.5 px-2.5"
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
        title="Antrean Persetujuan Perjalanan Dinas"
        description="Pemeriksaan estimasi biaya dan persetujuan penerbitan surat tugas resmi perjalanan dinas dosen oleh Kaprodi."
      />

      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Pengajuan Masuk ({pendingTrips.length})
            </h3>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={pendingTrips}
          emptyMessage="Tidak ada pengajuan perjalanan dinas yang menunggu persetujuan."
        />
      </div>

      {/* Modal Keputusan */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          decisionType === 'SETUJU'
            ? 'Setujui Pengajuan Perjalanan Dinas'
            : decisionType === 'REVISI'
            ? 'Minta Revisi Pengajuan Perjalanan'
            : 'Tolak Pengajuan Perjalanan Dinas'
        }
        size="md"
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4 text-xs">
          {selectedTrip && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-bold text-slate-800 text-xs">
                Tujuan: {selectedTrip.tujuan} ({selectedTrip.pengaju?.nama_lengkap})
              </p>
              <p className="text-[11px] text-slate-500">
                Estimasi: {formatRupiah(selectedTrip.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0))} • Sumber: {selectedTrip.sumber_dana}
              </p>
            </div>
          )}

          {decisionType === 'SETUJU' && (
            <div>
              <label className="label">Nomor Surat Tugas Resmi (Wajib)</label>
              <input
                type="text"
                required
                value={nomorST}
                onChange={(e) => setNomorST(e.target.value)}
                placeholder="Contoh: ST/085/UNIV-SI/XI/2025"
                className="input-field text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nomor surat tugas ini akan menjadi dasar resmi bagi dosen untuk melaksanakan perjalanan dinas.
              </p>
            </div>
          )}

          <div>
            <label className="label">
              {decisionType === 'SETUJU'
                ? 'Catatan Persetujuan (Opsional)'
                : 'Catatan Arahan Perbaikan / Alasan Penolakan (Wajib)'}
            </label>
            <textarea
              rows={3}
              required={decisionType !== 'SETUJU'}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan arahan atau pertimbangan kaprodi..."
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
                decisionType === 'SETUJU'
                  ? 'btn-primary text-xs bg-emerald-600 hover:bg-emerald-700'
                  : decisionType === 'REVISI'
                  ? 'btn-secondary text-xs text-amber-700 border-amber-300'
                  : 'btn-danger text-xs'
              }
            >
              Simpan Keputusan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


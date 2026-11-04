'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { mockBusinessTrips } from '@/lib/mock-data';
import type { BusinessTrip } from '@/lib/types';
import {
  Plane,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort, formatRupiah } from '@/lib/utils';

export default function RekapPerjalananPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [modalActionOpen, setModalActionOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null);
  const [actionType, setActionType] = useState<'SELESAI' | 'KEMBALIKAN'>('SELESAI');
  const [catatanAdmin, setCatatanAdmin] = useState('');

  const totalBiayaEstimasi = trips.reduce(
    (acc, t) => acc + t.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0),
    0
  );
  const totalBiayaRealisasi = trips.reduce(
    (acc, t) => acc + t.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0),
    0
  );

  const handleOpenAction = (trip: BusinessTrip, type: 'SELESAI' | 'KEMBALIKAN') => {
    setSelectedTrip(trip);
    setActionType(type);
    setCatatanAdmin(
      type === 'SELESAI'
        ? 'Seluruh berkas tiket, penginapan, kuitansi riil, dan foto kegiatan telah diverifikasi lengkap dan valid.'
        : 'Mohon lengkapi kuitansi transportasi lokal dan foto dokumentasi kegiatan di lokasi.'
    );
    setModalActionOpen(true);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const updated = trips.map((t) => {
      if (t.id !== selectedTrip.id) return t;
      return {
        ...t,
        status: actionType === 'SELESAI' ? ('SELESAI' as const) : ('DISETUJUI' as const),
        catatan_kelengkapan: catatanAdmin,
        dikonfirmasi_at: actionType === 'SELESAI' ? new Date().toISOString() : undefined,
        dikonfirmasi_oleh: 'u-admin',
      };
    });

    setTrips(updated);
    setModalActionOpen(false);
  };

  const columns = [
    {
      key: 'tujuan',
      header: 'Tujuan & Pelaksana',
      render: (row: BusinessTrip) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/perjalanan-dinas/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-1"
          >
            {row.tujuan}
          </Link>
          <p className="text-[11px] text-slate-500">
            Pelaksana: <strong className="text-slate-700">{row.pengaju?.nama_lengkap}</strong>
          </p>
          <p className="text-[10px] text-slate-400">
            {formatDateShort(row.tanggal_berangkat)} – {formatDateShort(row.tanggal_kembali)}
          </p>
        </div>
      ),
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (row: BusinessTrip) => {
        const est = row.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
        return <span className="font-semibold text-xs text-slate-700">{formatRupiah(est)}</span>;
      },
    },
    {
      key: 'realisasi',
      header: 'Realisasi Riil',
      render: (row: BusinessTrip) => {
        const real = row.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0);
        const est = row.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
        const isOver = real > est * 1.1;

        return (
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-800">
              {real > 0 ? formatRupiah(real) : '-'}
            </span>
            {isOver && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded block w-fit">
                Melebihi Estimasi (&gt;10%)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Kelengkapan',
      render: (row: BusinessTrip) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.status === 'DILAPORKAN' && (
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <AlertTriangle size={11} /> Menunggu Verifikasi Admin
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi Admin Prodi',
      className: 'text-right',
      render: (row: BusinessTrip) => {
        if (row.status === 'DILAPORKAN') {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenAction(row, 'SELESAI')}
                className="btn-primary text-xs py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                title="Tandai Selesai & Buat Realisasi RKA"
              >
                <CheckCircle2 size={13} />
                <span>Tandai Selesai</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAction(row, 'KEMBALIKAN')}
                className="btn-secondary text-xs py-1.5 px-2.5 text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                title="Kembalikan untuk Dilengkapi"
              >
                <RotateCcw size={12} />
                <span>Kembalikan</span>
              </button>
            </div>
          );
        }

        return (
          <Link
            href={`/dashboard/perjalanan-dinas/${row.id}`}
            className="btn-secondary text-xs py-1.5 px-2.5 text-slate-600 hover:text-blue-600 font-semibold inline-flex items-center gap-1"
          >
            <Eye size={12} />
            <span>Lihat</span>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Perjalanan Dinas & Realisasi Biaya"
        description="Perbandingan estimasi vs realisasi riil biaya, pemeriksaan pemisahan tugas, serta penanda kelengkapan bukti SPJ."
        action={<ExportMenu title="Ekspor Rekap Perjalanan" />}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Perjalanan Dinas"
          value={`${trips.length} Kegiatan`}
          subtitle="Tercatat dalam sistem"
          icon={<Plane size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Estimasi Diajukan"
          value={formatRupiah(totalBiayaEstimasi)}
          subtitle="Seluruh alokasi komponen"
          icon={<AlertCircle size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Total Realisasi Riil"
          value={formatRupiah(totalBiayaRealisasi)}
          subtitle="Bukti SPJ terverifikasi"
          icon={<CheckCircle2 size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Perjalanan Selesai SPJ"
          value={`${trips.filter((t) => t.status === 'SELESAI').length} Selesai`}
          subtitle="Otomatis masuk realisasi RKA"
          icon={<FileCheck size={20} />}
          color="blue"
        />
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={trips}
          emptyMessage="Belum ada riwayat perjalanan dinas."
        />
      </div>

      {/* Modal Pemeriksaan Admin */}
      <Modal
        open={modalActionOpen}
        onClose={() => setModalActionOpen(false)}
        title={
          actionType === 'SELESAI'
            ? 'Verifikasi Lengkap & Tandai Selesai'
            : 'Kembalikan Laporan untuk Dilengkapi'
        }
        size="md"
      >
        <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
          {actionType === 'SELESAI' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs leading-relaxed">
              Sesuai aturan SKPL (D2 & D3): Penandaan status <strong>SELESAI</strong> oleh Admin Prodi akan <strong>secara otomatis membuat 1 catatan realisasi pada pos anggaran RKA terkait</strong> secara idempoten.
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
              Status perjalanan akan dikembalikan ke <strong>DISETUJUI</strong> dan pelaksana akan menerima notifikasi untuk melengkapi berkas bukti atau foto kegiatan yang kurang.
            </div>
          )}

          <div>
            <label className="label">
              {actionType === 'SELESAI' ? 'Catatan Pemeriksaan Kelengkapan (SPJ)' : 'Catatan Kekurangan Berkas (Wajib)'}
            </label>
            <textarea
              rows={3}
              required
              value={catatanAdmin}
              onChange={(e) => setCatatanAdmin(e.target.value)}
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalActionOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button
              type="submit"
              className={
                actionType === 'SELESAI'
                  ? 'btn-primary text-xs bg-emerald-600 hover:bg-emerald-700'
                  : 'btn-secondary text-xs text-amber-800 border-amber-300'
              }
            >
              {actionType === 'SELESAI' ? 'Konfirmasi Selesai & Catat Realisasi' : 'Kirim Catatan ke Pelaksana'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


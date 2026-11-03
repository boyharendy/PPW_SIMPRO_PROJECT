'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { mockBusinessTrips, mockProfiles } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { BusinessTrip } from '@/lib/types';
import {
  Plane,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  AlertTriangle,
  Eye,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort, formatRupiah } from '@/lib/utils';

export default function RekapPerjalananPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('ALL');
  const [modalActionOpen, setModalActionOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<BusinessTrip | null>(null);
  const [actionType, setActionType] = useState<'SELESAI' | 'KEMBALIKAN'>('SELESAI');
  const [catatanAdmin, setCatatanAdmin] = useState('');

  useEffect(() => {
    const localTrips = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    if (localTrips && localTrips.length > 0) {
      setTrips(localTrips);
    }
  }, []);

  const lecturers = mockProfiles.filter((p) => p.tipe_pengguna === 'DOSEN');

  const filteredTrips =
    selectedParticipant === 'ALL'
      ? trips
      : trips.filter(
          (t) =>
            t.diajukan_oleh === selectedParticipant ||
            t.participants?.some((p) => p.user_id === selectedParticipant)
        );

  const totalBiayaEstimasi = filteredTrips.reduce(
    (acc, t) => acc + t.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0),
    0
  );
  const totalBiayaRealisasi = filteredTrips.reduce(
    (acc, t) => acc + t.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0),
    0
  );

  // Per-component comparison (SKPL FR-35)
  const componentKeys = ['TRANSPORTASI', 'AKOMODASI', 'UANG_HARIAN', 'LAINNYA'] as const;
  const componentLabels: Record<string, string> = {
    TRANSPORTASI: 'Transportasi (Tiket & Lokal)',
    AKOMODASI: 'Akomodasi / Penginapan',
    UANG_HARIAN: 'Uang Harian (Per Diem)',
    LAINNYA: 'Komponen Lainnya',
  };

  const componentRecap = componentKeys.map((key) => {
    let est = 0;
    let real = 0;
    filteredTrips.forEach((t) => {
      t.costs.forEach((c) => {
        if (c.komponen === key) {
          est += c.estimasi_biaya || 0;
          real += c.realisasi_biaya || 0;
        }
      });
    });
    return {
      komponen: key,
      label: componentLabels[key],
      estimasi: est,
      realisasi: real,
      selisih: est - real,
    };
  });

  // Incomplete reports / past post-return deadline (FR-34 & FR-35)
  const incompleteReportTrips = filteredTrips.filter(
    (t) => t.status === 'DISETUJUI' || t.status === 'DILAPORKAN'
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
    storageSync.set(STORAGE_KEYS.TRIPS, updated);
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
            {row.nomor_surat_tugas && (
              <span className="ml-2 font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {row.nomor_surat_tugas}
              </span>
            )}
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
      header: 'Status & Batas Laporan',
      render: (row: BusinessTrip) => {
        const returnDate = new Date(row.tanggal_kembali);
        const deadlineDate = new Date(returnDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const deadlineStr = row.batas_laporan || deadlineDate.toISOString().split('T')[0];
        const hasProofs = Boolean(row.laporan_hasil);

        return (
          <div className="space-y-1">
            <StatusBadge status={row.status} size="sm" />
            {row.status === 'DILAPORKAN' && (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle size={11} /> Menunggu Verifikasi Admin
              </span>
            )}
            {row.status === 'DISETUJUI' && !hasProofs && (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                <Clock size={11} /> Belum Lapor (Batas: {formatDateShort(deadlineStr)})
              </span>
            )}
          </div>
        );
      },
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
        description="Perbandingan estimasi vs realisasi biaya per komponen, filter per peserta, serta penanda kelengkapan laporan & batas waktu pasca-kepulangan."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="select-field text-xs py-2 w-48"
            >
              <option value="ALL">Semua Peserta (Dosen)</option>
              {lecturers.map((lec) => (
                <option key={lec.id} value={lec.id}>
                  {lec.nama_lengkap}
                </option>
              ))}
            </select>
            <ExportMenu title="Ekspor Rekap Perjalanan" filename="rekap-perjalanan-dinas" />
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Perjalanan Dinas"
          value={`${filteredTrips.length} Kegiatan`}
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
          title="Belum Lengkap Laporan"
          value={`${incompleteReportTrips.length} Perjalanan`}
          subtitle={`${filteredTrips.filter((t) => t.status === 'SELESAI').length} Selesai SPJ`}
          icon={<FileCheck size={20} />}
          color="blue"
        />
      </div>

      {/* Perbandingan Estimasi vs Realisasi per Komponen Biaya (SKPL FR-35) */}
      <div className="card space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Perbandingan Estimasi vs Realisasi Biaya per Komponen (FR-35)
            </h3>
            <p className="text-xs text-slate-500">
              Ringkasan penggunaan anggaran perjalanan dinas berdasarkan 4 komponen biaya utama
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left">Komponen Biaya</th>
                <th className="px-3 py-2.5 text-right">Total Estimasi</th>
                <th className="px-3 py-2.5 text-right">Total Realisasi Riil</th>
                <th className="px-3 py-2.5 text-right">Selisih (Efisiensi / Defisit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {componentRecap.map((comp) => (
                <tr key={comp.komponen} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{comp.label}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {formatRupiah(comp.estimasi)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-blue-700">
                    {formatRupiah(comp.realisasi)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${
                      comp.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {comp.selisih >= 0
                      ? `+${formatRupiah(comp.selisih)} (Hemat)`
                      : formatRupiah(comp.selisih)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daftar Perjalanan Dinas */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredTrips}
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
              Sesuai aturan SKPL: Penandaan status <strong>SELESAI</strong> oleh Admin Prodi akan{' '}
              <strong>
                secara otomatis mencatat realisasi pada pos anggaran RKA terkait
              </strong>{' '}
              secara idempoten.
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
              Status perjalanan akan dikembalikan ke <strong>DISETUJUI</strong> dan pelaksana akan
              menerima notifikasi untuk melengkapi berkas bukti atau foto kegiatan yang kurang.
            </div>
          )}

          <div>
            <label className="label">
              {actionType === 'SELESAI'
                ? 'Catatan Pemeriksaan Kelengkapan (SPJ)'
                : 'Catatan Kekurangan Berkas (Wajib)'}
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
            <button
              type="button"
              onClick={() => setModalActionOpen(false)}
              className="btn-secondary text-xs"
            >
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
              {actionType === 'SELESAI'
                ? 'Konfirmasi Selesai & Catat Realisasi'
                : 'Kirim Catatan ke Pelaksana'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

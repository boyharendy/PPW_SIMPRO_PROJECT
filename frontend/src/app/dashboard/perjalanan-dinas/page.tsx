'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockBusinessTrips } from '@/lib/mock-data';
import type { BusinessTrip } from '@/lib/types';
import { Plus, Plane, Search, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort, formatRupiah } from '@/lib/utils';

export default function PerjalananDinasListPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filtered = trips.filter((t) => {
    const matchSearch =
      t.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maksud_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pengaju?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchSearch && matchStatus;
  });

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
          {row.nomor_surat_tugas && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              ST: {row.nomor_surat_tugas}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'pelaksana',
      header: 'Pelaksana & Jadwal',
      render: (row: BusinessTrip) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-slate-700">{row.pengaju?.nama_lengkap}</p>
          <p className="text-[11px] text-slate-400">
            {formatDateShort(row.tanggal_berangkat)} – {formatDateShort(row.tanggal_kembali)}
          </p>
        </div>
      ),
    },
    {
      key: 'biaya',
      header: 'Estimasi Biaya',
      render: (row: BusinessTrip) => {
        const totalEstimasi = row.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
        const totalRealisasi = row.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0);
        return (
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-slate-800">{formatRupiah(totalEstimasi)}</p>
            {totalRealisasi > 0 && (
              <p className="text-[10px] text-emerald-600 font-medium">
                Realisasi: {formatRupiah(totalRealisasi)}
              </p>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
              {row.sumber_dana.replace('_', ' ')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BusinessTrip) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.status === 'DISETUJUI' && (
            <Link
              href={`/dashboard/perjalanan-dinas/${row.id}/laporan`}
              className="text-[10px] font-semibold text-blue-600 hover:underline block"
            >
              + Unggah Laporan
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: BusinessTrip) => (
        <Link
          href={`/dashboard/perjalanan-dinas/${row.id}`}
          className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold"
        >
          <Eye size={13} />
          <span>Detail</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Perjalanan Dinas Dosen"
        description="Pengajuan izin tugas, persetujuan perjalanan dinas, pelaporan hasil dan bukti riil pengeluaran."
        action={
          <Link
            href="/dashboard/perjalanan-dinas/baru"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Ajukan Perjalanan Baru</span>
          </Link>
        }
      />

      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tujuan atau nama dosen..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select-field text-xs py-1.5 w-40"
          >
            <option value="ALL">Semua Status</option>
            <option value="DIAJUKAN">Diajukan</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DILAPORKAN">Dilaporkan</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          emptyMessage="Tidak ada data perjalanan dinas yang cocok."
        />
      </div>
    </div>
  );
}


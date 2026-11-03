'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockRpsSubmissions, mockCourses } from '@/lib/mock-data';
import { rpsService } from '@/lib/api/services/rps.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RpsSubmission } from '@/lib/types';
import { Plus, BookCheck, Eye, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RpsListPage() {
  const [submissions, setSubmissions] = useState<RpsSubmission[]>(mockRpsSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    // Sinkronisasi data lokal saat mount di client
    const local = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
    if (local && local.length > 0) {
      setSubmissions(local);
    }

    let active = true;
    rpsService
      .getSubmissions()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setSubmissions(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = submissions.filter((s) => {
    const matchSearch =
      s.course?.nama_mk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.kode_mk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'mata_kuliah',
      header: 'Mata Kuliah & Kode',
      render: (row: RpsSubmission) => (
        <div className="space-y-0.5">
          <Link
            href={`/dashboard/rps/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-1"
          >
            {row.course?.nama_mk}
          </Link>
          <p className="text-[11px] text-slate-400">
            <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold mr-2">
              {row.course?.kode_mk}
            </span>
            Bobot: {row.course?.sks} SKS
          </p>
        </div>
      ),
    },
    {
      key: 'versi',
      header: 'Versi Terkini',
      render: (row: RpsSubmission) => (
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          Versi {row.versi_terbaru}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Pengajuan',
      render: (row: RpsSubmission) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.status === 'DISAHKAN' && (
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={11} /> Sah Berlaku
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: RpsSubmission) => (
        <Link
          href={`/dashboard/rps/${row.id}`}
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
        title="Pengajuan & Telaah Dokumen RPS"
        description="Siklus penjaminan mutu pembelajaran: pengajuan RPS, review peer dosen, perbaikan, dan pengesahan Kaprodi."
        action={
          <Link
            href="/dashboard/rps/ajukan"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Ajukan RPS Baru</span>
          </Link>
        }
      />

      {/* Filter and Search */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau nama mata kuliah..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select-field text-xs py-1.5 w-44"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAF">Draf</option>
            <option value="DIAJUKAN">Diajukan</option>
            <option value="DIREVIEW">Sedang Direview</option>
            <option value="PERLU_REVISI">Perlu Revisi</option>
            <option value="DISETUJUI">Disetujui Reviewer</option>
            <option value="DISAHKAN">Disahkan Kaprodi</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada pengajuan RPS yang cocok."
        />
      </div>
    </div>
  );
}


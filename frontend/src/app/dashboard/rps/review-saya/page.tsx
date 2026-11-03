'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockRpsSubmissions } from '@/lib/mock-data';
import type { RpsSubmission } from '@/lib/types';
import { ClipboardCheck, ArrowRight, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export default function RpsReviewSayaPage() {
  const [submissions, setSubmissions] = useState<RpsSubmission[]>(mockRpsSubmissions);

  const columns = [
    {
      key: 'mata_kuliah',
      header: 'Mata Kuliah',
      render: (row: RpsSubmission) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{row.course?.nama_mk}</p>
          <p className="text-[11px] text-slate-400">
            Kode: <span className="font-mono font-semibold text-blue-700">{row.course?.kode_mk}</span> • Pengampu: {row.dosen_pengampu?.nama_lengkap || 'Dosen Pengampu'}
          </p>
        </div>
      ),
    },
    {
      key: 'versi',
      header: 'Versi Dokumen',
      render: (row: RpsSubmission) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
          Versi {row.versi_terbaru}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Pengajuan',
      render: (row: RpsSubmission) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Aksi Telaah',
      className: 'text-right',
      render: (row: RpsSubmission) => (
        <Link
          href={`/dashboard/rps/review/${row.id}`}
          className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 font-semibold"
        >
          <ClipboardCheck size={13} />
          <span>Buka Lembar Review</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan Telaah Mutu RPS Saya"
        description="Daftar dokumen RPS mata kuliah yang ditugaskan kepada Anda sebagai peer reviewer independen."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={submissions}
          emptyMessage="Tidak ada tugas review RPS saat ini."
        />
      </div>
    </div>
  );
}


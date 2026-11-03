'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockPublications } from '@/lib/mock-data';
import type { Publication, PublicationType } from '@/lib/types';
import { Plus, Search, BookOpen, ExternalLink, Eye, ArrowRight } from 'lucide-react';

export default function PublikasiListPage() {
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');

  const filtered = publications.filter((p) => {
    const matchSearch =
      p.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nama_target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.some((a) => a.nama_penulis.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchJenis = selectedJenis === 'ALL' || p.jenis === selectedJenis;
    return matchSearch && matchJenis;
  });

  const columns = [
    {
      key: 'judul',
      header: 'Judul Publikasi & Target',
      render: (row: Publication) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/publikasi/${row.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-2 transition-colors"
          >
            {row.judul}
          </Link>
          <p className="text-[11px] text-slate-500">
            Target: <strong className="text-slate-700">{row.nama_target}</strong> • Tahun: {row.tahun}
          </p>
          {row.doi && (
            <a
              href={`https://doi.org/${row.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-mono"
            >
              <ExternalLink size={11} />
              <span>{row.doi}</span>
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'jenis',
      header: 'Jenis & Peringkat',
      render: (row: Publication) => (
        <div className="space-y-1">
          <span className="font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
            {row.jenis}
          </span>
          <p className="text-[11px] font-semibold text-slate-600">
            {row.peringkat.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    {
      key: 'penulis',
      header: 'Penulis',
      render: (row: Publication) => (
        <div className="text-xs space-y-0.5">
          {row.authors.slice(0, 2).map((a, i) => (
            <p key={a.id || i} className="text-slate-700 font-medium truncate max-w-[200px]">
              {a.nama_penulis} <span className="text-[10px] text-slate-400">({a.peran.replace('_', ' ')})</span>
            </p>
          ))}
          {row.authors.length > 2 && (
            <span className="text-[10px] text-slate-400 italic">
              +{row.authors.length - 2} penulis lainnya
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'tahap',
      header: 'Tahapan & Verifikasi',
      render: (row: Publication) => (
        <div className="space-y-1">
          <div>
            <StatusBadge status={row.status} size="sm" />
          </div>
          {row.status_verifikasi !== 'TIDAK_PERLU' && (
            <div className="text-[10px]">
              <span className="text-slate-400 mr-1">Verifikasi:</span>
              <StatusBadge status={row.status_verifikasi} size="sm" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: Publication) => (
        <Link
          href={`/dashboard/publikasi/${row.id}`}
          className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600"
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
        title="Publikasi Dosen & Mahasiswa"
        description="Pencatatan artikel jurnal, prosiding konferensi, buku, dan HKI dengan pelacakan tahapan publikasi dan verifikasi."
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/publikasi/baru"
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Tambah Publikasi</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul, jurnal, atau penulis..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Jenis:</span>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="select-field text-xs py-1.5 w-40"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="JURNAL">Jurnal</option>
            <option value="PROSIDING">Prosiding</option>
            <option value="BUKU">Buku</option>
            <option value="HKI">HKI</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          emptyMessage="Tidak ada publikasi yang sesuai pencarian"
        />
      </div>
    </div>
  );
}


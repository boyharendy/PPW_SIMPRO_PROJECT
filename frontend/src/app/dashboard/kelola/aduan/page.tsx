'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Shield, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';

interface ComplaintItem {
  id: string;
  nomor: string;
  kategori: string;
  judul: string;
  tanggal: string;
  penanggungJawab: string;
  status: 'DITERIMA' | 'DIVERIFIKASI' | 'DITINDAKLANJUTI' | 'SELESAI' | 'DITUTUP';
}

const MOCK_COMPLAINTS: ComplaintItem[] = [
  {
    id: 'c-01',
    nomor: 'ADU-2025-0042',
    kategori: 'AKADEMIK',
    judul: 'Ketidaksesuaian jadwal praktikum basis data dengan perkuliahan teori',
    tanggal: '2025-10-24',
    penanggungJawab: 'Dr. Rina Fitriani (GKM)',
    status: 'DITINDAKLANJUTI',
  },
  {
    id: 'c-02',
    nomor: 'ADU-2025-0045',
    kategori: 'FASILITAS',
    judul: 'AC dan Proyektor di Ruang Laboratorium SI-3 rusak tidak dingin',
    tanggal: '2025-10-25',
    penanggungJawab: 'Staf Sarana Lab',
    status: 'DIVERIFIKASI',
  },
  {
    id: 'c-03',
    nomor: 'ADU-2025-0047',
    kategori: 'LAYANAN_ADMINISTRASI',
    judul: 'Keterlambatan pengesahan berkas surat izin magang oleh TU',
    tanggal: '2025-10-26',
    penanggungJawab: 'Admin Prodi',
    status: 'DITERIMA',
  },
  {
    id: 'c-04',
    nomor: 'ADU-2025-0038',
    kategori: 'AKADEMIK',
    judul: 'Nilai UTS mata kuliah Pemrograman Web belum diumumkan setelah 3 minggu',
    tanggal: '2025-10-10',
    penanggungJawab: 'Dosen Pengampu',
    status: 'SELESAI',
  },
];

export default function Page() {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = filterStatus === 'ALL'
    ? MOCK_COMPLAINTS
    : MOCK_COMPLAINTS.filter((c) => c.status === filterStatus);

  const columns: DataTableColumn<ComplaintItem>[] = [
    {
      key: 'nomor',
      header: 'Nomor Tiket & Kategori',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{r.nomor}</span>
          <div className="mt-0.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              {r.kategori.replace('_', ' ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'judul',
      header: 'Pokok Pengaduan & Tanggal Masuk',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{r.judul}</div>
          <div className="text-xs text-slate-400 mt-0.5">Diterima: {formatDateShort(r.tanggal)}</div>
        </div>
      ),
    },
    {
      key: 'pj',
      header: 'Penanggung Jawab Disposisi',
      render: (r) => <span className="text-xs text-slate-700 font-medium">{r.penanggungJawab}</span>,
    },
    {
      key: 'status',
      header: 'Status Pengaduan',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/kelola/aduan/${r.id}`}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Antrean Aduan Masuk"
        description="Kelola penerimaan, telaah awal, dan disposisi tiket aduan prodi (FR-48, FR-49)."
        actions={
          <Link
            href="/dashboard/kelola/aduan/sensitif"
            className="btn-secondary text-xs px-3 py-1.5 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
          >
            <Shield size={14} /> Kanal Aduan Sensitif (PGL-K)
          </Link>
        }
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 flex-wrap">
            {['ALL', 'DITERIMA', 'DIVERIFIKASI', 'DITINDAKLANJUTI', 'SELESAI'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua Aduan' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Menampilkan {filtered.length} tiket aduan
          </span>
        </div>

        <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada tiket aduan untuk filter ini." />
      </div>
    </div>
  );
}

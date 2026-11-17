'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, ArrowRight, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatRupiah } from '@/lib/utils';

interface RKA {
  tahun: number;
  judul: string;
  totalPagu: number;
  versiAktif: number;
  status: string;
}

const MOCK_RKA: RKA[] = [
  {
    tahun: 2025,
    judul: 'RKA Program Studi Informatika TA 2025',
    totalPagu: 485000000,
    versiAktif: 2,
    status: 'AKTIF',
  },
  {
    tahun: 2024,
    judul: 'RKA Program Studi Informatika TA 2024',
    totalPagu: 420000000,
    versiAktif: 3,
    status: 'DITUTUP',
  },
  {
    tahun: 2023,
    judul: 'RKA Program Studi Informatika TA 2023',
    totalPagu: 375000000,
    versiAktif: 2,
    status: 'ARSIP',
  },
];

export default function Page() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [tahunBaru, setTahunBaru] = useState('');
  const [judulBaru, setJudulBaru] = useState('');

  const columns: DataTableColumn<RKA>[] = [
    {
      key: 'tahun',
      header: 'Tahun Anggaran',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.tahun}</span>
      ),
    },
    {
      key: 'judul',
      header: 'Judul',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-blue-500 shrink-0" />
          <span className="text-sm text-slate-700">{row.judul}</span>
        </div>
      ),
    },
    {
      key: 'totalPagu',
      header: 'Total Pagu',
      render: (row) => (
        <span className="font-medium text-slate-800">{formatRupiah(row.totalPagu)}</span>
      ),
    },
    {
      key: 'versiAktif',
      header: 'Versi Aktif',
      render: (row) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          v{row.versiAktif}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => router.push(`/dashboard/rka/${row.tahun}`)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Rencana Kerja & Anggaran (RKA)"
        description="Kelola rencana kerja dan anggaran program studi per tahun anggaran"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Buat RKA Tahun Baru
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <DataTable columns={columns} data={MOCK_RKA} emptyMessage="Belum ada RKA" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat RKA Tahun Baru">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahun Anggaran</label>
            <input
              type="number"
              value={tahunBaru}
              onChange={(e) => setTahunBaru(e.target.value)}
              placeholder="Contoh: 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul RKA</label>
            <input
              type="text"
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
              placeholder="Contoh: RKA Program Studi Informatika TA 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium">
              Batal
            </button>
            <button className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors">
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

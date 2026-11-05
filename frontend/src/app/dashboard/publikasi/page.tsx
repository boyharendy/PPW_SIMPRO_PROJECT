'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Publikasi = {
  id: string;
  judul: string;
  jenis: 'JURNAL' | 'PROSIDING' | 'BUKU' | 'HKI';
  penulisUtama: string;
  peringkat: string;
  tahun: number;
  status: string;
};

const JENIS_COLORS: Record<string, string> = {
  JURNAL: 'bg-blue-50 text-blue-700 border-blue-200',
  PROSIDING: 'bg-violet-50 text-violet-700 border-violet-200',
  BUKU: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HKI: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TABS = ['Semua', 'DRAF', 'DIAJUKAN', 'DALAM_REVIEW', 'DITERIMA', 'TERBIT'] as const;

const mockData: Publikasi[] = [
  { id: 'PUB-001', judul: 'Implementasi Deep Learning untuk Deteksi Anomali pada Jaringan IoT', jenis: 'JURNAL', penulisUtama: 'Dr. Rina Fitriani, M.Kom.', peringkat: 'SINTA 2', tahun: 2025, status: 'TERBIT' },
  { id: 'PUB-002', judul: 'Analisis Performa Algoritma Clustering pada Data Spasial Skala Besar', jenis: 'PROSIDING', penulisUtama: 'Agus Prasetyo, M.T.', peringkat: 'Scopus Q3', tahun: 2025, status: 'DITERIMA' },
  { id: 'PUB-003', judul: 'Pengembangan Sistem Rekomendasi Berbasis Collaborative Filtering', jenis: 'JURNAL', penulisUtama: 'Siti Nurhaliza, M.Cs.', peringkat: 'SINTA 3', tahun: 2025, status: 'DALAM_REVIEW' },
  { id: 'PUB-004', judul: 'Panduan Praktis Pemrograman Web Modern dengan Next.js', jenis: 'BUKU', penulisUtama: 'Budi Hartono, M.Kom.', peringkat: 'Non-peringkat', tahun: 2024, status: 'DRAF' },
  { id: 'PUB-005', judul: 'Hak Cipta Aplikasi Manajemen Kurikulum Berbasis AI', jenis: 'HKI', penulisUtama: 'Dewi Kartika, M.Sc.', peringkat: 'Non-peringkat', tahun: 2025, status: 'DIAJUKAN' },
];

export default function Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [search, setSearch] = useState('');

  const filtered = mockData.filter((p) => {
    const matchTab = activeTab === 'Semua' || p.status === activeTab;
    const matchSearch = p.judul.toLowerCase().includes(search.toLowerCase()) ||
      p.penulisUtama.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const columns: DataTableColumn<Publikasi>[] = [
    {
      key: 'judul',
      header: 'Judul Publikasi',
      render: (r) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-800 truncate">{r.judul}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${JENIS_COLORS[r.jenis]}`}>
            {r.jenis}
          </span>
        </div>
      ),
    },
    { key: 'penulisUtama', header: 'Penulis Utama' },
    {
      key: 'peringkat',
      header: 'Peringkat',
      render: (r) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {r.peringkat}
        </span>
      ),
    },
    { key: 'tahun', header: 'Tahun' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (r) => (
        <button
          onClick={() => router.push(`/dashboard/publikasi/${r.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Eye size={14} />
          Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publikasi Dosen & Mahasiswa"
        description="Pencatatan dan pelacakan publikasi ilmiah program studi"
        actions={
          <button
            onClick={() => router.push('/dashboard/publikasi/baru')}
            className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Publikasi
          </button>
        }
      />

      {/* Filter Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab === 'Semua' ? 'Semua' : tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau penulis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada publikasi ditemukan" />
      </div>
    </div>
  );
}

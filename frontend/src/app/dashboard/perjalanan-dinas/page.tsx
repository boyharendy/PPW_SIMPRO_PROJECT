'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';
import { Plus, Eye } from 'lucide-react';

interface PerjalananDinas {
  id: string;
  tujuan: string;
  maksud: string;
  pelaksana: string;
  tglBerangkat: string;
  tglKembali: string;
  sumberDana: string;
  status: string;
}

const MOCK_DATA: PerjalananDinas[] = [
  {
    id: 'PD-001',
    tujuan: 'Surabaya',
    maksud: 'Menghadiri Seminar Nasional Teknologi Informasi dan Komunikasi 2025',
    pelaksana: 'Dr. Budi Santoso, M.Kom.',
    tglBerangkat: '2025-03-10',
    tglKembali: '2025-03-12',
    sumberDana: 'RKA Prodi',
    status: 'DIAJUKAN',
  },
  {
    id: 'PD-002',
    tujuan: 'Yogyakarta',
    maksud: 'Workshop Penyusunan Kurikulum Merdeka Belajar Kampus Merdeka',
    pelaksana: 'Siti Aminah, S.Kom., M.T.',
    tglBerangkat: '2025-02-20',
    tglKembali: '2025-02-22',
    sumberDana: 'Fakultas',
    status: 'DISETUJUI',
  },
  {
    id: 'PD-003',
    tujuan: 'Bandung',
    maksud: 'Presentasi paper pada konferensi internasional IEEE ICITSI',
    pelaksana: 'Rudi Hermawan, S.T., M.Cs.',
    tglBerangkat: '2025-01-15',
    tglKembali: '2025-01-18',
    sumberDana: 'Hibah',
    status: 'DILAPORKAN',
  },
  {
    id: 'PD-004',
    tujuan: 'Malang',
    maksud: 'Benchmarking laboratorium IoT ke Universitas Brawijaya',
    pelaksana: 'Dr. Budi Santoso, M.Kom.',
    tglBerangkat: '2024-12-05',
    tglKembali: '2024-12-07',
    sumberDana: 'RKA Prodi',
    status: 'SELESAI',
  },
];

const TABS = ['Semua', 'DIAJUKAN', 'DISETUJUI', 'DILAPORKAN', 'SELESAI'] as const;
const TAB_LABELS: Record<string, string> = {
  Semua: 'Semua',
  DIAJUKAN: 'Diajukan',
  DISETUJUI: 'Disetujui',
  DILAPORKAN: 'Dilaporkan',
  SELESAI: 'Selesai',
};

export default function Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Semua');

  const filtered = activeTab === 'Semua'
    ? MOCK_DATA
    : MOCK_DATA.filter((d) => d.status === activeTab);

  const columns = [
    {
      key: 'tujuan',
      header: 'Tujuan & Maksud',
      render: (row: PerjalananDinas) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{row.tujuan}</p>
          <p className="text-xs text-slate-500 truncate max-w-[260px]">{row.maksud}</p>
        </div>
      ),
    },
    { key: 'pelaksana', header: 'Pelaksana' },
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row: PerjalananDinas) => (
        <span className="text-sm text-slate-700">
          {formatDateShort(row.tglBerangkat)} – {formatDateShort(row.tglKembali)}
        </span>
      ),
    },
    { key: 'sumberDana', header: 'Sumber Dana' },
    {
      key: 'status',
      header: 'Status',
      render: (row: PerjalananDinas) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: PerjalananDinas) => (
        <button
          onClick={() => router.push(`/dashboard/perjalanan-dinas/${row.id}`)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perjalanan Dinas"
        description="Kelola pengajuan, persetujuan, dan pelaporan perjalanan dinas"
        actions={
          <button
            onClick={() => router.push('/dashboard/perjalanan-dinas/baru')}
            className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Ajukan Perjalanan
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Belum ada data perjalanan dinas"
        />
      </div>
    </div>
  );
}

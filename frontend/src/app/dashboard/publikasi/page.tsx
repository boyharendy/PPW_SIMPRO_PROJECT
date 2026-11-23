'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUser } from '@/lib/context';
import { publicationService } from '@/lib/api/services/publication.service';
import type { Publication } from '@/lib/types';
import MotionCard from '@/components/motion/MotionCard';
import MorphingTabBar from '@/components/motion/MorphingTabBar';
import MorphingTabContent from '@/components/motion/MorphingTabContent';

const JENIS_COLORS: Record<string, string> = {
  JURNAL: 'bg-blue-50 text-blue-700 border-blue-200',
  PROSIDING: 'bg-violet-50 text-violet-700 border-violet-200',
  BUKU: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HKI: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TABS = [
  'Semua',
  'DRAF',
  'REVIEW_INTERNAL',
  'DIAJUKAN',
  'DALAM_REVIEW',
  'DITERIMA',
  'TERBIT',
] as const;

export default function Page() {
  const router = useRouter();
  const { currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [publications, setPublications] = useState<Publication[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    publicationService.getPublications().then((res) => {
      if (active && res.data && Array.isArray(res.data)) {
        setPublications(res.data);
      }
    }).catch(() => { if(active) setPublications([]); });
    return () => {
      active = false;
    };
  }, []);

  const filtered = publications.filter((p) => {
    const matchTab = activeTab === 'Semua' || p.status === activeTab;
    const primaryAuthor = p.authors?.[0]?.nama_penulis || '';
    const q = search.toLowerCase();
    const matchSearch =
      p.judul.toLowerCase().includes(q) || primaryAuthor.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const columns: DataTableColumn<Publication>[] = [
    {
      key: 'judul',
      header: 'Judul Publikasi',
      render: (r) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-800 truncate">{r.judul}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${
                JENIS_COLORS[r.jenis] || 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {r.jenis}
            </span>
            {r.tipe_pencatat && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {r.tipe_pencatat === 'MAHASISWA' ? 'Publikasi Mahasiswa' : 'Publikasi Dosen'}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'penulisUtama',
      header: 'Penulis Utama',
      render: (r) => (
        <span className="text-sm text-slate-700">
          {r.authors?.[0]?.nama_penulis || '-'}
        </span>
      ),
    },
    {
      key: 'peringkat',
      header: 'Peringkat',
      render: (r) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {(r.peringkat || 'NON_PERINGKAT').replace(/_/g, ' ')}
        </span>
      ),
    },
    { key: 'tahun', header: 'Tahun' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={r.status} size="sm" />
          {(r.tipe_pencatat === 'MAHASISWA' || r.status_verifikasi === 'MENUNGGU' || r.status_verifikasi === 'DITOLAK') && (
            <span className="text-[11px] text-slate-500">
              Verif Pembimbing: <strong className="text-slate-700">{r.status_verifikasi}</strong>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (r) => (
        <button
          onClick={() => router.push(`/dashboard/publikasi/${r.id}`)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} />
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
      <MotionCard index={0} interactive={false} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <MorphingTabBar
            layoutId="publikasi-status-tabs"
            value={activeTab}
            onChange={setActiveTab}
            containerClassName="flex items-center gap-1 overflow-x-auto p-0.5"
            buttonClassName="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
            activePillClassName="bg-emerald-600 rounded-lg shadow-xs"
            activeTextClassName="text-white"
            inactiveTextClassName="text-slate-500 hover:bg-slate-100"
            options={TABS.map((tab) => ({
              value: tab as string,
              label: tab === 'Semua' ? 'Semua' : tab.replace(/_/g, ' '),
            }))}
          />
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
      </MotionCard>

      {/* Table */}
      <MotionCard index={1} interactive={false} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <MorphingTabContent activeKey={activeTab} orderedKeys={TABS}>
          <DataTable columns={columns} data={filtered} emptyMessage="Tidak ada publikasi ditemukan" />
        </MorphingTabContent>
      </MotionCard>
    </div>
  );
}

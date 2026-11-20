'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockUkmDirectories } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { getStatusLabel } from '@/lib/utils';
import type { UkmDirectory, UkmCategory } from '@/lib/types';
import { Plus, Eye, Users, Compass, PieChart, Search, Mail, Phone, Calendar } from 'lucide-react';

const CATEGORIES: Array<'ALL' | UkmCategory> = ['ALL', 'PENALARAN', 'OLAHRAGA', 'SENI', 'KEAGAMAAN', 'SOSIAL', 'KHUSUS'];

export default function DirektoriUkmPage() {
  const { currentRole } = useUser();
  const [ukms, setUkms] = useState<UkmDirectory[]>(mockUkmDirectories);
  const [category, setCategory] = useState<'ALL' | UkmCategory>('ALL');
  const [search, setSearch] = useState('');
  const [selectedUkm, setSelectedUkm] = useState<UkmDirectory | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [formKat, setFormKat] = useState<UkmCategory>('PENALARAN');
  const [pembina, setPembina] = useState('Dr. Ahmad Fauzi, M.T.');
  const [ketua, setKetua] = useState('');
  const [jadwal, setJadwal] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  useEffect(() => {
    const sync = () => setUkms(storageSync.get<UkmDirectory[]>(STORAGE_KEYS.UKM_DIRECTORIES, mockUkmDirectories));
    sync();
    window.addEventListener('simpro_storage_change', sync);
    return () => window.removeEventListener('simpro_storage_change', sync);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ukms.filter((u) => {
      const matchCat = category === 'ALL' || u.kategori === category;
      const matchQ = !q || u.nama_ukm.toLowerCase().includes(q) || u.kode_ukm.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [ukms, category, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim() || !ketua.trim()) return;
    const item: UkmDirectory = {
      id: `ukm-dir-${Date.now()}`,
      kode_ukm: kode.trim().toUpperCase(),
      nama_ukm: nama.trim(),
      kategori: formKat,
      dosen_pembina_id: 'u-kaprodi',
      dosen_pembina_nama: pembina,
      ketua_nim: '220101000',
      ketua_nama: ketua.trim(),
      kontak_email: `${kode.trim().toLowerCase()}@univ.ac.id`,
      kontak_telepon: '081200000000',
      deskripsi: deskripsi.trim() || 'Unit Kegiatan Mahasiswa Program Studi.',
      jadwal_rutin: jadwal.trim() || 'Jadwal menyusul',
      status_aktif: 'AKTIF',
      jumlah_anggota_aktif: 1,
      created_at: new Date().toISOString().split('T')[0],
    };
    setUkms(storageSync.prepend(STORAGE_KEYS.UKM_DIRECTORIES, item, mockUkmDirectories));
    setShowAdd(false);
    setKode('');
    setNama('');
    setKetua('');
    setJadwal('');
    setDeskripsi('');
  };

  const columns: DataTableColumn<UkmDirectory>[] = [
    {
      key: 'nama_ukm',
      header: 'Nama & Kode UKM',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{r.nama_ukm}</p>
          <p className="text-[11px] font-mono text-slate-500">{r.kode_ukm}</p>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (r) => (
        <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
          {getStatusLabel(r.kategori)}
        </span>
      ),
    },
    {
      key: 'pembina',
      header: 'Pembina & Ketua',
      render: (r) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{r.dosen_pembina_nama}</p>
          <p className="text-slate-500">Ketua: {r.ketua_nama}</p>
        </div>
      ),
    },
    {
      key: 'anggota',
      header: 'Anggota Aktif',
      render: (r) => <span className="text-xs font-bold text-slate-800">{r.jumlah_anggota_aktif} Mahasiswa</span>,
    },
    {
      key: 'status_aktif',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status_aktif} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedUkm(r)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" /> Detail
        </button>
      ),
    },
  ];

  const totalMembers = ukms.reduce((sum, u) => sum + u.jumlah_anggota_aktif, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Direktori Unit Kegiatan Mahasiswa (UKM)"
        description="Daftar resmi UKM di lingkungan Program Studi beserta dosen pembina, pengurus, jadwal kegiatan rutin, dan informasi kontak."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {(currentRole === 'MAHASISWA' || currentRole === 'DOSEN_PEMBINA') && (
              <Link
                href="/dashboard/ukm/keanggotaan"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Users className="h-4 w-4 text-blue-600" /> Keanggotaan UKM
              </Link>
            )}
            {(currentRole === 'ADMIN_PRODI' || currentRole === 'DOSEN_PEMBINA' || currentRole === 'KAPRODI') && (
              <Link
                href="/dashboard/ukm/rekap"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <PieChart className="h-4 w-4 text-emerald-600" /> Rekap Partisipasi
              </Link>
            )}
            {(currentRole === 'ADMIN_PRODI' || currentRole === 'KAPRODI') && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Tambah UKM
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total UKM Terdaftar" value={ukms.length} subtitle="Organisasi kemahasiswaan" icon={<Compass size={16} />} badgeTone="blue" />
        <StatCard title="UKM Aktif" value={ukms.filter((u) => u.status_aktif === 'AKTIF').length} subtitle="Berjalan pada periode ini" icon="CheckCircle2" badgeTone="emerald" />
        <StatCard title="Total Anggota Aktif" value={totalMembers} subtitle="Akumulasi seluruh UKM" icon={<Users size={16} />} badgeTone="indigo" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  category === cat ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : getStatusLabel(cat)}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode UKM..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-blue-500 focus:outline-none w-full sm:w-56"
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} emptyMessage="Belum ada UKM untuk filter yang dipilih." />
      </div>

      {selectedUkm && (
        <Modal isOpen={!!selectedUkm} onClose={() => setSelectedUkm(null)} title={selectedUkm.nama_ukm}>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">{selectedUkm.kode_ukm}</span>
              <StatusBadge status={selectedUkm.status_aktif} size="sm" />
            </div>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">{selectedUkm.deskripsi}</p>
            <div className="space-y-1.5 text-xs text-slate-700">
              <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-blue-600" /> <strong>Jadwal:</strong> {selectedUkm.jadwal_rutin}</p>
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-600" /> <strong>Email:</strong> {selectedUkm.kontak_email}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-600" /> <strong>Telepon:</strong> {selectedUkm.kontak_telepon}</p>
              <p><strong>Dosen Pembina:</strong> {selectedUkm.dosen_pembina_nama}</p>
              <p><strong>Ketua UKM:</strong> {selectedUkm.ketua_nama} ({selectedUkm.ketua_nim})</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setSelectedUkm(null)} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah UKM Baru">
        <form onSubmit={handleAdd} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode UKM *</label>
              <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="UKM-PEN-05" className="w-full rounded-lg border border-slate-300 p-2" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori</label>
              <select value={formKat} onChange={(e) => setFormKat(e.target.value as UkmCategory)} className="w-full rounded-lg border border-slate-300 p-2 bg-white">
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>{getStatusLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama UKM *</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ketua UKM *</label>
              <input type="text" value={ketua} onChange={(e) => setKetua(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dosen Pembina</label>
              <input type="text" value={pembina} onChange={(e) => setPembina(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Jadwal Rutin</label>
            <input type="text" value={jadwal} onChange={(e) => setJadwal(e.target.value)} placeholder="Setiap Jumat 15:00 WIB" className="w-full rounded-lg border border-slate-300 p-2" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockUkmDirectories, mockUkmMemberships } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { UkmDirectory, UkmMembership, UkmPosition } from '@/lib/types';
import { ArrowLeft, Plus, CheckCircle2, XCircle, Users, Clock, Search } from 'lucide-react';

const POSITIONS: UkmPosition[] = ['ANGGOTA', 'KORDINATOR_DIVISI', 'SEKRETARIS', 'BENDAHARA', 'WAKIL_KETUA', 'KETUA'];

export default function KeanggotaanUkmPage() {
  const { currentRole } = useUser();
  const [ukms, setUkms] = useState<UkmDirectory[]>(mockUkmDirectories);
  const [memberships, setMemberships] = useState<UkmMembership[]>(mockUkmMemberships);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK'>('ALL');
  const [search, setSearch] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [selectedUkmId, setSelectedUkmId] = useState(mockUkmDirectories[0]?.id ?? '');
  const [mhsNama, setMhsNama] = useState('Muhammad Rizky Pratama');
  const [mhsNim, setMhsNim] = useState('1201220001');
  const [angkatan, setAngkatan] = useState('2022');
  const [jabatan, setJabatan] = useState<UkmPosition>('ANGGOTA');
  const [periode, setPeriode] = useState('2024/2025');

  useEffect(() => {
    const sync = () => {
      setUkms(storageSync.get<UkmDirectory[]>(STORAGE_KEYS.UKM_DIRECTORIES, mockUkmDirectories));
      setMemberships(storageSync.get<UkmMembership[]>(STORAGE_KEYS.UKM_MEMBERSHIPS, mockUkmMemberships));
    };
    sync();
    window.addEventListener('simpro_storage_change', sync);
    return () => window.removeEventListener('simpro_storage_change', sync);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memberships.filter((m) => {
      const matchSt = filterStatus === 'ALL' || m.status === filterStatus;
      const matchQ =
        !q ||
        m.mahasiswa_nama.toLowerCase().includes(q) ||
        m.mahasiswa_nim.toLowerCase().includes(q) ||
        m.ukm_nama.toLowerCase().includes(q);
      return matchSt && matchQ;
    });
  }, [memberships, filterStatus, search]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const ukm = ukms.find((u) => u.id === selectedUkmId) ?? ukms[0];
    if (!ukm || !mhsNama.trim() || !mhsNim.trim()) return;

    const entry: UkmMembership = {
      id: `ukm-mem-${Date.now()}`,
      ukm_id: ukm.id,
      ukm_nama: ukm.nama_ukm,
      mahasiswa_nim: mhsNim.trim(),
      mahasiswa_nama: mhsNama.trim(),
      angkatan: parseInt(angkatan, 10) || 2022,
      jabatan,
      periode_kepengurusan: periode,
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };
    setMemberships(storageSync.prepend(STORAGE_KEYS.UKM_MEMBERSHIPS, entry, mockUkmMemberships));
    setShowJoinModal(false);
  };

  const handleVerify = (id: string, status: 'TERVERIFIKASI' | 'DITOLAK') => {
    const updated = storageSync.update<UkmMembership>(
      STORAGE_KEYS.UKM_MEMBERSHIPS,
      id,
      {
        status,
        diverifikasi_oleh: 'Dosen Pembina UKM',
        diverifikasi_at: new Date().toISOString(),
      },
      mockUkmMemberships
    );
    setMemberships(updated);
  };

  const columns: DataTableColumn<UkmMembership>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{r.mahasiswa_nama}</p>
          <p className="text-[11px] font-mono text-slate-500">NIM: {r.mahasiswa_nim} • Angkatan {r.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'ukm',
      header: 'UKM & Periode',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{r.ukm_nama}</p>
          <p className="text-[11px] text-slate-500">Periode {r.periode_kepengurusan}</p>
        </div>
      ),
    },
    {
      key: 'jabatan',
      header: 'Jabatan',
      render: (r) => (
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {r.jabatan.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    ...(currentRole === 'DOSEN_PEMBINA'
      ? [
          {
            key: 'aksi',
            header: 'Verifikasi',
            render: (r: UkmMembership) =>
              r.status === 'MENUNGGU' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleVerify(r.id, 'TERVERIFIKASI')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(r.id, 'DITOLAK')}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Tolak
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">{r.diverifikasi_oleh || '-'}</span>
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/ukm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Direktori UKM
        </Link>
      </div>

      <PageHeader
        title="Keanggotaan Unit Kegiatan Mahasiswa"
        description="Pendaftaran keanggotaan dan kepengurusan UKM mahasiswa serta verifikasi resmi oleh Dosen Pembina."
        actions={
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Ajukan Keanggotaan
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Pengajuan" value={memberships.length} subtitle="Data keanggotaan UKM" icon={<Users size={16} />} badgeTone="blue" />
        <StatCard title="Terverifikasi" value={memberships.filter((m) => m.status === 'TERVERIFIKASI').length} subtitle="Keanggotaan aktif" icon="CheckCircle2" badgeTone="emerald" />
        <StatCard title="Menunggu Pembina" value={memberships.filter((m) => m.status === 'MENUNGGU').length} subtitle="Perlu persetujuan" icon={<Clock size={16} />} badgeTone="amber" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'MENUNGGU', 'TERVERIFIKASI', 'DITOLAK'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  filterStatus === st ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'MENUNGGU' ? 'Menunggu' : st === 'TERVERIFIKASI' ? 'Terverifikasi' : 'Ditolak'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau UKM..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-blue-500 focus:outline-none w-full sm:w-56"
            />
          </div>
        </div>

        <DataTable data={filtered} columns={columns} emptyMessage="Belum ada data keanggotaan UKM." />
      </div>

      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Ajukan Keanggotaan UKM">
        <form onSubmit={handleJoin} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih UKM *</label>
            <select value={selectedUkmId} onChange={(e) => setSelectedUkmId(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 bg-white">
              {ukms.map((u) => (
                <option key={u.id} value={u.id}>{u.nama_ukm}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Mahasiswa *</label>
              <input type="text" value={mhsNama} onChange={(e) => setMhsNama(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">NIM *</label>
              <input type="text" value={mhsNim} onChange={(e) => setMhsNim(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Angkatan</label>
              <input type="number" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan</label>
              <select value={jabatan} onChange={(e) => setJabatan(e.target.value as UkmPosition)} className="w-full rounded-lg border border-slate-300 p-2 bg-white">
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Periode</label>
              <input type="text" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setShowJoinModal(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer">Kirim Pengajuan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

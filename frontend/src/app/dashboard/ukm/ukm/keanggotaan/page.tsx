'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockUkmMemberships, mockUkmDirectories } from '@/lib/mock-data';
import type { UkmMembership, UkmPosition } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  XCircle,
  Compass,
} from 'lucide-react';

export default function KeanggotaanUkmPage() {
  const { currentRole } = useUser();
  const [memberships, setMemberships] = useState<UkmMembership[]>(mockUkmMemberships);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<UkmMembership | null>(null);

  // Form states
  const [selectedUkmId, setSelectedUkmId] = useState(mockUkmDirectories[0].id);
  const [nim, setNim] = useState('230201018');
  const [nama, setNama] = useState('Fajar Nugraha');
  const [angkatan, setAngkatan] = useState('2023');
  const [jabatan, setJabatan] = useState<UkmPosition>('ANGGOTA');
  const [periode, setPeriode] = useState('2024/2025');

  const pendingMembers = memberships.filter((m) => m.status === 'MENUNGGU');
  const verifiedMembers = memberships.filter((m) => m.status === 'TERVERIFIKASI');

  const handleJoinSubmit = () => {
    const targetUkm = mockUkmDirectories.find((u) => u.id === selectedUkmId);
    if (!targetUkm) return;

    const newMembership: UkmMembership = {
      id: `ukm-mem-${Date.now()}`,
      ukm_id: targetUkm.id,
      ukm_nama: targetUkm.nama_ukm,
      mahasiswa_nim: nim,
      mahasiswa_nama: nama,
      angkatan: parseInt(angkatan) || 2023,
      jabatan,
      periode_kepengurusan: periode,
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };

    setMemberships([newMembership, ...memberships]);
    setShowJoinModal(false);
  };

  const handleVerify = (id: string, isApproved: boolean) => {
    setMemberships(
      memberships.map((m) =>
        m.id === id
          ? {
              ...m,
              status: isApproved ? 'TERVERIFIKASI' : 'DITOLAK',
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Pembina UKM)',
              diverifikasi_at: new Date().toISOString(),
              catatan: isApproved ? 'Keanggotaan disahkan.' : 'Ditolak: data kepengurusan tidak sesuai.',
            }
          : m
      )
    );
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row: UkmMembership) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500">NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'ukm',
      header: 'Nama UKM & Periode',
      render: (row: UkmMembership) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-xs">{row.ukm_nama}</span>
          <p className="text-[11px] text-slate-500">Periode: {row.periode_kepengurusan}</p>
        </div>
      ),
    },
    {
      key: 'jabatan',
      header: 'Jabatan Organisasi',
      render: (row: UkmMembership) => (
        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {row.jabatan.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (row: UkmMembership) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi Pembina',
      render: (row: UkmMembership) => (
        row.status === 'MENUNGGU' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleVerify(row.id, true)}
              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verifikasi</span>
            </button>
            <button
              onClick={() => handleVerify(row.id, false)}
              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Tolak</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Tercatat Resmi</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/ukm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Direktori UKM</span>
        </Link>
      </div>

      <PageHeader
        title="Keanggotaan & Kepengurusan UKM (FR-15)"
        description="Mahasiswa mendaftarkan keanggotaan dan kepengurusan pada UKM prodi. Keanggotaan baru resmi tercatat setelah diverifikasi oleh dosen pembina UKM terkait."
        actions={
          <button
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Daftar Keanggotaan UKM</span>
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Anggota Terverifikasi"
          value={verifiedMembers.length.toString()}
          description="Tercatat aktif di prodi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingMembers.length.toString()}
          description="Pendaftaran baru masuk"
          icon="Clock"
        />
        <StatCard
          title="Total Registrasi"
          value={memberships.length.toString()}
          description="Periode 2024/2025"
          icon="Users"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Daftar Pengajuan & Riwayat Keanggotaan Mahasiswa</h3>
        <DataTable
          data={memberships}
          columns={columns}
          searchPlaceholder="Cari mahasiswa atau UKM..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Daftar UKM (FR-15) */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Formulir Pendaftaran Keanggotaan UKM (FR-15)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Pilih unit kegiatan mahasiswa yang ingin Anda ikuti beserta posisi jabatan kepengurusan. Pendaftaran akan dikirimkan ke Dosen Pembina UKM untuk diverifikasi.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih UKM Tujuan *</label>
            <select
              value={selectedUkmId}
              onChange={(e) => setSelectedUkmId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            >
              {mockUkmDirectories.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama_ukm} ({u.kategori})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan dalam UKM *</label>
              <select
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value as UkmPosition)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="ANGGOTA">Anggota Biasa</option>
                <option value="KORDINATOR_DIVISI">Koordinator Divisi</option>
                <option value="SEKRETARIS">Sekretaris</option>
                <option value="BENDAHARA">Bendahara</option>
                <option value="WAKIL_KETUA">Wakil Ketua</option>
                <option value="KETUA">Ketua UKM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode Kepengurusan</label>
              <input
                type="text"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowJoinModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleJoinSubmit}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Kirim Pendaftaran
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

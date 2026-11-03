'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockScholarshipRecipients } from '@/lib/mock-data';
import type { ScholarshipRecipient, ScholarshipStatus } from '@/lib/types';
import {
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileCheck,
  PieChart,
  UserCheck,
  Search,
} from 'lucide-react';

export default function BeasiswaListPage() {
  const { currentRole } = useUser();
  const [recipients, setRecipients] = useState<ScholarshipRecipient[]>(mockScholarshipRecipients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Form state
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [angkatan, setAngkatan] = useState('2023');
  const [jenisBeasiswa, setJenisBeasiswa] = useState('KIP Kuliah Merdeka');
  const [pemberi, setPemberi] = useState('Puslapdik Kemendikbudristek');
  const [periode, setPeriode] = useState('2024/2025 Ganjil');
  const [kewajibanJam, setKewajibanJam] = useState('50');

  const filteredRecipients = recipients.filter((r) => {
    return selectedStatus === 'ALL' || r.status === selectedStatus;
  });

  const handleAddRecipient = () => {
    if (!nim || !nama) return;
    const newRec: ScholarshipRecipient = {
      id: `sch-rec-${Date.now()}`,
      mahasiswa_nim: nim,
      mahasiswa_nama: nama,
      angkatan: parseInt(angkatan) || 2023,
      program_studi: 'Sistem Informasi',
      jenis_beasiswa: jenisBeasiswa,
      pemberi_beasiswa: pemberi,
      periode,
      kewajiban_jam: parseInt(kewajibanJam) || 50,
      jam_terverifikasi: 0,
      jam_menunggu: 0,
      status: 'AKTIF',
      dosen_verifikator_id: 'u-kaprodi',
      dosen_verifikator_nama: 'Dr. Ahmad Fauzi, M.T.',
      is_berisiko: false,
      created_at: new Date().toISOString(),
    };

    setRecipients([newRec, ...recipients]);
    setShowAddModal(false);
    setNim('');
    setNama('');
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penerima',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-sm sm:text-base">{row.mahasiswa_nama}</span>
          <p className="text-xs text-slate-500">NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'beasiswa',
      header: 'Jenis & Pemberi Beasiswa',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-sm">{row.jenis_beasiswa}</span>
          <p className="text-xs text-slate-500">{row.pemberi_beasiswa}</p>
        </div>
      ),
    },
    {
      key: 'periode',
      header: 'Periode & Dosen Wali/Verifikator',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-slate-700">{row.periode}</span>
          <p className="text-xs text-slate-500">Verifikator: {row.dosen_verifikator_nama}</p>
        </div>
      ),
    },
    {
      key: 'progres',
      header: 'Pemenuhan Jam Karya',
      render: (row: ScholarshipRecipient) => {
        const percent = Math.min(100, Math.round((row.jam_terverifikasi / row.kewajiban_jam) * 100));
        return (
          <div className="space-y-1.5 min-w-[150px]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-800">
                {row.jam_terverifikasi} / {row.kewajiban_jam} Jam
              </span>
              <span className={`font-semibold ${percent >= 100 ? 'text-emerald-600' : row.is_berisiko ? 'text-rose-600' : 'text-blue-600'}`}>
                {percent}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 100 ? 'bg-emerald-500' : row.is_berisiko ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {row.is_berisiko && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Risiko Tidak Terpenuhi
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ScholarshipRecipient) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modul 2: Beasiswa & Jam Karya Mahasiswa"
        description="Pengelolaan daftar penerima beasiswa, pemantauan kewajiban jam karya, dan identifikasi risiko pemenuhan (FR-05, FR-08)."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/beasiswa/rekap"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <PieChart className="h-4 w-4 text-blue-600" />
              <span>Rekap Pemenuhan Jam</span>
            </Link>
            <Link
              href="/dashboard/beasiswa/verifikasi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <span>Verifikasi Entri Jam</span>
            </Link>
            {(currentRole === 'ADMIN_PRODI' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Penerima Beasiswa</span>
              </button>
            )}
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Penerima Beasiswa"
          value={recipients.length.toString()}
          description="Periode Ganjil 2024/2025"
          icon="Award"
        />
        <StatCard
          title="Pemenuhan Tuntas (100%)"
          value={recipients.filter((r) => r.status === 'SELESAI').length.toString()}
          description="Kewajiban jam karya terpenuhi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Status Aktif Berjalan"
          value={recipients.filter((r) => r.status === 'AKTIF').length.toString()}
          description="Sedang menyelesaikan jam karya"
          icon="Clock"
        />
        <StatCard
          title="Mahasiswa Berisiko"
          value={recipients.filter((r) => r.is_berisiko).length.toString()}
          description="Perlu atensi dosen verifikator"
          icon="AlertTriangle"
        />
      </div>

      {/* Filter and Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'AKTIF', 'SELESAI', 'DICABUT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedStatus === st
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'Semua Status' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          data={filteredRecipients}
          columns={columns}
          searchPlaceholder="Cari mahasiswa, NIM, atau jenis beasiswa..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Tambah Penerima Beasiswa (FR-05) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Mahasiswa Penerima Beasiswa (FR-05)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Admin Prodi menyimpan data mahasiswa penerima beasiswa beserta kewajiban jam karya per semester.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa *</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="2302010..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Angkatan</label>
              <input
                type="number"
                value={angkatan}
                onChange={(e) => setAngkatan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kewajiban Jam Karya *</label>
              <input
                type="number"
                value={kewajibanJam}
                onChange={(e) => setKewajibanJam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Beasiswa *</label>
            <input
              type="text"
              value={jenisBeasiswa}
              onChange={(e) => setJenisBeasiswa(e.target.value)}
              placeholder="Contoh: KIP Kuliah, Beasiswa Bank Indonesia"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lembaga Pemberi Beasiswa *</label>
            <input
              type="text"
              value={pemberi}
              onChange={(e) => setPemberi(e.target.value)}
              placeholder="Contoh: Kemendikbudristek, Bank Indonesia, Djarum Foundation"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Periode Semester</label>
            <input
              type="text"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleAddRecipient}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Simpan Penerima Beasiswa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

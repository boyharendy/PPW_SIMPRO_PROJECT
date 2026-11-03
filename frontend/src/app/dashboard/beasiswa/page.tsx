'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockScholarshipRecipients, mockScholarshipWorkLogs } from '@/lib/mock-data';
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
  Filter,
  Eye,
  CheckCircle,
  Building,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default function BeasiswaListPage() {
  const { currentRole } = useUser();
  const [recipients, setRecipients] = useState<ScholarshipRecipient[]>(mockScholarshipRecipients);
  const [selectedRecipient, setSelectedRecipient] = useState<ScholarshipRecipient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [angkatan, setAngkatan] = useState('2023');
  const [prodi, setProdi] = useState('Sistem Informasi');
  const [jenisBeasiswa, setJenisBeasiswa] = useState('KIP Kuliah Merdeka');
  const [pemberi, setPemberi] = useState('Puslapdik Kemendikbudristek');
  const [periode, setPeriode] = useState('2024/2025 Ganjil');
  const [kewajibanJam, setKewajibanJam] = useState('50');
  const [dosenVerifikatorNama, setDosenVerifikatorNama] = useState('Dr. Ahmad Fauzi, M.T.');

  // Edit status state inside modal detail
  const [editingStatus, setEditingStatus] = useState<ScholarshipStatus>('AKTIF');

  const filteredRecipients = recipients.filter((r) => {
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchJenis = selectedJenis === 'ALL' || r.jenis_beasiswa.toLowerCase().includes(selectedJenis.toLowerCase());
    return matchStatus && matchJenis;
  });

  const handleAddRecipient = () => {
    if (!nim || !nama) return;
    const newRec: ScholarshipRecipient = {
      id: `sch-rec-${Date.now()}`,
      mahasiswa_nim: nim,
      mahasiswa_nama: nama,
      angkatan: parseInt(angkatan) || 2023,
      program_studi: prodi || 'Sistem Informasi',
      jenis_beasiswa: jenisBeasiswa,
      pemberi_beasiswa: pemberi,
      periode,
      kewajiban_jam: parseInt(kewajibanJam) || 50,
      jam_terverifikasi: 0,
      jam_menunggu: 0,
      status: 'AKTIF',
      dosen_verifikator_id: 'u-kaprodi',
      dosen_verifikator_nama: dosenVerifikatorNama,
      is_berisiko: false,
      created_at: new Date().toISOString(),
    };

    setRecipients([newRec, ...recipients]);
    setShowAddModal(false);
    setNim('');
    setNama('');
    setNotification(`Mahasiswa ${nama} (${nim}) berhasil ditambahkan sebagai penerima ${jenisBeasiswa}.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpdateStatus = () => {
    if (!selectedRecipient) return;
    setRecipients(
      recipients.map((r) =>
        r.id === selectedRecipient.id
          ? {
              ...r,
              status: editingStatus,
            }
          : r
      )
    );
    setSelectedRecipient({
      ...selectedRecipient,
      status: editingStatus,
    });
    setNotification(`Status beasiswa mahasiswa ${selectedRecipient.mahasiswa_nama} berhasil diperbarui menjadi ${editingStatus}.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penerima',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}
          </p>
        </div>
      ),
    },
    {
      key: 'beasiswa',
      header: 'Jenis & Pemberi Beasiswa',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-700 text-xs">{row.jenis_beasiswa}</span>
          <p className="text-[11px] text-slate-500">{row.pemberi_beasiswa}</p>
        </div>
      ),
    },
    {
      key: 'verifikator',
      header: 'Periode & Dosen Verifikator',
      render: (row: ScholarshipRecipient) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-slate-700">{row.periode}</span>
          <p className="text-[11px] text-slate-500">Verifikator: {row.dosen_verifikator_nama}</p>
        </div>
      ),
    },
    {
      key: 'progres',
      header: 'Pemenuhan Jam Karya',
      render: (row: ScholarshipRecipient) => {
        const percent = Math.min(100, Math.round((row.jam_terverifikasi / row.kewajiban_jam) * 100));
        return (
          <div className="space-y-1.5 min-w-[160px]">
            <div className="flex items-center justify-between text-xs">
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
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
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
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: ScholarshipRecipient) => (
        <button
          onClick={() => {
            setSelectedRecipient(row);
            setEditingStatus(row.status);
          }}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Detail</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Penerima Beasiswa & Jam Karya"
        description="Pusat pengelolaan mahasiswa penerima beasiswa prodi, alokasi dosen verifikator, pemantauan jam karya mandiri, serta deteksi dini mahasiswa berisiko tidak memenuhi kewajiban."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/beasiswa/rekap"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <PieChart className="h-4 w-4 text-blue-600" />
              <span>Rekap Pemenuhan Jam</span>
            </Link>
            <Link
              href="/dashboard/beasiswa/verifikasi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <span>Verifikasi Jam Karya</span>
            </Link>
            {(currentRole === 'MAHASISWA' || currentRole === 'KAPRODI') && (
              <Link
                href="/dashboard/beasiswa/jam-karya"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-xs transition-colors"
              >
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Pencatatan Mandiri</span>
              </Link>
            )}
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

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-500 hover:text-emerald-800 font-bold ml-2">×</button>
        </div>
      )}

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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Filter:
            </span>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
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

            {/* Jenis Beasiswa Filter */}
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">Semua Jenis Beasiswa</option>
              <option value="KIP Kuliah">KIP Kuliah Merdeka</option>
              <option value="Bank Indonesia">Bank Indonesia</option>
              <option value="Djarum">Djarum Beasiswa Plus</option>
              <option value="Industri">Industri / Lainnya</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Menampilkan <strong>{filteredRecipients.length}</strong> mahasiswa penerima
          </p>
        </div>

        <DataTable
          data={filteredRecipients}
          columns={columns}
          searchPlaceholder="Cari mahasiswa, NIM, atau jenis beasiswa..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Detail Profil Mahasiswa Penerima Beasiswa */}
      {selectedRecipient && (
        <Modal
          isOpen={!!selectedRecipient}
          onClose={() => setSelectedRecipient(null)}
          title={`Profil Beasiswa — ${selectedRecipient.mahasiswa_nama}`}
        >
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedRecipient.mahasiswa_nama}</h4>
                <p className="text-slate-500 text-xs font-mono">
                  NIM: {selectedRecipient.mahasiswa_nim} • Angkatan {selectedRecipient.angkatan} • {selectedRecipient.program_studi}
                </p>
              </div>
              <StatusBadge status={selectedRecipient.status} size="md" />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div>
                <span className="text-lg font-black text-slate-800">{selectedRecipient.kewajiban_jam}</span>
                <p className="text-[10px] text-slate-500 font-semibold">Kewajiban Jam</p>
              </div>
              <div>
                <span className="text-lg font-black text-emerald-600">{selectedRecipient.jam_terverifikasi}</span>
                <p className="text-[10px] text-slate-500 font-semibold">Disetujui Dosen</p>
              </div>
              <div>
                <span className="text-lg font-black text-amber-600">{selectedRecipient.jam_menunggu}</span>
                <p className="text-[10px] text-slate-500 font-semibold">Menunggu Verifikasi</p>
              </div>
              <div>
                <span className="text-lg font-black text-slate-700">
                  {Math.max(0, selectedRecipient.kewajiban_jam - selectedRecipient.jam_terverifikasi)}
                </span>
                <p className="text-[10px] text-slate-500 font-semibold">Sisa Jam</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <p className="text-slate-700"><strong>Jenis Beasiswa:</strong> {selectedRecipient.jenis_beasiswa}</p>
                <p className="text-slate-700"><strong>Lembaga Pemberi:</strong> {selectedRecipient.pemberi_beasiswa}</p>
                <p className="text-slate-700"><strong>Periode Terdata:</strong> {selectedRecipient.periode}</p>
                <p className="text-slate-700"><strong>Dosen Verifikator Pembina:</strong> {selectedRecipient.dosen_verifikator_nama}</p>
              </div>

              {selectedRecipient.is_berisiko && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800">
                    <p className="font-bold">Peringatan Risiko Jam Karya!</p>
                    <p className="mt-0.5">
                      Mahasiswa ini memiliki tingkat penyelesaian jam karya yang rendah menjelang akhir periode semester. Dosen verifikator disarankan mengirimkan notifikasi teguran.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Update Control for Admin / Kaprodi */}
              {(currentRole === 'ADMIN_PRODI' || currentRole === 'KAPRODI') && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800 block text-xs">Ubah Status Penerima Beasiswa:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as ScholarshipStatus)}
                      className="rounded-lg border border-slate-300 p-1.5 text-xs bg-white font-medium text-slate-800"
                    >
                      <option value="AKTIF">AKTIF (Sedang Menjalankan)</option>
                      <option value="SELESAI">SELESAI (Kewajiban Terpenuhi)</option>
                      <option value="DICABUT">DICABUT (Sanksi / Tidak Memenuhi)</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecipient(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Tambah Penerima Beasiswa */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Mahasiswa Penerima Beasiswa"
      >
        <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Admin Prodi menyimpan data mahasiswa penerima beasiswa beserta kewajiban jam karya per semester dan menetapkan dosen verifikator.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa *</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="2302010..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Lengkap Mahasiswa"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
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
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kewajiban Jam Karya *</label>
              <input
                type="number"
                value={kewajibanJam}
                onChange={(e) => setKewajibanJam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Beasiswa *</label>
            <input
              type="text"
              value={jenisBeasiswa}
              onChange={(e) => setJenisBeasiswa(e.target.value)}
              placeholder="Contoh: KIP Kuliah Merdeka, Beasiswa Bank Indonesia"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lembaga Pemberi Beasiswa *</label>
            <input
              type="text"
              value={pemberi}
              onChange={(e) => setPemberi(e.target.value)}
              placeholder="Contoh: Kemendikbudristek, Bank Indonesia, Djarum Foundation"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periode Semester</label>
              <input
                type="text"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dosen Verifikator Pembina</label>
              <select
                value={dosenVerifikatorNama}
                onChange={(e) => setDosenVerifikatorNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="Dr. Ahmad Fauzi, M.T.">Dr. Ahmad Fauzi, M.T.</option>
                <option value="Siti Rahmawati, M.Kom.">Siti Rahmawati, M.Kom.</option>
                <option value="Dr. Ir. Hendra Gunawan">Dr. Ir. Hendra Gunawan</option>
              </select>
            </div>
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
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              Simpan Penerima Beasiswa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockUkmDirectories } from '@/lib/mock-data';
import type { UkmDirectory, UkmCategory } from '@/lib/types';
import {
  Compass,
  Users,
  Trophy,
  Plus,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  PieChart,
  UserCheck,
  Eye,
} from 'lucide-react';

export default function UkmListPage() {
  const { currentRole } = useUser();
  const [ukms, setUkms] = useState<UkmDirectory[]>(mockUkmDirectories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUkm, setSelectedUkm] = useState<UkmDirectory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states (FR-14)
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [kategori, setKategori] = useState<UkmCategory>('PENALARAN');
  const [pembina, setPembina] = useState('Dr. Ahmad Fauzi, M.T.');
  const [ketuaNim, setKetuaNim] = useState('');
  const [ketuaNama, setKetuaNama] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [instagram, setInstagram] = useState('');
  const [jadwal, setJadwal] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const filteredUkms = ukms.filter((u) => {
    return selectedCategory === 'ALL' || u.kategori === selectedCategory;
  });

  const handleAddUkm = () => {
    if (!nama || !ketuaNama) return;

    const newUkm: UkmDirectory = {
      id: `ukm-${Date.now()}`,
      kode_ukm: kode || `UKM-${kategori.substring(0, 3)}-${Date.now().toString().slice(-2)}`,
      nama_ukm: nama,
      kategori,
      dosen_pembina_id: 'u-kaprodi',
      dosen_pembina_nama: pembina,
      ketua_nim: ketuaNim || '220101001',
      ketua_nama: ketuaNama,
      kontak_email: email || `${nama.toLowerCase().replace(/\s+/g, '')}@univ.ac.id`,
      kontak_telepon: telepon || '081234567890',
      kontak_instagram: instagram || `@${nama.toLowerCase().replace(/\s+/g, '')}`,
      deskripsi: deskripsi || 'Unit kegiatan mahasiswa aktif binaan program studi.',
      jadwal_rutin: jadwal || 'Setiap akhir pekan di kampus',
      status_aktif: 'AKTIF',
      jumlah_anggota_aktif: 1,
      created_at: new Date().toISOString(),
    };

    setUkms([newUkm, ...ukms]);
    setShowAddModal(false);
    setNama('');
    setKode('');
    setKetuaNim('');
    setKetuaNama('');
    setDeskripsi('');
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama UKM & Kode',
      render: (row: UkmDirectory) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-xs sm:text-sm">{row.nama_ukm}</span>
          <p className="text-[11px] text-slate-500 font-mono">{row.kode_ukm}</p>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (row: UkmDirectory) => (
        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
          {row.kategori}
        </span>
      ),
    },
    {
      key: 'pembina',
      header: 'Dosen Pembina & Ketua',
      render: (row: UkmDirectory) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800">Pembina: {row.dosen_pembina_nama}</p>
          <p className="text-[11px] text-slate-500">Ketua: {row.ketua_nama} ({row.ketua_nim})</p>
        </div>
      ),
    },
    {
      key: 'anggota',
      header: 'Anggota Aktif',
      render: (row: UkmDirectory) => (
        <span className="font-extrabold text-blue-700 text-xs sm:text-sm">
          {row.jumlah_anggota_aktif} Mahasiswa
        </span>
      ),
    },
    {
      key: 'jadwal',
      header: 'Jadwal Rutin',
      render: (row: UkmDirectory) => (
        <span className="text-xs text-slate-600 line-clamp-1">{row.jadwal_rutin}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: UkmDirectory) => <StatusBadge status={row.status_aktif} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: UkmDirectory) => (
        <button
          onClick={() => setSelectedUkm(row)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Profil</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modul 4: Unit Kegiatan Mahasiswa (UKM)"
        description="Direktori resmi UKM prodi (FR-14), pendaftaran dan verifikasi keanggotaan mahasiswa (FR-15), serta rekapitulasi partisipasi per angkatan (FR-16)."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ukm/keanggotaan"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span>Keanggotaan UKM</span>
            </Link>
            <Link
              href="/dashboard/ukm/rekap"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <PieChart className="h-4 w-4 text-emerald-600" />
              <span>Rekap Partisipasi</span>
            </Link>
            {(currentRole === 'ADMIN_PRODI' || currentRole === 'DOSEN_PEMBINA' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah UKM Baru</span>
              </button>
            )}
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total UKM Terdaftar"
          value={ukms.length.toString()}
          description="Direktori aktif prodi"
          icon="Compass"
        />
        <StatCard
          title="Total Anggota Aktif"
          value={ukms.reduce((acc, u) => acc + u.jumlah_anggota_aktif, 0).toString()}
          description="Mahasiswa terlibat kegiatan"
          icon="Users"
        />
        <StatCard
          title="Kategori Penalaran"
          value={ukms.filter((u) => u.kategori === 'PENALARAN').length.toString()}
          description="Fokus riset & kompetisi IT"
          icon="Trophy"
        />
        <StatCard
          title="Status Keaktifan"
          value="100% Aktif"
          description="Berjalan di semester ini"
          icon="CheckCircle2"
        />
      </div>

      {/* Filter and Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kategori:</span>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'PENALARAN', 'OLAHRAGA', 'SENI', 'KEAGAMAAN'].map((kat) => (
                <button
                  key={kat}
                  onClick={() => setSelectedCategory(kat)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedCategory === kat
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {kat === 'ALL' ? 'Semua' : kat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          data={filteredUkms}
          columns={columns}
          searchPlaceholder="Cari UKM, pembina, atau ketua..."
          searchKey="nama_ukm"
        />
      </div>

      {/* MODAL: Tambah UKM Baru (FR-14) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Registrasi Direktori UKM Baru (FR-14)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Admin Prodi atau Dosen Pembina menambahkan entitas UKM resmi program studi beserta informasi kepengurusan dan kontaknya.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama UKM *</label>
              <input
                type="text"
                placeholder="Contoh: Mobile App Developer Club"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode UKM</label>
              <input
                type="text"
                placeholder="UKM-PEN-05"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori UKM *</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as UkmCategory)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="PENALARAN">Penalaran & Riset</option>
                <option value="OLAHRAGA">Olahraga</option>
                <option value="SENI">Seni & Kreativitas</option>
                <option value="KEAGAMAAN">Keagamaan</option>
                <option value="SOSIAL">Sosial & Lingkungan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dosen Pembina UKM *</label>
              <input
                type="text"
                value={pembina}
                onChange={(e) => setPembina(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Ketua UKM</label>
              <input
                type="text"
                placeholder="2201010..."
                value={ketuaNim}
                onChange={(e) => setKetuaNim(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ketua UKM *</label>
              <input
                type="text"
                placeholder="Nama Mahasiswa"
                value={ketuaNama}
                onChange={(e) => setKetuaNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                placeholder="ukm@univ.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telepon / WhatsApp</label>
              <input
                type="text"
                placeholder="0812..."
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instagram</label>
              <input
                type="text"
                placeholder="@nama_ukm"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jadwal Rutin Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Setiap Sabtu pukul 13.00 WIB di Ruang Diskusi"
              value={jadwal}
              onChange={(e) => setJadwal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat UKM</label>
            <textarea
              rows={2}
              placeholder="Jelaskan tujuan dan fokus kegiatan UKM..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
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
              onClick={handleAddUkm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Simpan UKM
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Profil Detail UKM */}
      {selectedUkm && (
        <Modal
          isOpen={!!selectedUkm}
          onClose={() => setSelectedUkm(null)}
          title={`Profil UKM: ${selectedUkm.nama_ukm}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="font-mono text-xs text-blue-600 font-bold">{selectedUkm.kode_ukm}</p>
                <h4 className="font-bold text-slate-900 text-base">{selectedUkm.nama_ukm}</h4>
              </div>
              <StatusBadge status={selectedUkm.status_aktif} size="md" />
            </div>

            <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              {selectedUkm.deskripsi}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-500 block">Dosen Pembina:</span>
                <p className="font-bold text-slate-800">{selectedUkm.dosen_pembina_nama}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-500 block">Ketua Pengurus:</span>
                <p className="font-bold text-slate-800">{selectedUkm.ketua_nama} ({selectedUkm.ketua_nim})</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-xs">
              <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-700" />
                Jadwal Latihan / Pertemuan Rutin:
              </span>
              <p className="text-blue-800">{selectedUkm.jadwal_rutin}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {selectedUkm.kontak_email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {selectedUkm.kontak_telepon}
              </span>
              {selectedUkm.kontak_instagram && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  {selectedUkm.kontak_instagram}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedUkm(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

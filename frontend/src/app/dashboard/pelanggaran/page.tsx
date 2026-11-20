'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockStudentViolations } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type {
  StudentViolation,
  ViolationType,
  ViolationLevel,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  Plus,
  Eye,
  FileCheck,
  FileText,
  CheckCircle,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  AKADEMIK: 'Akademik',
  NON_AKADEMIK: 'Non-Akademik',
  KODE_ETIK: 'Kode Etik',
};

export default function DataPelanggaranPage() {
  const { currentRole } = useUser();
  const [violations, setViolations] = useState<StudentViolation[]>(mockStudentViolations);
  const [selectedViolation, setSelectedViolation] = useState<StudentViolation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Add violation form state
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [angkatan, setAngkatan] = useState('2022');
  const [tanggalPelanggaran, setTanggalPelanggaran] = useState('2024-11-01');
  const [jenis, setJenis] = useState<ViolationType>('AKADEMIK');
  const [tingkat, setTingkat] = useState<ViolationLevel>('RINGAN');
  const [judulKasus, setJudulKasus] = useState('');
  const [uraian, setUraian] = useState('');
  const [dasarKeputusan, setDasarKeputusan] = useState('');
  const [totalJamSanksi, setTotalJamSanksi] = useState('12');

  useEffect(() => {
    const sync = () => {
      setViolations(
        storageSync.get<StudentViolation[]>(STORAGE_KEYS.VIOLATIONS, mockStudentViolations)
      );
    };
    sync();
    window.addEventListener('simpro_storage_change', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('simpro_storage_change', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const filteredViolations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return violations.filter((v) => {
      const matchStatus = filterStatus === 'ALL' || v.status_sanksi === filterStatus;
      const matchType = filterType === 'ALL' || v.jenis_pelanggaran === filterType;
      const matchSearch =
        !q ||
        v.mahasiswa_nama.toLowerCase().includes(q) ||
        v.mahasiswa_nim.toLowerCase().includes(q) ||
        v.judul_kasus.toLowerCase().includes(q) ||
        v.dasar_keputusan.toLowerCase().includes(q);
      return matchStatus && matchType && matchSearch;
    });
  }, [violations, filterStatus, filterType, searchQuery]);

  const handleAddViolation = (e: React.FormEvent) => {
    e.preventDefault();
    const jam = parseInt(totalJamSanksi, 10);
    if (!nim.trim() || !nama.trim() || !judulKasus.trim() || !dasarKeputusan.trim()) {
      setFormError('Mohon lengkapi NIM, nama mahasiswa, judul kasus, dan nomor SK keputusan.');
      return;
    }
    if (isNaN(jam) || jam <= 0) {
      setFormError('Total jam sanksi harus lebih dari 0.');
      return;
    }

    const newViolation: StudentViolation = {
      id: `vio-${Date.now()}`,
      mahasiswa_nim: nim.trim(),
      mahasiswa_nama: nama.trim(),
      angkatan: parseInt(angkatan, 10) || 2022,
      status_mahasiswa: 'AKTIF',
      tanggal_pelanggaran: tanggalPelanggaran,
      jenis_pelanggaran: jenis,
      tingkat,
      judul_kasus: judulKasus.trim(),
      uraian: uraian.trim() || judulKasus.trim(),
      dasar_keputusan: dasarKeputusan.trim(),
      total_jam_sanksi: jam,
      jam_sanksi_terpenuhi: 0,
      status_sanksi: 'BELUM_DIMULAI',
      dosen_pencatat_id: 'u-kaprodi',
      dosen_pencatat_nama: 'Dr. Ahmad Fauzi, M.T.',
      dosen_wali_id: 'u-kaprodi',
      dosen_wali_nama: 'Dr. Ahmad Fauzi, M.T.',
      dosen_verifikator_id: 'u-kaprodi',
      dosen_verifikator_nama: 'Dr. Ahmad Fauzi, M.T.',
      created_at: new Date().toISOString(),
    };

    const updated = storageSync.prepend(
      STORAGE_KEYS.VIOLATIONS,
      newViolation,
      mockStudentViolations
    );
    setViolations(updated);
    setShowAddModal(false);
    setFormError(null);
    setNim('');
    setNama('');
    setJudulKasus('');
    setUraian('');
    setDasarKeputusan('');
    setTotalJamSanksi('12');
    setNotification(
      `Rekaman pelanggaran untuk ${newViolation.mahasiswa_nama} (${newViolation.total_jam_sanksi} Jam) berhasil disimpan.`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  const columns: DataTableColumn<StudentViolation>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            {row.mahasiswa_nama}
          </span>
          <p className="text-[11px] text-slate-500 font-mono">
            NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}
          </p>
        </div>
      ),
    },
    {
      key: 'kasus',
      header: 'Kasus & Dasar Keputusan',
      render: (row) => (
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
              {VIOLATION_TYPE_LABELS[row.jenis_pelanggaran]}
            </span>
            <StatusBadge status={row.tingkat} size="sm" />
          </div>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
            {row.judul_kasus}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">{row.dasar_keputusan}</p>
        </div>
      ),
    },
    {
      key: 'progres',
      header: 'Pemenuhan Sanksi',
      render: (row) => {
        const pct =
          row.total_jam_sanksi > 0
            ? Math.min(100, Math.round((row.jam_sanksi_terpenuhi / row.total_jam_sanksi) * 100))
            : 0;
        return (
          <div className="space-y-1.5 min-w-[150px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {row.jam_sanksi_terpenuhi} / {row.total_jam_sanksi} Jam
              </span>
              <span
                className={`font-semibold ${
                  pct >= 100 ? 'text-emerald-600' : 'text-blue-600'
                }`}
              >
                {pct}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status_sanksi',
      header: 'Status Sanksi',
      render: (row) => <StatusBadge status={row.status_sanksi} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedViolation(row)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Detail</span>
        </button>
      ),
    },
  ];

  const totalHoursAll = violations.reduce((acc, v) => acc + v.total_jam_sanksi, 0);
  const inProgressCount = violations.filter((v) => v.status_sanksi === 'DALAM_PROSES').length;
  const doneCount = violations.filter((v) => v.status_sanksi === 'SELESAI').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Pelanggaran & Sanksi Sosial"
        description="Pengelolaan catatan pelanggaran akademik, non-akademik, dan kode etik mahasiswa beserta penetapan serta pemantauan pemenuhan jam sanksi sosial."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {currentRole === 'DOSEN_WALI' && (
              <Link
                href="/dashboard/pelanggaran/verifikasi"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
              >
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span>Verifikasi Sanksi</span>
              </Link>
            )}
            {currentRole === 'KAPRODI' && (
              <Link
                href="/dashboard/pelanggaran/retensi"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Log Retensi (UU PDP)</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Pelanggaran</span>
            </button>
          </div>
        }
      />

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kasus Tercatat"
          value={violations.length.toString()}
          description="Rekaman pelanggaran aktif"
          icon={<ShieldAlert size={16} />}
          badgeTone="rose"
        />
        <StatCard
          title="Dalam Proses Sanksi"
          value={inProgressCount.toString()}
          description="Sedang menjalani jam sosial"
          icon={<Clock size={16} />}
          badgeTone="amber"
        />
        <StatCard
          title="Sanksi Tuntas"
          value={doneCount.toString()}
          description="Kewajiban jam terpenuhi 100%"
          icon={<CheckCircle2 size={16} />}
          badgeTone="emerald"
        />
        <StatCard
          title="Akumulasi Jam Sanksi"
          value={`${totalHoursAll} Jam`}
          description="Total kewajiban seluruh kasus"
          icon={<AlertTriangle size={16} />}
          badgeTone="blue"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'BELUM_DIMULAI', 'DALAM_PROSES', 'SELESAI'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Semua Status'
                    : st === 'BELUM_DIMULAI'
                      ? 'Belum Dimulai'
                      : st === 'DALAM_PROSES'
                        ? 'Dalam Proses'
                        : 'Selesai'}
                </button>
              ))}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
            >
              <option value="ALL">Semua Jenis Pelanggaran</option>
              <option value="AKADEMIK">Pelanggaran Akademik</option>
              <option value="NON_AKADEMIK">Pelanggaran Non-Akademik</option>
              <option value="KODE_ETIK">Pelanggaran Kode Etik</option>
            </select>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mahasiswa, NIM, atau kasus..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <DataTable
          data={filteredViolations}
          columns={columns}
          emptyMessage="Tidak ada data pelanggaran untuk filter yang dipilih."
        />
      </div>

      {/* MODAL: Detail Pelanggaran */}
      {selectedViolation && (
        <Modal
          isOpen={!!selectedViolation}
          onClose={() => setSelectedViolation(null)}
          title={`Detail Kasus — ${selectedViolation.mahasiswa_nama}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedViolation.mahasiswa_nama}
                </h4>
                <p className="text-slate-500 text-xs font-mono">
                  NIM: {selectedViolation.mahasiswa_nim} • Angkatan {selectedViolation.angkatan}
                </p>
              </div>
              <StatusBadge status={selectedViolation.status_sanksi} size="md" />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700">
                  {VIOLATION_TYPE_LABELS[selectedViolation.jenis_pelanggaran]}
                </span>
                <StatusBadge status={selectedViolation.tingkat} size="sm" />
                <span className="font-mono text-slate-600">
                  SK: {selectedViolation.dasar_keputusan}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {selectedViolation.judul_kasus}
              </p>
              <p className="text-slate-700 leading-relaxed">{selectedViolation.uraian}</p>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                <span>
                  Tanggal: <strong>{formatDate(selectedViolation.tanggal_pelanggaran)}</strong>
                </span>
                <span>
                  Kewajiban:{' '}
                  <strong>
                    {selectedViolation.jam_sanksi_terpenuhi} / {selectedViolation.total_jam_sanksi} Jam
                  </strong>
                </span>
                <span>
                  Dosen Wali: <strong>{selectedViolation.dosen_wali_nama}</strong>
                </span>
                <span>
                  Verifikator: <strong>{selectedViolation.dosen_verifikator_nama}</strong>
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedViolation(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Tambah Pelanggaran */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Pelanggaran & Penetapan Sanksi"
      >
        <form onSubmit={handleAddViolation} className="space-y-3.5 text-xs sm:text-sm">
          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIM Mahasiswa *
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="2201010..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Mahasiswa *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap mahasiswa"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Kejadian
              </label>
              <input
                type="date"
                value={tanggalPelanggaran}
                onChange={(e) => setTanggalPelanggaran(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Jam Sanksi *
              </label>
              <input
                type="number"
                min="1"
                value={totalJamSanksi}
                onChange={(e) => setTotalJamSanksi(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Pelanggaran
              </label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as ViolationType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="AKADEMIK">Akademik</option>
                <option value="NON_AKADEMIK">Non-Akademik</option>
                <option value="KODE_ETIK">Kode Etik</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Pelanggaran
              </label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value as ViolationLevel)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="RINGAN">Ringan</option>
                <option value="SEDANG">Sedang</option>
                <option value="BERAT">Berat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Berita Acara / Dasar Keputusan *
            </label>
            <input
              type="text"
              value={dasarKeputusan}
              onChange={(e) => setDasarKeputusan(e.target.value)}
              placeholder="Contoh: BA-KOMISI-ETIK/2024/XI/004"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Kasus Pelanggaran *
            </label>
            <input
              type="text"
              value={judulKasus}
              onChange={(e) => setJudulKasus(e.target.value)}
              placeholder="Ringkasan kasus pelanggaran"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Uraian Kronologi &amp; Ketentuan Sanksi
            </label>
            <textarea
              rows={3}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Jelaskan kronologi pelanggaran dan bentuk sanksi sosial yang ditetapkan..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Simpan Catatan Pelanggaran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

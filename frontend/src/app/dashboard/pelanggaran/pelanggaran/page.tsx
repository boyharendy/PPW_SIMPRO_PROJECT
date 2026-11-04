'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { mockStudentViolations } from '@/lib/mock-data';
import type { StudentViolation, ViolationType, ViolationLevel } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Lock,
  Eye,
  FileText,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

export default function PelanggaranListPage() {
  const { currentRole } = useUser();
  const [violations, setViolations] = useState<StudentViolation[]>(mockStudentViolations);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<StudentViolation | null>(null);

  // Form states (FR-09)
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [angkatan, setAngkatan] = useState('2023');
  const [tanggal, setTanggal] = useState('2024-11-03');
  const [jenis, setJenis] = useState<ViolationType>('AKADEMIK');
  const [tingkat, setTingkat] = useState<ViolationLevel>('SEDANG');
  const [judul, setJudul] = useState('');
  const [uraian, setUraian] = useState('');
  const [dasarKeputusan, setDasarKeputusan] = useState('');
  const [jamSanksi, setJamSanksi] = useState('15');

  // Strict Access Restriction Check (FR-12 & NF-03)
  const isAuthorizedLecturer =
    currentRole === 'KAPRODI' ||
    currentRole === 'DOSEN' ||
    currentRole === 'DOSEN_WALI' ||
    currentRole === 'DOSEN_VERIFIKATOR';

  const handleAddViolation = () => {
    if (!nim || !nama || !judul || !dasarKeputusan) return;
    const totalJam = parseInt(jamSanksi) || 10;

    const newViolation: StudentViolation = {
      id: `vio-${Date.now()}`,
      mahasiswa_nim: nim,
      mahasiswa_nama: nama,
      angkatan: parseInt(angkatan) || 2023,
      status_mahasiswa: 'AKTIF',
      tanggal_pelanggaran: tanggal,
      jenis_pelanggaran: jenis,
      tingkat: tingkat,
      judul_kasus: judul,
      uraian: uraian || 'Tercatat pelanggaran tata tertib mahasiswa.',
      dasar_keputusan: dasarKeputusan,
      total_jam_sanksi: totalJam,
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

    setViolations([newViolation, ...violations]);
    setShowAddModal(false);
    setNim('');
    setNama('');
    setJudul('');
    setUraian('');
    setDasarKeputusan('');
  };

  const columns = [
    {
      key: 'kasus',
      header: 'Kasus Pelanggaran & Nomor BA',
      render: (row: StudentViolation) => (
        <div className="space-y-1">
          <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{row.judul_kasus}</p>
          <p className="text-[11px] text-slate-500 font-mono">
            Dasar: <strong className="text-slate-700">{row.dasar_keputusan}</strong> • Tgl: {formatDate(row.tanggal_pelanggaran)}
          </p>
        </div>
      ),
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Terkait',
      render: (row: StudentViolation) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500">NIM: {row.mahasiswa_nim} • Angkatan {row.angkatan}</p>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Jenis & Tingkat',
      render: (row: StudentViolation) => (
        <div className="space-y-1">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {row.jenis_pelanggaran.replace('_', ' ')}
          </span>
          <div>
            <StatusBadge status={row.tingkat} size="sm" />
          </div>
        </div>
      ),
    },
    {
      key: 'sanksi',
      header: 'Sanksi Sosial (Jam)',
      render: (row: StudentViolation) => {
        const sisa = Math.max(0, row.total_jam_sanksi - row.jam_sanksi_terpenuhi);
        const pct = Math.min(100, Math.round((row.jam_sanksi_terpenuhi / row.total_jam_sanksi) * 100));
        return (
          <div className="space-y-1 min-w-[130px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {row.jam_sanksi_terpenuhi} / {row.total_jam_sanksi} Jam
              </span>
              <span className="font-semibold text-slate-500">{pct}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Sisa: <strong className="text-amber-700">{sisa} Jam</strong></p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Sanksi',
      render: (row: StudentViolation) => <StatusBadge status={row.status_sanksi} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: StudentViolation) => (
        <button
          onClick={() => setSelectedViolation(row)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Detail</span>
        </button>
      ),
    },
  ];

  // If user role is NOT authorized (e.g. ADMIN_PRODI or unrelated roles per FR-12)
  if (!isAuthorizedLecturer && currentRole !== 'MAHASISWA') {
    return (
      <div className="p-8 rounded-xl border border-rose-200 bg-rose-50 text-center max-w-2xl mx-auto my-12 space-y-4">
        <Lock className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Akses Dibatasi — Kebutuhan Fungsional FR-12 & NF-03</h3>
        <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
          Sesuai spesifikasi SKPL (FR-12 & NF-03) dan UU Perlindungan Data Pribadi No. 27/2022, data pelanggaran mahasiswa bersifat rahasia dan <strong>HANYA DAPAT DIAKSES</strong> oleh mahasiswa yang bersangkutan dan dosen terkait (Dosen Wali, Dosen Pencatat, Dosen Verifikator, dan Kaprodi). Admin Prodi dan pihak lain tidak memiliki hak akses terhadap data ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modul 3: Pelanggaran & Jam Sanksi Sosial"
        description="Pencatatan pelanggaran oleh dosen berwenang (FR-09), pembatasan akses data (FR-12), dan monitoring penyelesaian sanksi sosial mahasiswa (FR-11)."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/pelanggaran/sanksi-saya"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Sanksi Sosial Saya</span>
            </Link>
            <Link
              href="/dashboard/pelanggaran/verifikasi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Verifikasi Pelaksanaan Sanksi</span>
            </Link>
            <Link
              href="/dashboard/pelanggaran/retensi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span>Log Retensi (UU PDP)</span>
            </Link>
            {isAuthorizedLecturer && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Catat Pelanggaran</span>
              </button>
            )}
          </div>
        }
      />

      {/* Security Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
        <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <span>
          <strong>Kerahasiaan Data Terjamin (FR-12 & NF-03):</strong> Data pada modul ini dienkripsi dan hanya dapat dilihat oleh Dosen Wali, Dosen Verifikator, Kaprodi, dan mahasiswa terkait.
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kasus Pelanggaran"
          value={violations.length.toString()}
          description="Semester Ganjil 2024/2025"
          icon="ShieldAlert"
        />
        <StatCard
          title="Sanksi Sedang Berjalan"
          value={violations.filter((v) => v.status_sanksi === 'DALAM_PROSES').length.toString()}
          description="Mahasiswa menjalankan jam sanksi"
          icon="Clock"
        />
        <StatCard
          title="Sanksi Tuntas (Selesai)"
          value={violations.filter((v) => v.status_sanksi === 'SELESAI').length.toString()}
          description="Seluruh jam sanksi terpenuhi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Tingkat Berat / BA Resmi"
          value={violations.filter((v) => v.tingkat === 'BERAT').length.toString()}
          description="Tercatat dalam SK Rektor/Dekan"
          icon="AlertTriangle"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Daftar Pelanggaran & Status Jam Sanksi Sosial</h3>
        <DataTable
          data={violations}
          columns={columns}
          searchPlaceholder="Cari kasus, nomor BA, atau mahasiswa..."
          searchKey="judul_kasus"
        />
      </div>

      {/* MODAL: Catat Pelanggaran (FR-09) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Pelanggaran Mahasiswa (FR-09)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Dosen yang berwenang (Kaprodi atau dosen yang ditunjuk) mencatat pelanggaran mahasiswa, jenis/tingkat pelanggaran, nomor berita acara keputusan, dan beban jam sanksi sosial.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa *</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="2201010..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama Mahasiswa"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
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
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kejadian *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Sanksi Sosial *</label>
              <input
                type="number"
                value={jamSanksi}
                onChange={(e) => setJamSanksi(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pelanggaran *</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value as ViolationType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="AKADEMIK">Akademik (Plagiarisme, Kecurangan Ujian)</option>
                <option value="NON_AKADEMIK">Non-Akademik (Tata Tertib, Fasilitas)</option>
                <option value="KODE_ETIK">Kode Etik Perilaku Mahasiswa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Pelanggaran *</label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value as ViolationLevel)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="RINGAN">Ringan (Teguran & Sanksi Ringan)</option>
                <option value="SEDANG">Sedang (Jam Sanksi Sosial 10–30 Jam)</option>
                <option value="BERAT">Berat (Sanksi Sosial & Peringatan Tertulis)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Berita Acara / Dasar Keputusan *</label>
            <input
              type="text"
              value={dasarKeputusan}
              onChange={(e) => setDasarKeputusan(e.target.value)}
              placeholder="Contoh: BA-KOMISI-ETIK/2024/X/012"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Pokok Kasus *</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Ringkasan singkat kasus pelanggaran..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian Kasus & Keputusan Sanksi *</label>
            <textarea
              rows={3}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Jelaskan fakta kejadian dan bentuk sanksi sosial yang harus dijalankan mahasiswa..."
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
              onClick={handleAddViolation}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Simpan Pelanggaran
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Detail Pelanggaran */}
      {selectedViolation && (
        <Modal
          isOpen={!!selectedViolation}
          onClose={() => setSelectedViolation(null)}
          title={`Detail Pelanggaran — ${selectedViolation.judul_kasus}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900">{selectedViolation.mahasiswa_nama} ({selectedViolation.mahasiswa_nim})</p>
                <p className="text-slate-500 text-xs">Angkatan {selectedViolation.angkatan} • Status: {selectedViolation.status_mahasiswa}</p>
              </div>
              <StatusBadge status={selectedViolation.status_sanksi} size="md" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-500 block">Dasar Keputusan / Nomor BA:</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedViolation.dasar_keputusan}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-500 block">Tingkat Pelanggaran:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedViolation.tingkat} ({selectedViolation.jenis_pelanggaran})</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Uraian Fakta Pelanggaran:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedViolation.uraian}</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <span className="font-bold text-blue-900 block">Status Pelaksanaan Jam Sanksi Sosial:</span>
                <p className="text-blue-800 text-xs">
                  Beban Sanksi: <strong>{selectedViolation.total_jam_sanksi} Jam</strong> • Terpenuhi: <strong>{selectedViolation.jam_sanksi_terpenuhi} Jam</strong> • Sisa: <strong>{Math.max(0, selectedViolation.total_jam_sanksi - selectedViolation.jam_sanksi_terpenuhi)} Jam</strong>
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px] space-y-0.5">
                <p>Dosen Pencatat: {selectedViolation.dosen_pencatat_nama}</p>
                <p>Dosen Wali: {selectedViolation.dosen_wali_nama}</p>
                <p>Dosen Verifikator Sanksi: {selectedViolation.dosen_verifikator_nama}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedViolation(null)}
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

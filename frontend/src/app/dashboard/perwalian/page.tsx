'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import {
  mockClassPerwalianReports,
  mockDosenWaliSessions,
} from '@/lib/mock-data';
import type {
  ClassPerwalianReport,
  DosenWaliSessionReport,
  PerwalianStatus,
  PerwalianSessionType,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Bell,
  Eye,
  FileCheck,
  Send,
  PieChart,
  HelpCircle,
} from 'lucide-react';

export default function LaporanPerwalianPage() {
  const { currentRole } = useUser();
  const [activeTab, setActiveTab] = useState<'KELAS' | 'SESI_DOSEN' | 'STATUS_MONITORING'>('KELAS');

  // State data
  const [classReports, setClassReports] = useState<ClassPerwalianReport[]>(mockClassPerwalianReports);
  const [dosenSessions, setDosenSessions] = useState<DosenWaliSessionReport[]>(mockDosenWaliSessions);
  const [selectedReport, setSelectedReport] = useState<ClassPerwalianReport | null>(null);
  const [selectedSession, setSelectedSession] = useState<DosenWaliSessionReport | null>(null);

  // Modal forms
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Form state for Ketua Kelas (FR-01)
  const [formKelas, setFormKelas] = useState('IF-2022-A');
  const [formAngkatan, setFormAngkatan] = useState('2022');
  const [formKondisiUmum, setFormKondisiUmum] = useState('');
  const [formKendalaAkademik, setFormKendalaAkademik] = useState('');
  const [formKendalaNonAkademik, setFormKendalaNonAkademik] = useState('');
  const [formAspirasi, setFormAspirasi] = useState('');
  const [formPerhatianNim, setFormPerhatianNim] = useState('');
  const [formPerhatianNama, setFormPerhatianNama] = useState('');
  const [formPerhatianIsu, setFormPerhatianIsu] = useState('');
  const [formPerhatianKehadiran, setFormPerhatianKehadiran] = useState('70');

  // Form state for Dosen Wali (FR-02)
  const [formSessKelas, setFormSessKelas] = useState('IF-2022-A');
  const [formSessType, setFormSessType] = useState<PerwalianSessionType>('AWAL_SEMESTER');
  const [formSessTanggal, setFormSessTanggal] = useState('2024-11-03');
  const [formSessTotalMhs, setFormSessTotalMhs] = useState('35');
  const [formSessHadirMhs, setFormSessHadirMhs] = useState('33');
  const [formSessTopik, setFormSessTopik] = useState('');
  const [formSessRekomendasi, setFormSessRekomendasi] = useState('');
  const [formSessTindakLanjut, setFormSessTindakLanjut] = useState('');

  // Handle submit Ketua Kelas (FR-01)
  const handleSaveClassReport = (statusToSave: PerwalianStatus) => {
    const newReport: ClassPerwalianReport = {
      id: `rep-perw-${Date.now()}`,
      kelas: formKelas,
      angkatan: parseInt(formAngkatan) || 2024,
      semester: 'GANJIL',
      tahun_akademik: '2024/2025',
      ketua_kelas_nim: '220101001',
      ketua_kelas_nama: 'Muhammad Farel (Ketua Kelas)',
      dosen_wali_id: 'u-kaprodi',
      dosen_wali_nama: 'Dr. Ahmad Fauzi, M.T.',
      kondisi_umum: formKondisiUmum || 'Perkuliahan berjalan lancar dan mahasiswa aktif mengikuti sesi praktikum.',
      kendala_akademik: formKendalaAkademik || 'Tidak ada kendala akademik mayor.',
      kendala_non_akademik: formKendalaNonAkademik || 'Tidak ada kendala fasilitas.',
      aspirasi_mahasiswa: formAspirasi || 'Mohon penyampaian materi perkuliahan tetap diunggah ke portal.',
      mahasiswa_perhatian: formPerhatianNim ? [
        {
          nim: formPerhatianNim,
          nama: formPerhatianNama || 'Mahasiswa Terdata',
          isu: formPerhatianIsu || 'Tingkat kehadiran di bawah 75%',
          persentase_kehadiran: parseInt(formPerhatianKehadiran) || 70,
        }
      ] : [],
      status: statusToSave,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClassReports([newReport, ...classReports]);
    setShowCreateClassModal(false);
    // Reset
    setFormKondisiUmum('');
    setFormKendalaAkademik('');
    setFormKendalaNonAkademik('');
    setFormAspirasi('');
  };

  // Handle submit Dosen Wali Session (FR-02)
  const handleSaveSession = () => {
    const newSession: DosenWaliSessionReport = {
      id: `sess-perw-${Date.now()}`,
      dosen_wali_id: 'u-kaprodi',
      dosen_wali_nama: 'Dr. Ahmad Fauzi, M.T.',
      kelas: formSessKelas,
      angkatan: 2022,
      semester: 'GANJIL',
      tahun_akademik: '2024/2025',
      sesi: formSessType,
      tanggal_sesi: formSessTanggal,
      total_mahasiswa: parseInt(formSessTotalMhs) || 35,
      hadir_mahasiswa: parseInt(formSessHadirMhs) || 33,
      topik_bahasan: formSessTopik || 'Evaluasi Kemajuan Akademik dan Rencana Registrasi Semester',
      catatan_per_mahasiswa: [
        { nim: '220101001', nama: 'Muhammad Farel', catatan: 'Perkembangan sangat baik.', hadir: true },
      ],
      rekomendasi: formSessRekomendasi || 'Tingkatkan keterlibatan mahasiswa dalam kegiatan riset dan program MBKM.',
      rencana_tindak_lanjut: formSessTindakLanjut || 'Konsultasi lanjutan terjadwal pada pekan ke-12 perkuliahan.',
      status: 'SELESAI',
      created_at: new Date().toISOString(),
    };

    setDosenSessions([newSession, ...dosenSessions]);
    setShowCreateSessionModal(false);
    setFormSessTopik('');
    setFormSessRekomendasi('');
    setFormSessTindakLanjut('');
  };

  // Handle Verifikasi Laporan oleh Dosen Wali
  const handleVerify = () => {
    if (!selectedReport) return;
    setClassReports(classReports.map((r) =>
      r.id === selectedReport.id
        ? {
            ...r,
            status: 'TERVERIFIKASI',
            catatan_verifikasi_dosen: verifyNotes || 'Telah ditinjau dan disetujui dosen wali.',
            diverifikasi_at: new Date().toISOString(),
          }
        : r
    ));
    setShowVerifyModal(false);
    setVerifyNotes('');
  };

  // Kirim Pengingat Pengisian (FR-04)
  const handleSendReminder = (kelasTarget: string) => {
    setReminderToast(`Notifikasi pengingat pengisian laporan perwalian berhasil dikirimkan ke Ketua Kelas dan Dosen Wali kelas ${kelasTarget}!`);
    setTimeout(() => setReminderToast(null), 5000);
  };

  // Columns for Class Reports (FR-01)
  const classReportColumns = [
    {
      key: 'kelas',
      header: 'Kelas & Angkatan',
      render: (row: ClassPerwalianReport) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.kelas}</span>
          <p className="text-[11px] text-slate-500">Angkatan {row.angkatan} • {row.tahun_akademik} {row.semester}</p>
        </div>
      ),
    },
    {
      key: 'ketua',
      header: 'Ketua Kelas',
      render: (row: ClassPerwalianReport) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800">{row.ketua_kelas_nama}</p>
          <p className="text-[11px] text-slate-500">NIM: {row.ketua_kelas_nim}</p>
        </div>
      ),
    },
    {
      key: 'dosen_wali',
      header: 'Dosen Wali',
      render: (row: ClassPerwalianReport) => (
        <span className="text-xs font-medium text-slate-700">{row.dosen_wali_nama}</span>
      ),
    },
    {
      key: 'perhatian',
      header: 'Mhs Perlu Perhatian',
      render: (row: ClassPerwalianReport) => (
        row.mahasiswa_perhatian.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            {row.mahasiswa_perhatian.length} Mahasiswa
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Nihil</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status Pengisian',
      render: (row: ClassPerwalianReport) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: ClassPerwalianReport) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedReport(row)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1"
            title="Lihat Detail"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Detail</span>
          </button>
          {row.status === 'TERKIRIM' && (currentRole === 'DOSEN' || currentRole === 'DOSEN_WALI' || currentRole === 'KAPRODI') && (
            <button
              onClick={() => {
                setSelectedReport(row);
                setShowVerifyModal(true);
              }}
              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
              title="Verifikasi Laporan"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Verifikasi</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  // Columns for Dosen Wali Sessions (FR-02)
  const sessionColumns = [
    {
      key: 'sesi',
      header: 'Sesi & Kelas',
      render: (row: DosenWaliSessionReport) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            {row.sesi.replace('_', ' ')}
          </span>
          <p className="text-[11px] text-slate-500">Kelas: <strong className="text-slate-700">{row.kelas}</strong></p>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal Sesi',
      render: (row: DosenWaliSessionReport) => (
        <span className="text-xs text-slate-700 font-medium">{formatDate(row.tanggal_sesi)}</span>
      ),
    },
    {
      key: 'kehadiran',
      header: 'Presensi Mahasiswa',
      render: (row: DosenWaliSessionReport) => (
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-emerald-700">
            {row.hadir_mahasiswa} / {row.total_mahasiswa} Hadir
          </span>
          <p className="text-[10px] text-slate-500">
            ({Math.round((row.hadir_mahasiswa / row.total_mahasiswa) * 100)}% Kehadiran)
          </p>
        </div>
      ),
    },
    {
      key: 'topik',
      header: 'Topik Bahasan & Rekomendasi',
      render: (row: DosenWaliSessionReport) => (
        <div className="space-y-0.5 max-w-sm">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{row.topik_bahasan}</p>
          <p className="text-[11px] text-slate-500 line-clamp-1">{row.rekomendasi}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: DosenWaliSessionReport) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: DosenWaliSessionReport) => (
        <button
          onClick={() => setSelectedSession(row)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center gap-1"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Lihat Notulen</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modul 1: Laporan Perwalian"
        description="Pencatatan kondisi kelas oleh Ketua Kelas (FR-01), laporan sesi perwalian oleh Dosen Wali (FR-02), dan monitoring tenggat pelaporan (FR-04)."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/perwalian/rekap"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <PieChart className="h-4 w-4 text-blue-600" />
              <span>Rekap & Analisis Isu</span>
            </Link>
            {(currentRole === 'KETUA_KELAS' || currentRole === 'MAHASISWA' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Isi Laporan Ketua Kelas</span>
              </button>
            )}
            {(currentRole === 'DOSEN' || currentRole === 'DOSEN_WALI' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowCreateSessionModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Catat Sesi Perwalian</span>
              </button>
            )}
          </div>
        }
      />

      {/* Reminder Toast */}
      {reminderToast && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-blue-500 hover:text-blue-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Laporan Kelas"
          value={classReports.length.toString()}
          description="Semester Ganjil 2024/2025"
          icon="Users"
        />
        <StatCard
          title="Terverifikasi Dosen"
          value={classReports.filter((r) => r.status === 'TERVERIFIKASI').length.toString()}
          description="Siap masuk kompilasi prodi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Menunggu Tinjauan"
          value={classReports.filter((r) => r.status === 'TERKIRIM').length.toString()}
          description="Perlu verifikasi Dosen Wali"
          icon="Clock"
        />
        <StatCard
          title="Sesi Bimbingan Selesai"
          value={dosenSessions.length.toString()}
          description="Tercatat di sistem perwalian"
          icon="BookOpen"
        />
      </div>

      {/* Tab Selector */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('KELAS')}
            className={`pb-3 text-base font-semibold border-b-2 transition-colors ${
              activeTab === 'KELAS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Laporan Ketua Kelas (FR-01)
          </button>
          <button
            onClick={() => setActiveTab('SESI_DOSEN')}
            className={`pb-3 text-base font-semibold border-b-2 transition-colors ${
              activeTab === 'SESI_DOSEN'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sesi Perwalian Dosen Wali (FR-02)
          </button>
          <button
            onClick={() => setActiveTab('STATUS_MONITORING')}
            className={`pb-3 text-base font-semibold border-b-2 transition-colors ${
              activeTab === 'STATUS_MONITORING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Status & Pengingat Pengisian (FR-04)
          </button>
        </div>
      </div>

      {/* TAB 1: Laporan Kelas (FR-01) */}
      {activeTab === 'KELAS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <DataTable
              data={classReports}
              columns={classReportColumns}
              searchPlaceholder="Cari kelas, ketua kelas, atau dosen wali..."
              searchKey="kelas"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Sesi Dosen Wali (FR-02) */}
      {activeTab === 'SESI_DOSEN' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <DataTable
              data={dosenSessions}
              columns={sessionColumns}
              searchPlaceholder="Cari sesi atau kelas..."
              searchKey="kelas"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Status & Pengingat Pengisian (FR-04) */}
      {activeTab === 'STATUS_MONITORING' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Matriks Kepatuhan Pengisian Laporan Perwalian</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tenggat pelaporan perwalian tengah semester: <strong>15 November 2024</strong>. Kaprodi dapat mengirimkan pengingat sistem secara terpadu.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Kelas & Angkatan</th>
                  <th className="p-3">Ketua Kelas</th>
                  <th className="p-3">Dosen Wali</th>
                  <th className="p-3">Status Laporan Kelas</th>
                  <th className="p-3">Status Sesi Dosen Wali</th>
                  <th className="p-3 text-right">Aksi Pengingat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {classReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold">{r.kelas} ({r.angkatan})</td>
                    <td className="p-3">{r.ketua_kelas_nama}</td>
                    <td className="p-3">{r.dosen_wali_nama}</td>
                    <td className="p-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-emerald-700">Terselenggara (2 Sesi)</span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSendReminder(r.kelas)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        <span>Kirim Pengingat</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Formulir Laporan Ketua Kelas (FR-01) */}
      <Modal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        title="Formulir Laporan Perwalian Kelas — Ketua Kelas (FR-01)"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Ketua kelas menyampaikan kondisi umum, kendala akademik/non-akademik, aspirasi mahasiswa, serta mahasiswa yang membutuhkan perhatian khusus. Laporan ini akan diteruskan ke Dosen Wali untuk diverifikasi.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
              <select
                value={formKelas}
                onChange={(e) => setFormKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="IF-2022-A">IF-2022-A</option>
                <option value="SI-2023-B">SI-2023-B</option>
                <option value="SI-2024-A">SI-2024-A</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Angkatan</label>
              <input
                type="number"
                value={formAngkatan}
                onChange={(e) => setFormAngkatan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Umum Kelas *</label>
            <textarea
              rows={3}
              value={formKondisiUmum}
              onChange={(e) => setFormKondisiUmum(e.target.value)}
              placeholder="Contoh: Keaktifan kelas sangat baik, 90% mahasiswa mengikuti perkuliahan tepat waktu..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kendala Akademik *</label>
            <textarea
              rows={2}
              value={formKendalaAkademik}
              onChange={(e) => setFormKendalaAkademik(e.target.value)}
              placeholder="Contoh: Kesulitan memahami algoritma lanjut, tugas praktikum bersamaan..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kendala Non-Akademik / Sarana</label>
            <textarea
              rows={2}
              value={formKendalaNonAkademik}
              onChange={(e) => setFormKendalaNonAkademik(e.target.value)}
              placeholder="Contoh: AC laboratorium sering rusak, proyektor redup di ruang 302..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aspirasi Mahasiswa</label>
            <textarea
              rows={2}
              value={formAspirasi}
              onChange={(e) => setFormAspirasi(e.target.value)}
              placeholder="Contoh: Usulan dibukanya lab hingga malam hari menjelang deadline tugas besar..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          {/* Mahasiswa Perlu Perhatian */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Mahasiswa yang Perlu Perhatian Khusus (Opsional)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="NIM Mahasiswa"
                value={formPerhatianNim}
                onChange={(e) => setFormPerhatianNim(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
              <input
                type="text"
                placeholder="Nama Mahasiswa"
                value={formPerhatianNama}
                onChange={(e) => setFormPerhatianNama(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Isu / Masalah (mis. Kehadiran rendah, sakit)"
                  value={formPerhatianIsu}
                  onChange={(e) => setFormPerhatianIsu(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="% Kehadiran"
                  value={formPerhatianKehadiran}
                  onChange={(e) => setFormPerhatianKehadiran(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSaveClassReport('DRAF')}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Simpan sebagai Draf
            </button>
            <button
              onClick={() => handleSaveClassReport('TERKIRIM')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Kirim ke Dosen Wali
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Formulir Sesi Perwalian Dosen Wali (FR-02) */}
      <Modal
        isOpen={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        title="Formulir Laporan Sesi Perwalian — Dosen Wali (FR-02)"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Dosen Wali mencatat sesi perwalian per kelas per sesi (tanggal, daftar hadir, topik pembahasan, catatan khusus per mahasiswa, rekomendasi, dan tindak lanjut).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Binaan</label>
              <select
                value={formSessKelas}
                onChange={(e) => setFormSessKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="IF-2022-A">IF-2022-A (35 Mahasiswa)</option>
                <option value="SI-2023-B">SI-2023-B (38 Mahasiswa)</option>
                <option value="SI-2024-A">SI-2024-A (40 Mahasiswa)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sesi Perwalian</label>
              <select
                value={formSessType}
                onChange={(e) => setFormSessType(e.target.value as PerwalianSessionType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="AWAL_SEMESTER">Awal Semester (Penyusunan KRS)</option>
                <option value="TENGAH_SEMESTER">Tengah Semester (Evaluasi UTS)</option>
                <option value="AKHIR_SEMESTER">Akhir Semester (Evaluasi Akhir)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Sesi *</label>
              <input
                type="date"
                value={formSessTanggal}
                onChange={(e) => setFormSessTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Mahasiswa</label>
              <input
                type="number"
                value={formSessTotalMhs}
                onChange={(e) => setFormSessTotalMhs(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Hadir *</label>
              <input
                type="number"
                value={formSessHadirMhs}
                onChange={(e) => setFormSessHadirMhs(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Topik yang Dibahas *</label>
            <textarea
              rows={2}
              value={formSessTopik}
              onChange={(e) => setFormSessTopik(e.target.value)}
              placeholder="Contoh: Pembahasan evaluasi nilai UTS, persiapan bimbingan tugas akhir..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rekomendasi Dosen Wali *</label>
            <textarea
              rows={2}
              value={formSessRekomendasi}
              onChange={(e) => setFormSessRekomendasi(e.target.value)}
              placeholder="Contoh: Mahasiswa dengan IPK < 3.00 dibatasi maksimal 20 SKS..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Tindak Lanjut *</label>
            <textarea
              rows={2}
              value={formSessTindakLanjut}
              onChange={(e) => setFormSessTindakLanjut(e.target.value)}
              placeholder="Contoh: Dosen wali berkoordinasi dengan dosen pengampu terkait monitoring..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowCreateSessionModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveSession}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Simpan Sesi Perwalian
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Detail Laporan Ketua Kelas */}
      {selectedReport && !showVerifyModal && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Detail Laporan Perwalian — Kelas ${selectedReport.kelas}`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedReport.kelas} • Angkatan {selectedReport.angkatan}</h4>
                <p className="text-slate-500 text-xs">Ketua Kelas: {selectedReport.ketua_kelas_nama} ({selectedReport.ketua_kelas_nim})</p>
              </div>
              <StatusBadge status={selectedReport.status} size="md" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Kondisi Umum Kelas:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedReport.kondisi_umum}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Kendala Akademik:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedReport.kendala_akademik}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Kendala Non-Akademik / Sarana:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedReport.kendala_non_akademik}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Aspirasi Mahasiswa:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedReport.aspirasi_mahasiswa}</p>
              </div>

              {selectedReport.mahasiswa_perhatian.length > 0 && (
                <div>
                  <span className="font-bold text-amber-800 block mb-1">Daftar Mahasiswa Perlu Perhatian:</span>
                  <div className="space-y-1.5">
                    {selectedReport.mahasiswa_perhatian.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{m.nama} ({m.nim})</p>
                          <p className="text-amber-700 text-[11px] mt-0.5">{m.isu}</p>
                        </div>
                        {m.persentase_kehadiran && (
                          <span className="text-[11px] font-bold text-red-600 bg-white px-2 py-0.5 rounded border border-red-200">
                            Kehadiran: {m.persentase_kehadiran}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.catatan_verifikasi_dosen && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block text-xs">Catatan Verifikasi Dosen Wali:</span>
                  <p className="text-emerald-800 text-xs mt-1">{selectedReport.catatan_verifikasi_dosen}</p>
                  <p className="text-[10px] text-emerald-600 mt-1">Diverifikasi pada: {selectedReport.diverifikasi_at ? formatDate(selectedReport.diverifikasi_at) : '-'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Verifikasi Dosen Wali */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Verifikasi Laporan Perwalian Kelas — Dosen Wali"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Anda meninjau laporan perwalian kelas <strong>{selectedReport?.kelas}</strong> yang diajukan oleh Ketua Kelas {selectedReport?.ketua_kelas_nama}.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tindak Lanjut / Rekomendasi Dosen Wali *</label>
            <textarea
              rows={3}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Tuliskan catatan arahan dosen wali untuk laporan ini..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowVerifyModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleVerify}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Setujui & Verifikasi Laporan
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Detail Notulen Sesi Dosen */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Notulen Sesi Perwalian — ${selectedSession.kelas} (${selectedSession.sesi.replace('_', ' ')})`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dosen Wali: {selectedSession.dosen_wali_nama}</h4>
                <p className="text-slate-500 text-xs">Tanggal Pelaksanaan: {formatDate(selectedSession.tanggal_sesi)}</p>
              </div>
              <StatusBadge status={selectedSession.status} size="md" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-bold text-blue-900 block">Tingkat Presensi Mahasiswa:</span>
                <p className="text-blue-800 text-xs mt-0.5">
                  Hadir {selectedSession.hadir_mahasiswa} dari {selectedSession.total_mahasiswa} mahasiswa ({Math.round((selectedSession.hadir_mahasiswa / selectedSession.total_mahasiswa) * 100)}%)
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Topik Bahasan Sesi:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedSession.topik_bahasan}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Rekomendasi Dosen Wali:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedSession.rekomendasi}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Rencana Tindak Lanjut:</span>
                <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedSession.rencana_tindak_lanjut}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSession(null)}
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

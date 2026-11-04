'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { useUser } from '@/lib/context';
import { supabasePerwalian } from '@/lib/supabase';
import type {
  ClassPerwalianReport,
  DosenWaliSessionReport,
  PerwalianStatus,
  PerwalianSessionType,
  AttentionStudent,
  DosenWaliStudentNote,
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
  Trash2,
  Calendar,
  BookOpen,
  FileText,
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

interface ReminderLog {
  id: string;
  waktu: string;
  kelas: string;
  penerima: string;
  saluran: string;
  status: string;
}

export default function LaporanPerwalianPage() {
  const { currentRole } = useUser();
  const [activeTab, setActiveTab] = useState<'KELAS' | 'SESI_DOSEN' | 'STATUS_MONITORING'>('KELAS');

  // Filter state
  const [selectedSemester, setSelectedSemester] = useState<string>('2024/2025 GANJIL');
  const [selectedAngkatan, setSelectedAngkatan] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // State data
  const [classReports, setClassReports] = useState<ClassPerwalianReport[]>([]);
  const [dosenSessions, setDosenSessions] = useState<DosenWaliSessionReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reports, sessions] = await Promise.all([
        supabasePerwalian.getLaporanAll(),
        supabasePerwalian.getSesiAll()
      ]);
      setClassReports(reports);
      setDosenSessions(sessions);
    } catch (err) {
      console.error('Gagal memuat data perwalian:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const [selectedReport, setSelectedReport] = useState<ClassPerwalianReport | null>(null);
  const [selectedSession, setSelectedSession] = useState<DosenWaliSessionReport | null>(null);

  // Modal forms
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Reminder logs state
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([
    {
      id: 'rem-1',
      waktu: '2024-11-01 09:15',
      kelas: 'SI-2024-A',
      penerima: 'Budi Santoso (Ketua Kelas) & Dr. Ir. Hendra Gunawan',
      saluran: 'Sistem & Email Kampus',
      status: 'Terkirim',
    },
    {
      id: 'rem-2',
      waktu: '2024-10-25 14:00',
      kelas: 'SI-2023-B',
      penerima: 'Anisa Putri Maharani & Siti Rahmawati, M.Kom.',
      saluran: 'Sistem & Email Kampus',
      status: 'Terkirim',
    },
  ]);

  // Form state for Ketua Kelas
  const [formKelas, setFormKelas] = useState('IF-2022-A');
  const [formAngkatan, setFormAngkatan] = useState('2022');
  const [formKondisiUmum, setFormKondisiUmum] = useState('');
  const [formKendalaAkademik, setFormKendalaAkademik] = useState('');
  const [formKendalaNonAkademik, setFormKendalaNonAkademik] = useState('');
  const [formAspirasi, setFormAspirasi] = useState('');

  // Dynamic attention students list in form
  const [attentionList, setAttentionList] = useState<AttentionStudent[]>([
    {
      nim: '',
      nama: '',
      isu: '',
      persentase_kehadiran: 70,
      catatan: '',
    },
  ]);

  const addAttentionRow = () => {
    setAttentionList([
      ...attentionList,
      { nim: '', nama: '', isu: '', persentase_kehadiran: 75, catatan: '' },
    ]);
  };

  const removeAttentionRow = (index: number) => {
    setAttentionList(attentionList.filter((_, idx) => idx !== index));
  };

  const updateAttentionRow = (index: number, field: keyof AttentionStudent, value: string | number) => {
    const updated = [...attentionList];
    updated[index] = { ...updated[index], [field]: value };
    setAttentionList(updated);
  };

  // Form state for Dosen Wali Session
  const [formSessKelas, setFormSessKelas] = useState('IF-2022-A');
  const [formSessType, setFormSessType] = useState<PerwalianSessionType>('AWAL_SEMESTER');
  const [formSessTanggal, setFormSessTanggal] = useState('2024-11-03');
  const [formSessTotalMhs, setFormSessTotalMhs] = useState('35');
  const [formSessHadirMhs, setFormSessHadirMhs] = useState('33');
  const [formSessTopik, setFormSessTopik] = useState('');
  const [formSessRekomendasi, setFormSessRekomendasi] = useState('');
  const [formSessTindakLanjut, setFormSessTindakLanjut] = useState('');

  // Dynamic special student notes in Dosen Wali Session
  const [sessionStudentNotes, setSessionStudentNotes] = useState<DosenWaliStudentNote[]>([
    {
      nim: '220101001',
      nama: 'Muhammad Farel',
      catatan: 'Perkembangan studi sangat baik, IPK memuaskan dan aktif berorganisasi.',
      status_akademik: 'Lancar',
      hadir: true,
    },
  ]);

  const addSessionStudentRow = () => {
    setSessionStudentNotes([
      ...sessionStudentNotes,
      { nim: '', nama: '', catatan: '', status_akademik: 'Perlu Monitoring', hadir: true },
    ]);
  };

  const removeSessionStudentRow = (index: number) => {
    setSessionStudentNotes(sessionStudentNotes.filter((_, idx) => idx !== index));
  };

  const updateSessionStudentRow = (index: number, field: keyof DosenWaliStudentNote, value: any) => {
    const updated = [...sessionStudentNotes];
    updated[index] = { ...updated[index], [field]: value };
    setSessionStudentNotes(updated);
  };

  // Filtered class reports
  const filteredClassReports = classReports.filter((r) => {
    const matchAngkatan = selectedAngkatan === 'ALL' || r.angkatan.toString() === selectedAngkatan;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchAngkatan && matchStatus;
  });

  // Handle submit Ketua Kelas
  const handleSaveClassReport = async (statusToSave: PerwalianStatus) => {
    const validAttentionStudents = attentionList.filter((s) => s.nim.trim() !== '');

    try {
      const saved = await supabasePerwalian.createLaporan({
        kelas: formKelas,
        angkatan: parseInt(formAngkatan) || 2024,
        semester: 'GANJIL',
        tahun_akademik: '2024/2025',
        ketua_kelas_nim: '220101001',
        ketua_kelas_nama: 'Muhammad Farel (Ketua Kelas)',
        dosen_wali_nama: 'Dr. Ahmad Fauzi, M.T.',
        kondisi_umum: formKondisiUmum || 'Perkuliahan berjalan lancar dan mahasiswa aktif mengikuti sesi perkuliahan.',
        kendala_akademik: formKendalaAkademik || 'Tidak ada kendala akademik mayor.',
        kendala_non_akademik: formKendalaNonAkademik || 'Tidak ada kendala sarana prasarana.',
        aspirasi_mahasiswa: formAspirasi || 'Mohon materi kuliah tetap diunggah ke portal tepat waktu.',
        mahasiswa_perhatian: validAttentionStudents,
        status: statusToSave,
      });

      setClassReports((prev) => [saved, ...prev]);
      setShowCreateClassModal(false);

      // Reset Form
      setFormKondisiUmum('');
      setFormKendalaAkademik('');
      setFormKendalaNonAkademik('');
      setFormAspirasi('');
      setAttentionList([{ nim: '', nama: '', isu: '', persentase_kehadiran: 70, catatan: '' }]);

      const message = statusToSave === 'TERKIRIM'
        ? `Laporan perwalian kelas ${formKelas} berhasil dikirimkan ke Dosen Wali untuk verifikasi.`
        : `Draf laporan perwalian kelas ${formKelas} berhasil disimpan.`;
      setReminderToast(message);
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err: any) {
      console.error('Gagal menyimpan laporan perwalian:', err);
      alert(`Gagal menyimpan ke database: ${err?.message || err}`);
    }
  };

  // Handle submit Dosen Wali Session
  const handleSaveSession = async () => {
    const validNotes = sessionStudentNotes.filter((s) => s.nim.trim() !== '');

    try {
      const saved = await supabasePerwalian.createSesi({
        dosen_wali_nama: 'Dr. Ahmad Fauzi, M.T.',
        kelas: formSessKelas,
        angkatan: 2022,
        semester: 'GANJIL',
        tahun_akademik: '2024/2025',
        sesi: formSessType,
        tanggal_sesi: formSessTanggal,
        total_mahasiswa: parseInt(formSessTotalMhs) || 35,
        hadir_mahasiswa: parseInt(formSessHadirMhs) || 33,
        topik_bahasan: formSessTopik || 'Evaluasi Kemajuan Akademik dan Bimbingan Rencana Studi Semester',
        catatan_per_mahasiswa: validNotes,
        rekomendasi: formSessRekomendasi || 'Tingkatkan keterlibatan mahasiswa dalam kegiatan akademik dan pengayaan.',
        rencana_tindak_lanjut: formSessTindakLanjut || 'Konsultasi lanjutan terjadwal pada pekan ke-12 perkuliahan.',
        status: 'SELESAI',
      });

      setDosenSessions((prev) => [saved, ...prev]);
      setShowCreateSessionModal(false);
      setFormSessTopik('');
      setFormSessRekomendasi('');
      setFormSessTindakLanjut('');
      setSessionStudentNotes([{ nim: '', nama: '', catatan: '', status_akademik: 'Perlu Monitoring', hadir: true }]);

      setReminderToast(`Notulen sesi perwalian ${formSessType.replace('_', ' ')} kelas ${formSessKelas} berhasil disimpan.`);
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err: any) {
      console.error('Gagal menyimpan sesi bimbingan:', err);
      alert(`Gagal menyimpan ke database: ${err?.message || err}`);
    }
  };

  // Handle Verifikasi Laporan oleh Dosen Wali
  const handleVerify = async () => {
    if (!selectedReport) return;
    try {
      const updated = await supabasePerwalian.updateLaporanStatus(selectedReport.id, {
        status: 'TERVERIFIKASI',
        catatan_verifikasi_dosen: verifyNotes || 'Laporan telah ditinjau dan disetujui Dosen Wali. Rekomendasi diteruskan ke program studi.',
        diverifikasi_at: new Date().toISOString(),
      });

      setClassReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowVerifyModal(false);
      setVerifyNotes('');
      setReminderToast(`Laporan perwalian kelas ${selectedReport.kelas} telah diverifikasi dan disetujui secara resmi.`);
      setTimeout(() => setReminderToast(null), 6000);
    } catch (err: any) {
      console.error('Gagal memverifikasi laporan:', err);
      alert(`Gagal memverifikasi di database: ${err?.message || err}`);
    }
  };
  // Kirim Pengingat Pengisian Individual
  const handleSendReminder = (kelasTarget: string) => {
    const newLog: ReminderLog = {
      id: `rem-${Date.now()}`,
      waktu: new Date().toISOString().replace('T', ' ').substring(0, 16),
      kelas: kelasTarget,
      penerima: `Ketua Kelas & Dosen Wali ${kelasTarget}`,
      saluran: 'Sistem & Email Kampus',
      status: 'Terkirim',
    };
    setReminderLogs([newLog, ...reminderLogs]);
    setReminderToast(`Notifikasi pengingat pengisian laporan perwalian berhasil dikirimkan ke Ketua Kelas dan Dosen Wali kelas ${kelasTarget}!`);
    setTimeout(() => setReminderToast(null), 5000);
  };

  // Kirim Pengingat Massal
  const handleSendBroadcastReminder = () => {
    const unverifiedClasses = classReports.filter((r) => r.status !== 'TERVERIFIKASI');
    const newLogs: ReminderLog[] = unverifiedClasses.map((r) => ({
      id: `rem-${Date.now()}-${r.id}`,
      waktu: new Date().toISOString().replace('T', ' ').substring(0, 16),
      kelas: r.kelas,
      penerima: `${r.ketua_kelas_nama} & ${r.dosen_wali_nama}`,
      saluran: 'Sistem & Email Kampus',
      status: 'Terkirim',
    }));
    setReminderLogs([...newLogs, ...reminderLogs]);
    setReminderToast(`Pengingat massal berhasil dikirimkan ke ${unverifiedClasses.length} kelas yang belum menyelesaikan pelaporan perwalian.`);
    setTimeout(() => setReminderToast(null), 6000);
  };

  // Columns for Class Reports
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
          <p className="text-[11px] text-slate-500 font-mono">NIM: {row.ketua_kelas_nim}</p>
        </div>
      ),
    },
    {
      key: 'dosen_wali',
      header: 'Dosen Wali Pembina',
      render: (row: ClassPerwalianReport) => (
        <span className="text-xs font-medium text-slate-700">{row.dosen_wali_nama}</span>
      ),
    },
    {
      key: 'perhatian',
      header: 'Mahasiswa Perlu Perhatian',
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
      header: 'Status Laporan',
      render: (row: ClassPerwalianReport) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row: ClassPerwalianReport) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedReport(row)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Lihat Detail Laporan"
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
              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
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

  // Columns for Dosen Wali Sessions
  const sessionColumns = [
    {
      key: 'sesi',
      header: 'Sesi & Kelas',
      render: (row: DosenWaliSessionReport) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            {row.sesi.replace('_', ' ')}
          </span>
          <p className="text-[11px] text-slate-500">Kelas: <strong className="text-slate-700">{row.kelas}</strong> ({row.tahun_akademik})</p>
        </div>
      ),
    },
    {
      key: 'dosen',
      header: 'Dosen Wali',
      render: (row: DosenWaliSessionReport) => (
        <span className="text-xs font-medium text-slate-700">{row.dosen_wali_nama}</span>
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
      render: (row: DosenWaliSessionReport) => {
        const rate = Math.round((row.hadir_mahasiswa / row.total_mahasiswa) * 100);
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-emerald-700">
              {row.hadir_mahasiswa} / {row.total_mahasiswa} Hadir
            </span>
            <p className="text-[10px] text-slate-500">
              ({rate}% Tingkat Kehadiran)
            </p>
          </div>
        );
      },
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
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
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
        title="Laporan Perwalian Mahasiswa"
        description="Pusat pengelolaan dan pelaporan perwalian mahasiswa: pencatatan kondisi kelas oleh Ketua Kelas, notulen sesi bimbingan berkala Dosen Wali, serta pemantauan kepatuhan tenggat pelaporan prodi."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/perwalian/rekap"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <PieChart className="h-4 w-4 text-blue-600" />
              <span>Rekap & Analisis Isu</span>
            </Link>
            {(currentRole === 'KETUA_KELAS' || currentRole === 'MAHASISWA' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Isi Laporan Ketua Kelas</span>
              </button>
            )}
            {(currentRole === 'DOSEN' || currentRole === 'DOSEN_WALI' || currentRole === 'KAPRODI') && (
              <button
                onClick={() => setShowCreateSessionModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Catat Sesi Bimbingan</span>
              </button>
            )}
          </div>
        }
      />

      {/* Reminder Toast */}
      {reminderToast && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium">{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-blue-500 hover:text-blue-800 font-bold ml-2 text-base leading-none">×</button>
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
          description="Telah ditinjau resmi dosen wali"
          icon="CheckCircle2"
        />
        <StatCard
          title="Menunggu Tinjauan"
          value={classReports.filter((r) => r.status === 'TERKIRIM').length.toString()}
          description="Menunggu persetujuan dosen wali"
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
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('KELAS')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'KELAS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Laporan Ketua Kelas</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {classReports.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('SESI_DOSEN')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'SESI_DOSEN'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sesi Bimbingan Dosen Wali</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {dosenSessions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('STATUS_MONITORING')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'STATUS_MONITORING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Monitoring Kepatuhan & Tenggat</span>
            {classReports.filter((r) => r.status !== 'TERVERIFIKASI').length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {classReports.filter((r) => r.status !== 'TERVERIFIKASI').length} Belum Lengkap
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Laporan Ketua Kelas */}
      {activeTab === 'KELAS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Filter:
              </span>
              <select
                value={selectedAngkatan}
                onChange={(e) => setSelectedAngkatan(e.target.value)}
                className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Semua Angkatan</option>
                <option value="2022">Angkatan 2022</option>
                <option value="2023">Angkatan 2023</option>
                <option value="2024">Angkatan 2024</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="TERVERIFIKASI">Terverifikasi</option>
                <option value="TERKIRIM">Menunggu Verifikasi</option>
                <option value="DRAF">Draf</option>
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Menampilkan <strong>{filteredClassReports.length}</strong> laporan kelas
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <DataTable
              data={filteredClassReports}
              columns={classReportColumns}
              searchPlaceholder="Cari kelas, ketua kelas, atau dosen wali..."
              searchKey="kelas"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Sesi Bimbingan Dosen Wali */}
      {activeTab === 'SESI_DOSEN' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <DataTable
              data={dosenSessions}
              columns={sessionColumns}
              searchPlaceholder="Cari sesi, topik, atau kelas..."
              searchKey="kelas"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Monitoring Kepatuhan & Tenggat */}
      {activeTab === 'STATUS_MONITORING' && (
        <div className="space-y-6">
          {/* Compliance Summary Banner */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-full">
                  Periode Semester Ganjil 2024/2025
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Tenggat Pelaporan Perwalian Tengah Semester
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Batas akhir penyampaian laporan Ketua Kelas dan verifikasi Dosen Wali adalah <strong>15 November 2024 (Pukul 23:59 WIB)</strong>. Sisa waktu 12 hari kalender.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendBroadcastReminder}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Kirim Pengingat ke Semua Kelas Belum Mengisi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Matriks Kepatuhan Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Matriks Kepatuhan Pengisian Laporan Perwalian</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoring kesiapan laporan per kelas, peran dosen wali, serta status verifikasi akhir.
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
                    <th className="p-3">Status Sesi Bimbingan</th>
                    <th className="p-3 text-right">Aksi Notifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {classReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold">
                        {r.kelas} <span className="text-slate-400 font-normal">({r.angkatan})</span>
                      </td>
                      <td className="p-3 font-medium">{r.ketua_kelas_nama}</td>
                      <td className="p-3">{r.dosen_wali_nama}</td>
                      <td className="p-3">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                          Terselenggara (2 Sesi)
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSendReminder(r.kelas)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors"
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

          {/* Riwayat Notifikasi Pengingat */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Log Riwayat Pengingat Terkirim</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Waktu Pengiriman</th>
                    <th className="p-2.5">Kelas Sasaran</th>
                    <th className="p-2.5">Penerima Pesan</th>
                    <th className="p-2.5">Saluran</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reminderLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{log.waktu}</td>
                      <td className="p-2.5 font-bold text-slate-800">{log.kelas}</td>
                      <td className="p-2.5">{log.penerima}</td>
                      <td className="p-2.5 text-slate-600">{log.saluran}</td>
                      <td className="p-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Formulir Laporan Ketua Kelas */}
      <Modal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        title="Formulir Laporan Perwalian Kelas — Ketua Kelas"
      >
        <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
            <p className="font-semibold">Petunjuk Pengisian:</p>
            <p className="mt-0.5">
              Ketua kelas menyampaikan kondisi umum kelas, kendala akademik maupun fasilitas, aspirasi mahasiswa, serta mencatat mahasiswa yang membutuhkan perhatian khusus. Laporan dapat disimpan sebagai draf atau langsung dikirimkan ke Dosen Wali untuk ditinjau dan diverifikasi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Binaan *</label>
              <select
                value={formKelas}
                onChange={(e) => setFormKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="IF-2022-A">IF-2022-A</option>
                <option value="SI-2023-B">SI-2023-B</option>
                <option value="SI-2024-A">SI-2024-A</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Angkatan Mahasiswa *</label>
              <input
                type="number"
                value={formAngkatan}
                onChange={(e) => setFormAngkatan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Umum & Dinamika Kelas *</label>
            <textarea
              rows={3}
              value={formKondisiUmum}
              onChange={(e) => setFormKondisiUmum(e.target.value)}
              placeholder="Jelaskan suasana kelas, tingkat keaktifan, interaksi antarmahasiswa, dan kehadiran rata-rata..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kendala Akademik (Perkuliahan, Praktikum, Tugas) *</label>
            <textarea
              rows={2}
              value={formKendalaAkademik}
              onChange={(e) => setFormKendalaAkademik(e.target.value)}
              placeholder="Contoh: Kesulitan pemahaman materi basis data lanjut, jadwal praktikum bertabrakan dengan kuis..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kendala Fasilitas / Sarana Prasarana Kampus</label>
            <textarea
              rows={2}
              value={formKendalaNonAkademik}
              onChange={(e) => setFormKendalaNonAkademik(e.target.value)}
              placeholder="Contoh: AC laboratorium sering kurang dingin, koneksi WiFi di gedung lantai 3 sering putus..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aspirasi & Masukan Mahasiswa</label>
            <textarea
              rows={2}
              value={formAspirasi}
              onChange={(e) => setFormAspirasi(e.target.value)}
              placeholder="Contoh: Harapan penambahan kuota akses laboratorium komputer di malam hari menjelang evaluasi akhir..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          {/* Section: Daftar Mahasiswa Perlu Perhatian Khusus */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Daftar Mahasiswa yang Memerlukan Perhatian Khusus</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cantumkan mahasiswa dengan kehadiran rendah (&lt;75%), kendala kesehatan, atau masalah akademik/personal.
                </p>
              </div>
              <button
                type="button"
                onClick={addAttentionRow}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Tambah Mahasiswa</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {attentionList.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Mahasiswa #{idx + 1}</span>
                    {attentionList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttentionRow(idx)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] flex items-center gap-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="NIM Mahasiswa"
                      value={item.nim}
                      onChange={(e) => updateAttentionRow(idx, 'nim', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Nama Mahasiswa"
                      value={item.nama}
                      onChange={(e) => updateAttentionRow(idx, 'nama', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Isu / Masalah (mis. Kehadiran rendah, sakit berkepanjangan)"
                        value={item.isu}
                        onChange={(e) => updateAttentionRow(idx, 'isu', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="% Kehadiran"
                        value={item.persentase_kehadiran}
                        onChange={(e) => updateAttentionRow(idx, 'persentase_kehadiran', parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={() => handleSaveClassReport('DRAF')}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Simpan sebagai Draf
            </button>
            <button
              onClick={() => handleSaveClassReport('TERKIRIM')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
            >
              Kirim Resmi ke Dosen Wali
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Formulir Sesi Perwalian Dosen Wali */}
      <Modal
        isOpen={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        title="Formulir Laporan Sesi Perwalian — Dosen Wali"
      >
        <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Dosen Wali mencatat sesi perwalian berkala: tanggal pelaksanaan, presensi mahasiswa, topik pembahasan, catatan bimbingan khusus per mahasiswa, rekomendasi akademik, dan rencana tindak lanjut.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Binaan *</label>
              <select
                value={formSessKelas}
                onChange={(e) => setFormSessKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="IF-2022-A">IF-2022-A (35 Mahasiswa)</option>
                <option value="SI-2023-B">SI-2023-B (38 Mahasiswa)</option>
                <option value="SI-2024-A">SI-2024-A (40 Mahasiswa)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sesi Perwalian *</label>
              <select
                value={formSessType}
                onChange={(e) => setFormSessType(e.target.value as PerwalianSessionType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="AWAL_SEMESTER">Awal Semester (Penyusunan & Pengesahan KRS)</option>
                <option value="TENGAH_SEMESTER">Tengah Semester (Evaluasi UTS & Kemajuan Studi)</option>
                <option value="AKHIR_SEMESTER">Akhir Semester (Evaluasi Akhir UAS & Indeks Prestasi)</option>
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
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Topik yang Dibahas Secara Rinci *</label>
            <textarea
              rows={2}
              value={formSessTopik}
              onChange={(e) => setFormSessTopik(e.target.value)}
              placeholder="Contoh: Evaluasi capaian UTS, pembahasan strategi registrasi mata kuliah prasyarat, sosialisasi program magang industri..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          {/* Section: Catatan Per Mahasiswa */}
          <div className="border-t border-slate-200 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Catatan Khusus Bimbingan Mahasiswa</h4>
                <p className="text-[11px] text-slate-500">Catat perkembangan khusus bagi mahasiswa yang membutuhkan perhatian.</p>
              </div>
              <button
                type="button"
                onClick={addSessionStudentRow}
                className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Tambah Catatan Mahasiswa</span>
              </button>
            </div>

            <div className="space-y-2">
              {sessionStudentNotes.map((note, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Mahasiswa #{idx + 1}</span>
                    {sessionStudentNotes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSessionStudentRow(idx)}
                        className="text-rose-600 hover:text-rose-800 text-[11px]"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="NIM"
                      value={note.nim}
                      onChange={(e) => updateSessionStudentRow(idx, 'nim', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Nama Mahasiswa"
                      value={note.nama}
                      onChange={(e) => updateSessionStudentRow(idx, 'nama', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Catatan perkembangan akademik / personal..."
                    value={note.catatan}
                    onChange={(e) => updateSessionStudentRow(idx, 'catatan', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rekomendasi Dosen Wali *</label>
            <textarea
              rows={2}
              value={formSessRekomendasi}
              onChange={(e) => setFormSessRekomendasi(e.target.value)}
              placeholder="Contoh: Mahasiswa dengan IPK di bawah 3.00 dibatasi maksimal 20 SKS dan wajib mengikuti bimbingan per dua pekan..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Tindak Lanjut *</label>
            <textarea
              rows={2}
              value={formSessTindakLanjut}
              onChange={(e) => setFormSessTindakLanjut(e.target.value)}
              placeholder="Contoh: Dosen wali berkoordinasi dengan dosen pengampu terkait monitoring tugas perbaikan..."
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
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
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
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedReport.kelas} • Angkatan {selectedReport.angkatan}
                </h4>
                <p className="text-slate-500 text-xs">
                  Ketua Kelas: <strong>{selectedReport.ketua_kelas_nama}</strong> ({selectedReport.ketua_kelas_nim})
                </p>
                <p className="text-slate-500 text-xs">
                  Dosen Wali Pembina: <strong>{selectedReport.dosen_wali_nama}</strong>
                </p>
              </div>
              <StatusBadge status={selectedReport.status} size="md" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Kondisi Umum & Suasana Kelas:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedReport.kondisi_umum}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Kendala Akademik:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedReport.kendala_akademik}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Kendala Non-Akademik / Sarana Prasarana:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedReport.kendala_non_akademik}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Aspirasi Mahasiswa:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedReport.aspirasi_mahasiswa}
                </p>
              </div>

              {selectedReport.mahasiswa_perhatian.length > 0 && (
                <div>
                  <span className="font-bold text-amber-800 block mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Daftar Mahasiswa yang Memerlukan Perhatian Khusus:
                  </span>
                  <div className="space-y-1.5">
                    {selectedReport.mahasiswa_perhatian.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{m.nama} ({m.nim})</p>
                          <p className="text-amber-800 text-[11px] mt-0.5">{m.isu}</p>
                          {m.catatan && <p className="text-slate-600 text-[10px] italic mt-0.5">{m.catatan}</p>}
                        </div>
                        {m.persentase_kehadiran && (
                          <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                            Kehadiran: {m.persentase_kehadiran}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.catatan_verifikasi_dosen && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block text-xs flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-700" />
                    Catatan Verifikasi Resmi Dosen Wali:
                  </span>
                  <p className="text-emerald-800 text-xs leading-relaxed">{selectedReport.catatan_verifikasi_dosen}</p>
                  <p className="text-[10px] text-emerald-600 pt-1">
                    Diverifikasi pada: {selectedReport.diverifikasi_at ? formatDate(selectedReport.diverifikasi_at) : '-'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-slate-800">
              Meninjau laporan perwalian kelas <strong>{selectedReport?.kelas}</strong> yang diajukan oleh Ketua Kelas <strong>{selectedReport?.ketua_kelas_nama}</strong>.
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Setelah disetujui, laporan ini akan masuk ke dalam rekapitulasi kompilasi resmi program studi bagi Kaprodi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tindak Lanjut / Rekomendasi Dosen Wali *</label>
            <textarea
              rows={3}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Tuliskan arahan, tindak lanjut prodi, atau catatan persetujuan untuk kelas ini..."
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
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
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
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
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
                <p className="text-blue-800 text-xs mt-0.5 font-medium">
                  Hadir {selectedSession.hadir_mahasiswa} dari {selectedSession.total_mahasiswa} mahasiswa ({Math.round((selectedSession.hadir_mahasiswa / selectedSession.total_mahasiswa) * 100)}%)
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Topik Bahasan Sesi:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedSession.topik_bahasan}
                </p>
              </div>

              {selectedSession.catatan_per_mahasiswa.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Catatan Khusus Bimbingan Mahasiswa:</span>
                  <div className="space-y-1.5">
                    {selectedSession.catatan_per_mahasiswa.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">{m.nama} ({m.nim})</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.hadir ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {m.hadir ? 'Hadir' : 'Tidak Hadir'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1">{m.catatan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Rekomendasi Dosen Wali:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedSession.rekomendasi}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Rencana Tindak Lanjut:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedSession.rencana_tindak_lanjut}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
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

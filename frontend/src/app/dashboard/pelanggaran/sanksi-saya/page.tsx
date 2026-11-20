'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import {
  mockStudentViolations,
  mockSanctionActivityLogs,
} from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type {
  StudentViolation,
  SanctionActivityLog,
  ViolationType,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Clock,
  Plus,
  FileText,
  Upload,
  MapPin,
  Lock,
  Eye,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Search,
} from 'lucide-react';

const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  AKADEMIK: 'Pelanggaran Akademik',
  NON_AKADEMIK: 'Pelanggaran Non-Akademik',
  KODE_ETIK: 'Pelanggaran Kode Etik',
};

export default function SanksiSosialSayaPage() {
  const [violations, setViolations] = useState<StudentViolation[]>(mockStudentViolations);
  const [logs, setLogs] = useState<SanctionActivityLog[]>(mockSanctionActivityLogs);
  const [selectedViolationId, setSelectedViolationId] = useState<string>(
    mockStudentViolations[0]?.id ?? ''
  );
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<SanctionActivityLog | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for new sanction activity log
  const [tanggal, setTanggal] = useState('2024-11-04');
  const [durasiJam, setDurasiJam] = useState('2');
  const [lokasi, setLokasi] = useState('');
  const [uraian, setUraian] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      const storedViolations = storageSync.get<StudentViolation[]>(
        STORAGE_KEYS.VIOLATIONS,
        mockStudentViolations
      );
      const storedLogs = storageSync.get<SanctionActivityLog[]>(
        STORAGE_KEYS.SANCTION_LOGS,
        mockSanctionActivityLogs
      );
      setViolations(storedViolations);
      setLogs(storedLogs);
    };

    syncFromStorage();
    window.addEventListener('simpro_storage_change', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('simpro_storage_change', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  // Student's active violation cases (defaults to demo student NIM 220101088 / Budi Darmawan, or all active cases in demo)
  const myViolations = useMemo(() => {
    const budiCases = violations.filter((v) => v.mahasiswa_nim === '220101088');
    return budiCases.length > 0 ? budiCases : violations;
  }, [violations]);

  const activeViolation = useMemo(() => {
    return (
      myViolations.find((v) => v.id === selectedViolationId) ??
      myViolations[0] ??
      null
    );
  }, [myViolations, selectedViolationId]);

  const caseLogs = useMemo(() => {
    if (!activeViolation) return [];
    return logs.filter((l) => l.violation_id === activeViolation.id);
  }, [logs, activeViolation]);

  const totalVerified = useMemo(() => {
    return caseLogs
      .filter((l) => l.status === 'TERVERIFIKASI')
      .reduce((acc, l) => acc + l.durasi_jam, 0);
  }, [caseLogs]);

  const totalPending = useMemo(() => {
    return caseLogs
      .filter((l) => l.status === 'MENUNGGU')
      .reduce((acc, l) => acc + l.durasi_jam, 0);
  }, [caseLogs]);

  const totalRequired = activeViolation?.total_jam_sanksi ?? 0;
  const remainingHours = Math.max(0, totalRequired - totalVerified);
  const progressPercent =
    totalRequired > 0
      ? Math.min(100, Math.round((totalVerified / totalRequired) * 100))
      : 0;

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return caseLogs.filter((l) => {
      const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
      const matchesSearch =
        !q ||
        l.lokasi.toLowerCase().includes(q) ||
        l.uraian_kegiatan.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [caseLogs, filterStatus, searchQuery]);

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeViolation) return;

    const parsedDuration = parseFloat(durasiJam);
    if (!tanggal || !lokasi.trim() || !uraian.trim()) {
      setFormError('Mohon lengkapi tanggal, lokasi, dan uraian kegiatan sanksi sosial.');
      return;
    }
    if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 24) {
      setFormError('Durasi jam harus bernilai antara 0.5 hingga 24 jam.');
      return;
    }

    const newLog: SanctionActivityLog = {
      id: `sact-${Date.now()}`,
      violation_id: activeViolation.id,
      mahasiswa_nim: activeViolation.mahasiswa_nim,
      mahasiswa_nama: activeViolation.mahasiswa_nama,
      tanggal,
      durasi_jam: Math.round(parsedDuration * 10) / 10,
      lokasi: lokasi.trim(),
      uraian_kegiatan: uraian.trim(),
      bukti_url: fileName
        ? `/uploads/${fileName}`
        : '/docs/bukti-sanksi-sosial-baru.pdf',
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };

    const updated = storageSync.prepend(
      STORAGE_KEYS.SANCTION_LOGS,
      newLog,
      mockSanctionActivityLogs
    );
    setLogs(updated);
    setShowLogModal(false);
    setFormError(null);
    setLokasi('');
    setUraian('');
    setDurasiJam('2');
    setFileName(null);
    setFileSize(null);
    setNotification(
      `Aktivitas sanksi sosial (${newLog.durasi_jam} Jam) berhasil dikirim dan menunggu verifikasi Dosen Verifikator.`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  const columns: DataTableColumn<SanctionActivityLog>[] = [
    {
      key: 'tanggal',
      header: 'Tanggal & Durasi',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            {formatDate(row.tanggal)}
          </span>
          <p className="text-[11px] text-slate-500 font-mono">
            Durasi: <strong className="text-blue-700">{row.durasi_jam} Jam</strong>
          </p>
        </div>
      ),
    },
    {
      key: 'lokasi',
      header: 'Lokasi Kegiatan',
      render: (row) => (
        <div className="flex items-start gap-1.5 text-xs text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{row.lokasi}</span>
        </div>
      ),
    },
    {
      key: 'uraian',
      header: 'Uraian Aktivitas Sanksi',
      render: (row) => (
        <div className="space-y-1 max-w-md">
          <p className="text-xs text-slate-800 line-clamp-2">{row.uraian_kegiatan}</p>
          {row.catatan_verifikator && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded">
              Catatan Dosen: {row.catatan_verifikator}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti Sah',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedLogForDetail(row)}
          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Lihat Bukti</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          {row.status === 'TERVERIFIKASI' && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Lock className="h-2.5 w-2.5 text-slate-400" />
              Terkunci resmi
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Detail',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedLogForDetail(row)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
        title="Sanksi Sosial Saya"
        description="Portal pelaporan mandiri pelaksanaan jam sanksi sosial bagi mahasiswa: pantau sisa kewajiban jam sanksi, catat kegiatan pengabdian/kerja sosial, dan unggah bukti sah untuk diverifikasi dosen."
        actions={
          activeViolation && remainingHours > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowLogModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Aktivitas Sanksi</span>
            </button>
          ) : undefined
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

      {/* Case Selector if student has more than 1 violation */}
      {myViolations.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600">Pilih Kasus Sanksi:</span>
          {myViolations.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedViolationId(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activeViolation?.id === v.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {v.dasar_keputusan}
            </button>
          ))}
        </div>
      )}

      {!activeViolation ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-2">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            Tidak Ada Catatan Pelanggaran Aktif
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Anda tidak memiliki kewajiban jam sanksi sosial yang perlu diselesaikan pada periode akademik ini.
          </p>
        </div>
      ) : (
        <>
          {/* Violation & Sanction Progress Overview */}
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-blue-50/60 p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                    <ShieldAlert className="h-3 w-3" />
                    {VIOLATION_TYPE_LABELS[activeViolation.jenis_pelanggaran]}
                  </span>
                  <StatusBadge status={activeViolation.tingkat} size="sm" />
                  <StatusBadge
                    status={remainingHours === 0 ? 'SELESAI' : activeViolation.status_sanksi}
                    size="sm"
                  />
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    SK: {activeViolation.dasar_keputusan}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {activeViolation.judul_kasus}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeViolation.uraian}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>
                    Mahasiswa: <strong className="text-slate-900">{activeViolation.mahasiswa_nama}</strong> ({activeViolation.mahasiswa_nim})
                  </span>
                  <span>
                    Tanggal Pelanggaran: <strong className="text-slate-900">{formatDate(activeViolation.tanggal_pelanggaran)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    Verifikator: <strong className="text-slate-900">{activeViolation.dosen_verifikator_nama}</strong>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="pt-1.5 max-w-md space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Kemajuan Pemenuhan Sanksi Sosial:</span>
                    <span className={progressPercent >= 100 ? 'text-emerald-700' : 'text-blue-700'}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/90 p-4 rounded-xl border border-slate-200 shrink-0">
                <div className="text-center px-2">
                  <span className="text-2xl font-black text-slate-900">{totalRequired}</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Wajib (Jam)</p>
                </div>
                <div className="text-center px-2">
                  <span className="text-2xl font-black text-emerald-600">{totalVerified}</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Terpenuhi</p>
                </div>
                <div className="text-center px-2">
                  <span className="text-2xl font-black text-amber-600">{totalPending}</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Menunggu</p>
                </div>
                <div className="text-center px-2">
                  <span className="text-2xl font-black text-rose-600">{remainingHours}</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Sisa Jam</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Pelaksanaan Sanksi Sosial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap aktivitas sosial wajib disertai bukti sah dan diverifikasi Dosen Verifikator sebelum mengurangi sisa jam sanksi.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari lokasi atau kegiatan..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none w-full sm:w-52"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['ALL', 'MENUNGGU', 'TERVERIFIKASI', 'DITOLAK'] as const).map((st) => (
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
                        ? 'Semua'
                        : st === 'MENUNGGU'
                          ? 'Menunggu'
                          : st === 'TERVERIFIKASI'
                            ? 'Disetujui'
                            : 'Ditolak'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DataTable
              data={filteredLogs}
              columns={columns}
              emptyMessage="Belum ada catatan aktivitas sanksi sosial untuk filter yang dipilih."
            />
          </div>
        </>
      )}

      {/* MODAL: Catat Aktivitas Sanksi Sosial */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Formulir Pelaporan Sanksi Sosial"
      >
        <form onSubmit={handleSaveLog} className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Ketentuan Pelaksanaan Sanksi Sosial:</p>
              <p className="mt-0.5">
                Catat kegiatan layanan sosial yang Anda lakukan beserta bukti pengesahan dari unit/laboran/perpustakaan terkait. Jam yang telah disetujui dosen akan terkunci permanen.
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Durasi Kegiatan (Jam) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={durasiJam}
                onChange={(e) => setDurasiJam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lokasi Pelaksanaan *
            </label>
            <input
              type="text"
              placeholder="Contoh: Perpustakaan Pusat, Taman & Selasar Prodi, Lab Komputer..."
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Uraian Aktivitas Sanksi Sosial *
            </label>
            <textarea
              rows={3}
              placeholder="Deskripsikan pekerjaan sosial yang dilakukan dan petugas penanggung jawab di lokasi..."
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Bukti Foto / Surat Keterangan Pelaksanaan (PDF/JPG/PNG)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-700 font-medium">
                Pilih berkas bukti pelaksanaan sanksi
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Format didukung: PDF, JPG, PNG (Maks. 5MB)
              </p>
              <input
                type="file"
                className="hidden"
                id="file-sanksi-sosial"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setFileName(file.name);
                    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                  }
                }}
              />
              <label htmlFor="file-sanksi-sosial" className="block mt-2">
                <span className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100 shadow-xs inline-block">
                  {fileName ? `${fileName} (${fileSize})` : 'Pilih Berkas dari Komputer'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
            >
              Kirim ke Dosen Verifikator
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Detail Entri & Bukti */}
      {selectedLogForDetail && (
        <Modal
          isOpen={!!selectedLogForDetail}
          onClose={() => setSelectedLogForDetail(null)}
          title="Detail Bukti & Catatan Sanksi Sosial"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Pelaksanaan Sanksi ({selectedLogForDetail.durasi_jam} Jam)</span>
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  {formatDate(selectedLogForDetail.tanggal)} • {selectedLogForDetail.lokasi}
                </p>
              </div>
              <StatusBadge status={selectedLogForDetail.status} size="md" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Lokasi Kegiatan:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedLogForDetail.lokasi}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-0.5">
                  Uraian Aktivitas yang Dilakukan:
                </span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedLogForDetail.uraian_kegiatan}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  Bukti Berkas yang Dilampirkan:
                </span>
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-1.5">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-xs">
                    {selectedLogForDetail.bukti_url?.split('/').pop() || 'dokumen-bukti-sanksi.pdf'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Lampiran Pelaksanaan Sanksi Sosial SIMPRO
                  </p>
                </div>
              </div>

              {selectedLogForDetail.catatan_verifikator && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">
                    Catatan Dosen Verifikator:
                  </span>
                  <p className="text-amber-800">{selectedLogForDetail.catatan_verifikator}</p>
                  {selectedLogForDetail.diverifikasi_oleh && (
                    <p className="text-[10px] text-amber-700 pt-0.5">
                      Ditinjau oleh: {selectedLogForDetail.diverifikasi_oleh}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
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

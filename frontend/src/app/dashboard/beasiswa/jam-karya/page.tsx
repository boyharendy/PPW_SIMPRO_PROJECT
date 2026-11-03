'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockScholarshipWorkLogs, mockScholarshipRecipients } from '@/lib/mock-data';
import type { ScholarshipWorkLog, WorkLogCategory, WorkLogStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  Upload,
  Calendar,
  MapPin,
  FileCheck,
  Lock,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Filter,
} from 'lucide-react';

export default function PencatatanJamKaryaPage() {
  const [logs, setLogs] = useState<ScholarshipWorkLog[]>(mockScholarshipWorkLogs);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<ScholarshipWorkLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Current student demo info
  const myRecipient = mockScholarshipRecipients[1]; // Dewi Lestari, 60 jam

  // Form states
  const [tanggal, setTanggal] = useState('2024-11-03');
  const [jamMulai, setJamMulai] = useState('09:00');
  const [jamSelesai, setJamSelesai] = useState('13:00');
  const [lokasi, setLokasi] = useState('');
  const [kategori, setKategori] = useState<WorkLogCategory>('ASISTENSI_LAB');
  const [uraian, setUraian] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  // Auto calculate duration in hours
  const calculateDuration = () => {
    try {
      const [startH, startM] = jamMulai.split(':').map(Number);
      const [endH, endM] = jamSelesai.split(':').map(Number);
      const diffHours = (endH + endM / 60) - (startH + startM / 60);
      return diffHours > 0 ? Math.round(diffHours * 10) / 10 : 1;
    } catch {
      return 2;
    }
  };

  const handleSaveLog = () => {
    if (!lokasi || !uraian) {
      alert('Mohon lengkapi lokasi dan uraian kegiatan!');
      return;
    }
    const durasi = calculateDuration();

    const newLog: ScholarshipWorkLog = {
      id: `wlog-${Date.now()}`,
      recipient_id: myRecipient.id,
      mahasiswa_nim: myRecipient.mahasiswa_nim,
      mahasiswa_nama: myRecipient.mahasiswa_nama,
      tanggal,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      durasi_jam: durasi,
      lokasi,
      uraian_kegiatan: uraian,
      kategori_kegiatan: kategori,
      bukti_url: fileName ? `/uploads/${fileName}` : '/docs/bukti-jam-karya-default.pdf',
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setShowLogModal(false);
    setLokasi('');
    setUraian('');
    setFileName(null);
    setFileSize(null);
    setNotification(`Entri jam karya (${durasi} Jam) berhasil diajukan dan sedang menunggu verifikasi Dosen Verifikator.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const totalVerified = logs
    .filter((l) => l.status === 'TERVERIFIKASI')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const totalPending = logs
    .filter((l) => l.status === 'MENUNGGU')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const remainingHours = Math.max(0, myRecipient.kewajiban_jam - totalVerified);
  const progressPercent = Math.min(100, Math.round((totalVerified / myRecipient.kewajiban_jam) * 100));

  const filteredLogs = logs.filter((l) => {
    return filterStatus === 'ALL' || l.status === filterStatus;
  });

  const columns = [
    {
      key: 'tanggal',
      header: 'Tanggal & Durasi',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.jam_mulai} - {row.jam_selesai} (<strong className="text-blue-700">{row.durasi_jam} Jam</strong>)
          </p>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori & Lokasi',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-1">
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
            {row.kategori_kegiatan.replace('_', ' ')}
          </span>
          <p className="text-[11px] text-slate-600 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" />
            <span>{row.lokasi}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'uraian',
      header: 'Uraian Kegiatan Jam Karya',
      render: (row: ScholarshipWorkLog) => (
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
      render: (row: ScholarshipWorkLog) => (
        <button
          onClick={() => setSelectedLogForDetail(row)}
          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Lihat Bukti</span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (row: ScholarshipWorkLog) => (
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
      render: (row: ScholarshipWorkLog) => (
        <button
          onClick={() => setSelectedLogForDetail(row)}
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
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/beasiswa" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Beasiswa</span>
        </Link>
      </div>

      <PageHeader
        title="Pencatatan Jam Karya Mandiri"
        description="Portal pencatatan mandiri kegiatan jam karya bagi mahasiswa penerima beasiswa: isi waktu kegiatan, lokasi, uraian tugas, dan unggah bukti pendukung untuk diverifikasi Dosen Verifikator."
        actions={
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Jam Karya Baru</span>
          </button>
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

      {/* Student Progress Overview */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-full">
                {myRecipient.jenis_beasiswa} • {myRecipient.periode}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Angkatan {myRecipient.angkatan}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {myRecipient.mahasiswa_nama} <span className="text-slate-500 font-normal">({myRecipient.mahasiswa_nim})</span>
            </h3>
            <p className="text-xs text-slate-600">
              Dosen Verifikator Pembina: <strong>{myRecipient.dosen_verifikator_nama}</strong>
            </p>

            {/* Visual Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Kemajuan Pemenuhan Kewajiban:</span>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/80 p-4 rounded-xl border border-blue-100">
            <div className="text-center px-2">
              <span className="text-2xl font-black text-blue-700">{myRecipient.kewajiban_jam}</span>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Wajib (Jam)</p>
            </div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-emerald-600">{totalVerified}</span>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Disetujui</p>
            </div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-amber-600">{totalPending}</span>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Menunggu</p>
            </div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-slate-700">{remainingHours}</span>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Sisa Jam</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Entries */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Riwayat Catatan Jam Karya Mandiri</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh jam kegiatan yang Anda catat akan diverifikasi dosen sebelum dihitung resmi.
            </p>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'MENUNGGU', 'TERVERIFIKASI', 'DITOLAK'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'MENUNGGU' ? 'Menunggu' : st === 'TERVERIFIKASI' ? 'Disetujui' : 'Ditolak'}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          data={filteredLogs}
          columns={columns}
          searchPlaceholder="Cari catatan jam karya atau lokasi..."
          searchKey="uraian_kegiatan"
        />
      </div>

      {/* MODAL: Input Jam Karya */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Formulir Pencatatan Jam Karya Mandiri"
      >
        <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs">
            <p className="font-semibold">Ketentuan Pengisian Jam Karya:</p>
            <p className="mt-0.5">
              Isikan data kegiatan jam karya yang Anda lakukan di lingkungan prodi/universitas secara akurat. Unggah foto atau berkas presensi/surat tugas sebagai bukti sah. Entri yang telah disetujui dosen akan terkunci secara permanen.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai *</label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai *</label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
            <span>Kalkulasi Otomatis Durasi Kegiatan:</span>
            <span className="font-bold text-sm text-blue-800">{calculateDuration()} Jam</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Kegiatan *</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as WorkLogCategory)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="ASISTENSI_LAB">Asistensi Praktikum / Laboratorium</option>
                <option value="ADMINISTRASI_PRODI">Bantuan Administrasi Tata Usaha Prodi</option>
                <option value="KEPANITIAAN_ACARA">Kepanitiaan Acara & Seminar Prodi</option>
                <option value="BANTUAN_RISET">Bantuan Riset Dosen</option>
                <option value="LAINNYA">Lain-lain / Pengabdian</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi / Tempat *</label>
              <input
                type="text"
                placeholder="Contoh: Lab Rekayasa Perangkat Lunak, Ruang Tata Usaha..."
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian Rinci Tugas & Hasil Kegiatan *</label>
            <textarea
              rows={3}
              placeholder="Deskripsikan pekerjaan yang Anda lakukan dan hasil yang dicapai secara rinci..."
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Bukti Foto / Berkas Tanda Terima (PDF/JPG/PNG) *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-700 font-medium">Pilih berkas bukti sah kegiatan</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Format didukung: PDF, JPG, PNG (Maks. 5MB)</p>
              <input
                type="file"
                className="hidden"
                id="file-jam-karya"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setFileName(file.name);
                    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                  }
                }}
              />
              <label htmlFor="file-jam-karya" className="block mt-2">
                <span className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100 shadow-xs inline-block">
                  {fileName ? `${fileName} (${fileSize})` : 'Pilih Berkas dari Komputer'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowLogModal(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveLog}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              Kirim ke Dosen Verifikator
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Detail Entri & Bukti */}
      {selectedLogForDetail && (
        <Modal
          isOpen={!!selectedLogForDetail}
          onClose={() => setSelectedLogForDetail(null)}
          title="Detail Bukti & Catatan Jam Karya"
        >
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedLogForDetail.kategori_kegiatan.replace('_', ' ')}
                </h4>
                <p className="text-slate-500 text-xs">
                  {formatDate(selectedLogForDetail.tanggal)} • {selectedLogForDetail.jam_mulai} - {selectedLogForDetail.jam_selesai} ({selectedLogForDetail.durasi_jam} Jam)
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
                <span className="font-bold text-slate-700 block mb-0.5">Uraian Tugas yang Dilakukan:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedLogForDetail.uraian_kegiatan}
                </p>
              </div>

              {/* Mock Document Visual */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">Bukti Berkas yang Dilampirkan:</span>
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-2">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-xs">
                    {selectedLogForDetail.bukti_url?.split('/').pop() || 'dokumen-bukti-kegiatan.pdf'}
                  </p>
                  <p className="text-[10px] text-slate-500">Berkas Sah Tervalidasi Sistem SIMPRO</p>
                  <button
                    onClick={() => alert(`Membuka lampiran: ${selectedLogForDetail.bukti_url}`)}
                    className="px-3 py-1 bg-white border border-slate-300 text-blue-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-xs inline-flex items-center gap-1"
                  >
                    <span>Unduh / Buka Dokumen</span>
                  </button>
                </div>
              </div>

              {selectedLogForDetail.catatan_verifikator && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">Catatan Dosen Verifikator:</span>
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
                onClick={() => setSelectedLogForDetail(null)}
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

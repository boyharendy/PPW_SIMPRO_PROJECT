'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockScholarshipWorkLogs, mockScholarshipRecipients } from '@/lib/mock-data';
import type { ScholarshipWorkLog, WorkLogCategory } from '@/lib/types';
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
} from 'lucide-react';

export default function PencatatanJamKaryaPage() {
  const [logs, setLogs] = useState<ScholarshipWorkLog[]>(mockScholarshipWorkLogs);
  const [showLogModal, setShowLogModal] = useState(false);

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
    if (!lokasi || !uraian) return;
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
  };

  const totalVerified = logs
    .filter((l) => l.status === 'TERVERIFIKASI')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const totalPending = logs
    .filter((l) => l.status === 'MENUNGGU')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const remainingHours = Math.max(0, myRecipient.kewajiban_jam - totalVerified);

  const columns = [
    {
      key: 'tanggal',
      header: 'Tanggal & Jam',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.jam_mulai} - {row.jam_selesai} ({row.durasi_jam} Jam)
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
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-1.5 rounded">
              Catatan Dosen: {row.catatan_verifikator}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti Kegiatan',
      render: (row: ScholarshipWorkLog) => (
        row.bukti_url ? (
          <span className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium">
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Bukti</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      render: (row: ScholarshipWorkLog) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/beasiswa" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Beasiswa</span>
        </Link>
      </div>

      <PageHeader
        title="Pencatatan Jam Karya Mahasiswa (FR-06)"
        description="Mahasiswa penerima beasiswa mencatat mandiri rincian jam karya (tanggal, durasi jam, lokasi, uraian, dan lampiran bukti). Entri akan diverifikasi oleh Dosen Verifikator."
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

      {/* Student Progress Overview */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-full">
              {myRecipient.jenis_beasiswa} • {myRecipient.periode}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {myRecipient.mahasiswa_nama} ({myRecipient.mahasiswa_nim})
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Dosen Verifikator Pembina: <strong>{myRecipient.dosen_verifikator_nama}</strong>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-2xl font-black text-blue-700">{myRecipient.kewajiban_jam}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Kewajiban Jam</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-emerald-600">{totalVerified}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Jam Terverifikasi</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-amber-600">{totalPending}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Menunggu Verifikasi</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-slate-700">{remainingHours}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Sisa Kewajiban</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Entries */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Riwayat Catatan Jam Karya Mandiri</h3>
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Cari catatan jam karya atau lokasi..."
          searchKey="uraian_kegiatan"
        />
      </div>

      {/* MODAL: Input Jam Karya (FR-06) */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Catat Kegiatan Jam Karya Mandiri (FR-06)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Isi formulir jam karya secara jujur beserta bukti pendukung foto/dokumen. Durasi jam dihitung otomatis dari jam mulai hingga jam selesai.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai *</label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai *</label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-between">
            <span>Estimasi Durasi Jam Karya:</span>
            <span className="font-bold text-sm">{calculateDuration()} Jam</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Kegiatan *</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as WorkLogCategory)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              >
                <option value="ASISTENSI_LAB">Asistensi Praktikum / Laboratorium</option>
                <option value="ADMINISTRASI_PRODI">Bantuan Administrasi Tata Usaha</option>
                <option value="KEPANITIAAN_ACARA">Kepanitiaan Acara & Seminar Prodi</option>
                <option value="BANTUAN_RISET">Bantuan Riset Dosen</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
              <input
                type="text"
                placeholder="Contoh: Lab Komputer 3, Ruang TU Prodi..."
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian Rinci Kegiatan yang Dilakukan *</label>
            <textarea
              rows={3}
              placeholder="Deskripsikan pekerjaan yang Anda lakukan secara detail..."
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Bukti Foto / Berkas Tanda Terima (PDF/JPG/PNG) *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600">Klik untuk memilih berkas bukti kegiatan jam karya</p>
              <p className="text-[10px] text-slate-400 mt-1">Maksimum ukuran berkas 5MB</p>
              <input
                type="file"
                className="hidden"
                id="file-jam-karya"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileName(e.target.files[0].name);
                  }
                }}
              />
              <label htmlFor="file-jam-karya" className="block mt-2">
                <span className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
                  {fileName ? fileName : 'Pilih Berkas'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowLogModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveLog}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Kirim ke Dosen Verifikator
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

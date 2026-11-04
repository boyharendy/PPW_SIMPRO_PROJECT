'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockStudentViolations, mockSanctionActivityLogs } from '@/lib/mock-data';
import type { SanctionActivityLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Upload,
  FileText,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

export default function SanksiSayaPage() {
  const [logs, setLogs] = useState<SanctionActivityLog[]>(mockSanctionActivityLogs);
  const [showModal, setShowModal] = useState(false);

  // Active student case demo
  const activeViolation = mockStudentViolations[0]; // Budi Darmawan

  // Form states
  const [tanggal, setTanggal] = useState('2024-11-03');
  const [durasiJam, setDurasiJam] = useState('4');
  const [lokasi, setLokasi] = useState('');
  const [uraian, setUraian] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const totalVerified = logs
    .filter((l) => l.status === 'TERVERIFIKASI')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const totalPending = logs
    .filter((l) => l.status === 'MENUNGGU')
    .reduce((acc, l) => acc + l.durasi_jam, 0);

  const remaining = Math.max(0, activeViolation.total_jam_sanksi - totalVerified);

  const handleSaveActivity = () => {
    if (!lokasi || !uraian) return;
    const durasi = parseInt(durasiJam) || 2;

    const newLog: SanctionActivityLog = {
      id: `sact-${Date.now()}`,
      violation_id: activeViolation.id,
      mahasiswa_nim: activeViolation.mahasiswa_nim,
      mahasiswa_nama: activeViolation.mahasiswa_nama,
      tanggal,
      durasi_jam: durasi,
      lokasi,
      uraian_kegiatan: uraian,
      bukti_url: fileName ? `/uploads/${fileName}` : '/docs/bukti-sanksi-default.pdf',
      status: 'MENUNGGU',
      created_at: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setShowModal(false);
    setLokasi('');
    setUraian('');
    setFileName(null);
  };

  const columns = [
    {
      key: 'tanggal',
      header: 'Tanggal & Durasi',
      render: (row: SanctionActivityLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] font-bold text-blue-700">{row.durasi_jam} Jam Kerja Sosial</p>
        </div>
      ),
    },
    {
      key: 'lokasi',
      header: 'Lokasi Pelaksanaan',
      render: (row: SanctionActivityLog) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.lokasi}</span>
        </span>
      ),
    },
    {
      key: 'uraian',
      header: 'Uraian Pekerjaan Sosial',
      render: (row: SanctionActivityLog) => (
        <div className="space-y-1 max-w-md">
          <p className="text-xs text-slate-800 line-clamp-2">{row.uraian_kegiatan}</p>
          {row.catatan_verifikator && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-1.5 rounded">
              Catatan Verifikator: {row.catatan_verifikator}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti Pelaksanaan',
      render: (row: SanctionActivityLog) => (
        row.bukti_url ? (
          <span className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer">
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Lampiran</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SanctionActivityLog) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/pelanggaran" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Data Pelanggaran</span>
        </Link>
      </div>

      <PageHeader
        title="Catat Pelaksanaan Sanksi Sosial (FR-10)"
        description="Mahasiswa yang bersangkutan mencatat pelaksanaan kegiatan sanksi sosial (tanggal, durasi jam, lokasi, uraian aktivitas, dan berkas bukti penanggung jawab)."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Kegiatan Sanksi Baru</span>
          </button>
        }
      />

      {/* Overview Card */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-300">
                {activeViolation.tingkat} • {activeViolation.jenis_pelanggaran}
              </span>
              <span className="text-xs text-slate-500 font-mono">BA: {activeViolation.dasar_keputusan}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">{activeViolation.judul_kasus}</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">{activeViolation.uraian}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-2xl font-black text-slate-800">{activeViolation.total_jam_sanksi}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Total Jam Sanksi</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-emerald-600">{totalVerified}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Jam Terpenuhi</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-amber-600">{totalPending}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Menunggu Verifikasi</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-rose-700">{remaining}</span>
              <p className="text-[11px] text-slate-500 font-semibold">Sisa Jam Sanksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Riwayat Pelaksanaan Jam Sanksi Sosial</h3>
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Cari riwayat sanksi atau lokasi..."
          searchKey="uraian_kegiatan"
        />
      </div>

      {/* MODAL: Input Pelaksanaan Sanksi (FR-10) */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Formulir Pelaksanaan Sanksi Sosial (FR-10)"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Isikan aktivitas kegiatan kerja sosial yang telah Anda laksanakan di lingkungan kampus beserta bukti tanda tangan pengawas lapangan atau foto dokumentasi.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Kerja Sosial (Jam) *</label>
              <input
                type="number"
                value={durasiJam}
                onChange={(e) => setDurasiJam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kerja Sosial *</label>
            <input
              type="text"
              placeholder="Contoh: Perpustakaan Pusat, Laboratorium Komputer 1, Selasar Gedung A..."
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian Rinci Aktivitas yang Dilakukan *</label>
            <textarea
              rows={3}
              placeholder="Tuliskan tugas kerja sosial yang telah Anda selesaikan..."
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lampiran Bukti Foto / Dokumen Bertandatangan Pengawas *</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600">Klik untuk mengunggah bukti pelaksanaan</p>
              <input
                type="file"
                className="hidden"
                id="file-sanksi"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileName(e.target.files[0].name);
                  }
                }}
              />
              <label htmlFor="file-sanksi" className="block mt-2">
                <span className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
                  {fileName ? fileName : 'Pilih Berkas'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveActivity}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Simpan & Kirim ke Dosen Verifikator
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

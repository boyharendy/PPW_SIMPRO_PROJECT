'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockSanctionActivityLogs } from '@/lib/mock-data';
import type { SanctionActivityLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function VerifikasiSanksiPage() {
  const [logs, setLogs] = useState<SanctionActivityLog[]>(mockSanctionActivityLogs);
  const [selectedLog, setSelectedLog] = useState<SanctionActivityLog | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pending = logs.filter((l) => l.status === 'MENUNGGU');
  const verified = logs.filter((l) => l.status === 'TERVERIFIKASI');

  const handleDecision = () => {
    if (!selectedLog) return;
    const isApprove = actionType === 'APPROVE';

    setLogs(
      logs.map((l) =>
        l.id === selectedLog.id
          ? {
              ...l,
              status: isApprove ? 'TERVERIFIKASI' : 'DITOLAK',
              catatan_verifikator: notes || (isApprove ? 'Kegiatan sanksi sosial telah diverifikasi sah.' : 'Bukti pelaksanaan tidak mencukupi.'),
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
              diverifikasi_at: new Date().toISOString(),
            }
          : l
      )
    );

    if (isApprove) {
      setToastMessage(`Entri sanksi sosial ${selectedLog.durasi_jam} jam atas nama ${selectedLog.mahasiswa_nama} berhasil diverifikasi! Sisa jam sanksi otomatis berkurang.`);
    } else {
      setToastMessage(`Entri sanksi sosial ditolak dengan catatan.`);
    }

    setTimeout(() => setToastMessage(null), 5000);
    setSelectedLog(null);
    setNotes('');
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row: SanctionActivityLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500 font-mono">NIM: {row.mahasiswa_nim}</p>
        </div>
      ),
    },
    {
      key: 'waktu',
      header: 'Tanggal & Durasi',
      render: (row: SanctionActivityLog) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] font-bold text-blue-700">{row.durasi_jam} Jam Sanksi</p>
        </div>
      ),
    },
    {
      key: 'lokasi',
      header: 'Lokasi & Uraian Aktivitas',
      render: (row: SanctionActivityLog) => (
        <div className="space-y-1 max-w-sm">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {row.lokasi}
          </span>
          <p className="text-xs text-slate-700 line-clamp-2">{row.uraian_kegiatan}</p>
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti Pengawas',
      render: (row: SanctionActivityLog) => (
        row.bukti_url ? (
          <span className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer">
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Lampiran</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Tidak ada</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SanctionActivityLog) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi Verifikasi',
      render: (row: SanctionActivityLog) => (
        row.status === 'MENUNGGU' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedLog(row);
                setActionType('APPROVE');
                setNotes('Pelaksanaan sanksi sosial telah terkonfirmasi dengan baik.');
              }}
              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verifikasi</span>
            </button>
            <button
              onClick={() => {
                setSelectedLog(row);
                setActionType('REJECT');
                setNotes('');
              }}
              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Tolak</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Telah Diperiksa</span>
        )
      ),
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
        title="Verifikasi Pelaksanaan Sanksi oleh Dosen (FR-11)"
        description="Sistem meneruskan entri pelaksanaan sanksi kepada dosen verifikator, menghitung sisa jam sanksi, dan secara otomatis mengubah status kasus menjadi SELESAI saat seluruh jam terverifikasi terpenuhi."
      />

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Verifikasi"
          value={pending.length.toString()}
          description="Aktivitas sanksi masuk"
          icon="Clock"
        />
        <StatCard
          title="Telah Diverifikasi"
          value={verified.length.toString()}
          description="Jam sanksi resmi terhitung"
          icon="CheckCircle2"
        />
        <StatCard
          title="Otomatisasi Status"
          value="Aktif (FR-11)"
          description="Auto-update status Selesai"
          icon="FileCheck"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Daftar Pengajuan Pelaksanaan Sanksi Sosial Mahasiswa</h3>
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Cari mahasiswa atau lokasi..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* Modal Verifikasi */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={actionType === 'APPROVE' ? 'Konfirmasi Verifikasi Jam Sanksi' : 'Tolak Laporan Sanksi'}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p className="font-bold text-slate-800">{selectedLog.mahasiswa_nama} ({selectedLog.mahasiswa_nim})</p>
              <p className="text-slate-600 text-xs">
                Tanggal: {formatDate(selectedLog.tanggal)} • Beban: {selectedLog.durasi_jam} Jam di {selectedLog.lokasi}
              </p>
              <p className="text-slate-600 text-xs">Aktivitas: {selectedLog.uraian_kegiatan}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionType === 'APPROVE' ? 'Catatan Dosen Verifikator' : 'Alasan Penolakan *'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === 'APPROVE' ? 'Catatan verifikasi...' : 'Sebutkan alasan penolakan...'}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDecision}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionType === 'APPROVE' ? 'Setujui & Kurangi Jam' : 'Tolak Pengajuan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

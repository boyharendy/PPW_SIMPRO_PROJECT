'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockScholarshipWorkLogs } from '@/lib/mock-data';
import type { ScholarshipWorkLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function VerifikasiJamKaryaPage() {
  const [logs, setLogs] = useState<ScholarshipWorkLog[]>(mockScholarshipWorkLogs);
  const [selectedLog, setSelectedLog] = useState<ScholarshipWorkLog | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [notes, setNotes] = useState('');

  const pendingLogs = logs.filter((l) => l.status === 'MENUNGGU');
  const verifiedLogs = logs.filter((l) => l.status === 'TERVERIFIKASI');
  const rejectedLogs = logs.filter((l) => l.status === 'DITOLAK');

  const handleDecision = () => {
    if (!selectedLog) return;
    const newStatus = actionType === 'APPROVE' ? 'TERVERIFIKASI' : 'DITOLAK';

    setLogs(
      logs.map((l) =>
        l.id === selectedLog.id
          ? {
              ...l,
              status: newStatus,
              catatan_verifikator: notes || (actionType === 'APPROVE' ? 'Disetujui dosen verifikator.' : 'Ditolak: bukti kurang lengkap.'),
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
              diverifikasi_at: new Date().toISOString(),
            }
          : l
      )
    );

    setSelectedLog(null);
    setNotes('');
  };

  const columns = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500">NIM: {row.mahasiswa_nim}</p>
        </div>
      ),
    },
    {
      key: 'waktu',
      header: 'Tanggal & Durasi',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            {row.jam_mulai} - {row.jam_selesai} (<strong className="text-blue-700">{row.durasi_jam} Jam</strong>)
          </p>
        </div>
      ),
    },
    {
      key: 'kegiatan',
      header: 'Kategori & Uraian',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-1 max-w-sm">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {row.kategori_kegiatan.replace('_', ' ')}
          </span>
          <p className="text-xs text-slate-700 line-clamp-2">{row.uraian_kegiatan}</p>
          <p className="text-[11px] text-slate-500">Lokasi: {row.lokasi}</p>
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti',
      render: (row: ScholarshipWorkLog) => (
        row.bukti_url ? (
          <span className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer">
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Dokumen</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">Tidak ada bukti</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ScholarshipWorkLog) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi Verifikasi',
      render: (row: ScholarshipWorkLog) => (
        row.status === 'MENUNGGU' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedLog(row);
                setActionType('APPROVE');
                setNotes('Kegiatan terverifikasi valid.');
              }}
              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Setujui</span>
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
          <span className="text-[11px] text-slate-400 italic">Selesai Diverifikasi</span>
        )
      ),
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
        title="Verifikasi Jam Karya oleh Dosen Verifikator (FR-07)"
        description="Setiap entri jam karya mahasiswa diteruskan kepada dosen verifikator untuk disetujui atau ditolak dengan catatan. Hanya jam yang telah diverifikasi yang dihitung masuk rekapitulasi."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingLogs.length.toString()}
          description="Perlu tindakan verifikator"
          icon="Clock"
        />
        <StatCard
          title="Telah Disetujui"
          value={verifiedLogs.length.toString()}
          description="Jam karya terhitung resmi"
          icon="CheckCircle2"
        />
        <StatCard
          title="Ditolak / Perlu Revisi"
          value={rejectedLogs.length.toString()}
          description="Memerlukan perbaikan mahasiswa"
          icon="AlertTriangle"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-900">Antrean Verifikasi Catatan Jam Karya Mahasiswa</h3>
        </div>
        <DataTable
          data={logs}
          columns={columns}
          searchPlaceholder="Cari mahasiswa atau kegiatan..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Verifikasi / Tolak */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={actionType === 'APPROVE' ? 'Setujui Catatan Jam Karya' : 'Tolak Catatan Jam Karya'}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p className="font-bold text-slate-800">{selectedLog.mahasiswa_nama} ({selectedLog.mahasiswa_nim})</p>
              <p className="text-slate-600 text-xs">
                Tanggal: {formatDate(selectedLog.tanggal)} • Jam: {selectedLog.jam_mulai} - {selectedLog.jam_selesai} ({selectedLog.durasi_jam} Jam)
              </p>
              <p className="text-slate-600 text-xs">Uraian: {selectedLog.uraian_kegiatan}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionType === 'APPROVE' ? 'Catatan Verifikasi (Opsional)' : 'Alasan Penolakan (Wajib Diisi) *'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === 'APPROVE' ? 'Catatan apresiasi atau arahan...' : 'Sebutkan alasan penolakan agar mahasiswa dapat memperbaiki...'}
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
                {actionType === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

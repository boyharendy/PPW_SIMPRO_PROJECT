'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { mockScholarshipWorkLogs } from '@/lib/mock-data';
import type { ScholarshipWorkLog, WorkLogStatus } from '@/lib/types';
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
  CheckCircle,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

export default function VerifikasiJamKaryaPage() {
  const [logs, setLogs] = useState<ScholarshipWorkLog[]>(mockScholarshipWorkLogs);
  const [selectedLog, setSelectedLog] = useState<ScholarshipWorkLog | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK' | 'ALL'>('MENUNGGU');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingLogs = logs.filter((l) => l.status === 'MENUNGGU');
  const verifiedLogs = logs.filter((l) => l.status === 'TERVERIFIKASI');
  const rejectedLogs = logs.filter((l) => l.status === 'DITOLAK');

  const displayedLogs = logs.filter((l) => {
    if (activeTab === 'ALL') return true;
    return l.status === activeTab;
  });

  const handleDecision = () => {
    if (!selectedLog) return;
    const newStatus: WorkLogStatus = actionType === 'APPROVE' ? 'TERVERIFIKASI' : 'DITOLAK';

    setLogs(
      logs.map((l) =>
        l.id === selectedLog.id
          ? {
              ...l,
              status: newStatus,
              catatan_verifikator: notes || (actionType === 'APPROVE' ? 'Disetujui dosen verifikator resmi.' : 'Ditolak: bukti kurang lengkap atau uraian tidak sesuai.'),
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
              diverifikasi_at: new Date().toISOString(),
            }
          : l
      )
    );

    const msg = actionType === 'APPROVE'
      ? `Entri jam karya mahasiswa ${selectedLog.mahasiswa_nama} (${selectedLog.durasi_jam} Jam) berhasil disetujui.`
      : `Entri jam karya mahasiswa ${selectedLog.mahasiswa_nama} telah ditolak dengan catatan.`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);

    setSelectedLog(null);
    setNotes('');
  };

  // Batch Approval
  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    setLogs(
      logs.map((l) =>
        selectedIds.includes(l.id)
          ? {
              ...l,
              status: 'TERVERIFIKASI',
              catatan_verifikator: 'Disetujui secara kolektif oleh Dosen Verifikator.',
              diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
              diverifikasi_at: new Date().toISOString(),
            }
          : l
      )
    );

    setToastMessage(`Berhasil menyetujui ${selectedIds.length} entri jam karya mahasiswa secara massal!`);
    setSelectedIds([]);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const toggleSelectAllPending = () => {
    if (selectedIds.length === pendingLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingLogs.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = [
    {
      key: 'select',
      header: activeTab === 'MENUNGGU' ? (
        <button onClick={toggleSelectAllPending} className="p-1 text-slate-500 hover:text-blue-600">
          {selectedIds.length === pendingLogs.length && pendingLogs.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      ) : '',
      render: (row: ScholarshipWorkLog) => (
        row.status === 'MENUNGGU' ? (
          <button onClick={() => toggleSelectOne(row.id)} className="p-1 text-slate-500 hover:text-blue-600">
            {selectedIds.includes(row.id) ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        ) : null
      ),
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row: ScholarshipWorkLog) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">{row.mahasiswa_nama}</span>
          <p className="text-[11px] text-slate-500 font-mono">NIM: {row.mahasiswa_nim}</p>
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
      header: 'Bukti Kegiatan',
      render: (row: ScholarshipWorkLog) => (
        row.bukti_url ? (
          <button
            onClick={() => {
              setSelectedLog(row);
              setActionType('APPROVE');
            }}
            className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Lampiran</span>
          </button>
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
                setNotes('Kegiatan terverifikasi valid dan sesuai penugasan prodi.');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
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
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Tolak</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setSelectedLog(row);
              setActionType(row.status === 'TERVERIFIKASI' ? 'APPROVE' : 'REJECT');
            }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Riwayat</span>
          </button>
        )
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
        title="Verifikasi Jam Karya Mahasiswa"
        description="Layanan verifikasi dan validasi entri jam karya mahasiswa penerima beasiswa: tinjau bukti kegiatan, setujui jam karya resmi, atau berikan catatan perbaikan bila belum sesuai."
        actions={
          selectedIds.length > 0 && activeTab === 'MENUNGGU' ? (
            <button
              onClick={handleBatchApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Setujui {selectedIds.length} Entri Terpilih</span>
            </button>
          ) : undefined
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-800 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingLogs.length.toString()}
          description="Perlu ditinjau dosen verifikator"
          icon="Clock"
        />
        <StatCard
          title="Telah Disetujui"
          value={verifiedLogs.length.toString()}
          description="Jam karya resmi terhitung"
          icon="CheckCircle2"
        />
        <StatCard
          title="Ditolak / Perlu Revisi"
          value={rejectedLogs.length.toString()}
          description="Memerlukan perbaikan mahasiswa"
          icon="AlertTriangle"
        />
      </div>

      {/* Filter Tabs & Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('MENUNGGU')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'MENUNGGU'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Menunggu Verifikasi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'MENUNGGU' ? 'bg-white text-blue-700 font-bold' : 'bg-slate-300 text-slate-800'}`}>
                {pendingLogs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('TERVERIFIKASI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'TERVERIFIKASI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Telah Disetujui</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'TERVERIFIKASI' ? 'bg-white text-blue-700 font-bold' : 'bg-slate-300 text-slate-800'}`}>
                {verifiedLogs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('DITOLAK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'DITOLAK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Ditolak / Revisi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'DITOLAK' ? 'bg-white text-blue-700 font-bold' : 'bg-slate-300 text-slate-800'}`}>
                {rejectedLogs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Entri ({logs.length})
            </button>
          </div>
        </div>

        <DataTable
          data={displayedLogs}
          columns={columns}
          searchPlaceholder="Cari mahasiswa, NIM, atau uraian kegiatan..."
          searchKey="mahasiswa_nama"
        />
      </div>

      {/* MODAL: Tinjau & Keputusan Verifikasi */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={
            selectedLog.status === 'MENUNGGU'
              ? (actionType === 'APPROVE' ? 'Setujui Catatan Jam Karya Mahasiswa' : 'Tolak Catatan Jam Karya Mahasiswa')
              : `Detail Riwayat Verifikasi — ${selectedLog.mahasiswa_nama}`
          }
        >
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 text-xs sm:text-sm">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedLog.mahasiswa_nama}</span>
                <span className="text-slate-500 font-mono text-xs">NIM: {selectedLog.mahasiswa_nim}</span>
              </div>
              <p className="text-slate-600 text-xs">
                Tanggal: <strong>{formatDate(selectedLog.tanggal)}</strong> • Jam: <strong>{selectedLog.jam_mulai} - {selectedLog.jam_selesai}</strong> ({selectedLog.durasi_jam} Jam)
              </p>
              <p className="text-slate-600 text-xs">
                Lokasi: <strong>{selectedLog.lokasi}</strong> • Kategori: <strong>{selectedLog.kategori_kegiatan.replace('_', ' ')}</strong>
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Uraian Rinci Kegiatan:</span>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {selectedLog.uraian_kegiatan}
              </p>
            </div>

            {/* Bukti Lampiran File */}
            <div>
              <span className="font-bold text-slate-700 block mb-1">Bukti Sah yang Dilampirkan:</span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">
                      {selectedLog.bukti_url?.split('/').pop() || 'dokumen-bukti.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-500">Berkas Lampiran Mahasiswa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Membuka berkas: ${selectedLog.bukti_url}`)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100"
                >
                  Buka Berkas
                </button>
              </div>
            </div>

            {/* Verification Form (If status is MENUNGGU) */}
            {selectedLog.status === 'MENUNGGU' ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">Keputusan Verifikasi:</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="decision"
                        checked={actionType === 'APPROVE'}
                        onChange={() => setActionType('APPROVE')}
                      />
                      <span>Setujui Jam Karya</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-rose-700">
                      <input
                        type="radio"
                        name="decision"
                        checked={actionType === 'REJECT'}
                        onChange={() => setActionType('REJECT')}
                      />
                      <span>Tolak / Perlu Revisi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {actionType === 'APPROVE' ? 'Catatan Apresiasi / Arahan Verifikator (Opsional)' : 'Alasan Penolakan (Wajib Diisi)*'}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      actionType === 'APPROVE'
                        ? 'Contoh: Kegiatan terverifikasi sah dan sesuai dengan kebutuhan prodi.'
                        : 'Jelaskan kekurangan atau kesalahan agar mahasiswa dapat memperbaiki lampiran...'
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDecision}
                    className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors ${
                      actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionType === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800">Catatan Hasil Verifikasi:</span>
                <p className="text-slate-700">{selectedLog.catatan_verifikator || '-'}</p>
                <p className="text-[10px] text-slate-500 pt-1">
                  Diverifikasi oleh: <strong>{selectedLog.diverifikasi_oleh || 'Dosen Verifikator'}</strong> pada {selectedLog.diverifikasi_at ? formatDate(selectedLog.diverifikasi_at) : '-'}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

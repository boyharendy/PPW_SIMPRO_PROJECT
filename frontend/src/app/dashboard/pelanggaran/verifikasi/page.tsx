'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import {
  mockSanctionActivityLogs,
  mockStudentViolations,
} from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { SanctionActivityLog, StudentViolation, SanctionStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  CheckCircle,
  CheckSquare,
  Square,
  MapPin,
} from 'lucide-react';

export default function VerifikasiSanksiSosialPage() {
  const [logs, setLogs] = useState<SanctionActivityLog[]>(mockSanctionActivityLogs);
  const [selectedLog, setSelectedLog] = useState<SanctionActivityLog | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK' | 'ALL'>('MENUNGGU');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setLogs(
        storageSync.get<SanctionActivityLog[]>(
          STORAGE_KEYS.SANCTION_LOGS,
          mockSanctionActivityLogs
        )
      );
    };
    sync();
    window.addEventListener('simpro_storage_change', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('simpro_storage_change', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const syncViolationProgress = (updatedLogs: SanctionActivityLog[]) => {
    const currentViolations = storageSync.get<StudentViolation[]>(
      STORAGE_KEYS.VIOLATIONS,
      mockStudentViolations
    );
    const recalculated = currentViolations.map((vio) => {
      const verifiedHours = updatedLogs
        .filter((l) => l.violation_id === vio.id && l.status === 'TERVERIFIKASI')
        .reduce((acc, l) => acc + l.durasi_jam, 0);
      const nextStatus: SanctionStatus =
        verifiedHours >= vio.total_jam_sanksi
          ? 'SELESAI'
          : verifiedHours > 0
            ? 'DALAM_PROSES'
            : vio.status_sanksi;
      return {
        ...vio,
        jam_sanksi_terpenuhi: verifiedHours,
        status_sanksi: nextStatus,
      };
    });
    storageSync.set(STORAGE_KEYS.VIOLATIONS, recalculated);
  };

  const pendingLogs = useMemo(() => logs.filter((l) => l.status === 'MENUNGGU'), [logs]);
  const verifiedLogs = useMemo(() => logs.filter((l) => l.status === 'TERVERIFIKASI'), [logs]);
  const rejectedLogs = useMemo(() => logs.filter((l) => l.status === 'DITOLAK'), [logs]);

  const displayedLogs = useMemo(() => {
    if (activeTab === 'ALL') return logs;
    return logs.filter((l) => l.status === activeTab);
  }, [logs, activeTab]);

  const handleDecision = () => {
    if (!selectedLog) return;
    const newStatus = actionType === 'APPROVE' ? 'TERVERIFIKASI' : 'DITOLAK';
    const patch: Partial<SanctionActivityLog> = {
      status: newStatus,
      catatan_verifikator:
        notes.trim() ||
        (actionType === 'APPROVE'
          ? 'Aktivitas sanksi sosial terverifikasi sesuai bukti sah.'
          : 'Ditolak: bukti kurang jelas atau uraian belum sesuai.'),
      diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
      diverifikasi_at: new Date().toISOString(),
    };

    const updated = storageSync.update(
      STORAGE_KEYS.SANCTION_LOGS,
      selectedLog.id,
      patch,
      mockSanctionActivityLogs
    );
    setLogs(updated);
    syncViolationProgress(updated);

    setToastMessage(
      actionType === 'APPROVE'
        ? `Aktivitas sanksi ${selectedLog.mahasiswa_nama} (${selectedLog.durasi_jam} Jam) berhasil disetujui.`
        : `Aktivitas sanksi ${selectedLog.mahasiswa_nama} telah ditolak dengan catatan.`
    );
    setTimeout(() => setToastMessage(null), 5000);
    setSelectedLog(null);
    setNotes('');
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const updated = logs.map((l) =>
      selectedIds.includes(l.id)
        ? {
            ...l,
            status: 'TERVERIFIKASI' as const,
            catatan_verifikator: 'Disetujui secara kolektif oleh Dosen Verifikator.',
            diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T.',
            diverifikasi_at: new Date().toISOString(),
          }
        : l
    );
    storageSync.set(STORAGE_KEYS.SANCTION_LOGS, updated);
    setLogs(updated);
    syncViolationProgress(updated);
    setToastMessage(`Berhasil menyetujui ${selectedIds.length} entri sanksi sosial secara massal.`);
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

  const columns: DataTableColumn<SanctionActivityLog>[] = [
    {
      key: 'select',
      header:
        activeTab === 'MENUNGGU' ? (
          <button
            type="button"
            onClick={toggleSelectAllPending}
            className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            {selectedIds.length === pendingLogs.length && pendingLogs.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        ) : (
          ''
        ),
      render: (row) =>
        row.status === 'MENUNGGU' ? (
          <button
            type="button"
            onClick={() => toggleSelectOne(row.id)}
            className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            {selectedIds.includes(row.id) ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        ) : null,
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm">
            {row.mahasiswa_nama}
          </span>
          <p className="text-[11px] text-slate-500 font-mono">NIM: {row.mahasiswa_nim}</p>
        </div>
      ),
    },
    {
      key: 'waktu',
      header: 'Tanggal & Durasi',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800">{formatDate(row.tanggal)}</span>
          <p className="text-[11px] text-slate-500 font-mono">
            Durasi: <strong className="text-blue-700">{row.durasi_jam} Jam</strong>
          </p>
        </div>
      ),
    },
    {
      key: 'kegiatan',
      header: 'Lokasi & Uraian Aktivitas',
      render: (row) => (
        <div className="space-y-1 max-w-sm">
          <p className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span>{row.lokasi}</span>
          </p>
          <p className="text-xs text-slate-700 line-clamp-2">{row.uraian_kegiatan}</p>
        </div>
      ),
    },
    {
      key: 'bukti',
      header: 'Bukti',
      render: (row) =>
        row.bukti_url ? (
          <button
            type="button"
            onClick={() => {
              setSelectedLog(row);
              setActionType('APPROVE');
            }}
            className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Lihat Lampiran</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400">Tidak ada bukti</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi Verifikasi',
      render: (row) =>
        row.status === 'MENUNGGU' ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedLog(row);
                setActionType('APPROVE');
                setNotes('Pelaksanaan sanksi terverifikasi valid.');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Setujui</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLog(row);
                setActionType('REJECT');
                setNotes('');
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Tolak</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelectedLog(row);
              setActionType(row.status === 'TERVERIFIKASI' ? 'APPROVE' : 'REJECT');
            }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Riwayat</span>
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Sanksi Sosial"
        description="Tinjau laporan pelaksanaan sanksi sosial mahasiswa, periksa bukti sah kegiatan, serta validasi pengurangan sisa jam sanksi."
        actions={
          selectedIds.length > 0 && activeTab === 'MENUNGGU' ? (
            <button
              type="button"
              onClick={handleBatchApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Setujui {selectedIds.length} Entri Terpilih</span>
            </button>
          ) : undefined
        }
      />

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingLogs.length.toString()}
          description="Perlu ditinjau dosen verifikator"
          icon="Clock"
          badgeTone="amber"
        />
        <StatCard
          title="Telah Disetujui"
          value={verifiedLogs.length.toString()}
          description="Jam sanksi resmi terpenuhi"
          icon="CheckCircle2"
          badgeTone="emerald"
        />
        <StatCard
          title="Ditolak / Revisi"
          value={rejectedLogs.length.toString()}
          description="Perlu perbaikan bukti mahasiswa"
          icon="AlertTriangle"
          badgeTone="rose"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 pb-4">
          {([
            { key: 'MENUNGGU', label: 'Menunggu Verifikasi', count: pendingLogs.length },
            { key: 'TERVERIFIKASI', label: 'Telah Disetujui', count: verifiedLogs.length },
            { key: 'DITOLAK', label: 'Ditolak / Revisi', count: rejectedLogs.length },
            { key: 'ALL', label: `Semua Entri (${logs.length})`, count: null },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-700 font-bold'
                      : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <DataTable
          data={displayedLogs}
          columns={columns}
          emptyMessage="Tidak ada aktivitas sanksi sosial pada tab ini."
        />
      </div>

      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={
            selectedLog.status === 'MENUNGGU'
              ? actionType === 'APPROVE'
                ? 'Setujui Pelaksanaan Sanksi Sosial'
                : 'Tolak Pelaksanaan Sanksi Sosial'
              : `Riwayat Verifikasi — ${selectedLog.mahasiswa_nama}`
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedLog.mahasiswa_nama}
                </span>
                <span className="text-slate-500 font-mono text-xs">
                  NIM: {selectedLog.mahasiswa_nim}
                </span>
              </div>
              <p className="text-slate-600 text-xs">
                Tanggal: <strong>{formatDate(selectedLog.tanggal)}</strong> • Durasi:{' '}
                <strong>{selectedLog.durasi_jam} Jam</strong>
              </p>
              <p className="text-slate-600 text-xs">
                Lokasi: <strong>{selectedLog.lokasi}</strong>
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">
                Uraian Aktivitas Sanksi:
              </span>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {selectedLog.uraian_kegiatan}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">
                Bukti yang Dilampirkan:
              </span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 text-xs">
                    {selectedLog.bukti_url?.split('/').pop() || 'dokumen-bukti-sanksi.pdf'}
                  </p>
                  <p className="text-[10px] text-slate-500">Lampiran Bukti Sanksi Sosial</p>
                </div>
              </div>
            </div>

            {selectedLog.status === 'MENUNGGU' ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-slate-700">Keputusan:</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-700">
                      <input
                        type="radio"
                        name="decision"
                        checked={actionType === 'APPROVE'}
                        onChange={() => setActionType('APPROVE')}
                      />
                      <span>Setujui Jam Sanksi</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-rose-700">
                      <input
                        type="radio"
                        name="decision"
                        checked={actionType === 'REJECT'}
                        onChange={() => setActionType('REJECT')}
                      />
                      <span>Tolak / Revisi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {actionType === 'APPROVE'
                      ? 'Catatan Verifikator (Opsional)'
                      : 'Alasan Penolakan *'}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan hasil verifikasi..."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDecision}
                    className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                      actionType === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionType === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800">Catatan Verifikasi:</span>
                <p className="text-slate-700">{selectedLog.catatan_verifikator || '-'}</p>
                <p className="text-[10px] text-slate-500 pt-1">
                  Diverifikasi oleh: <strong>{selectedLog.diverifikasi_oleh || '-'}</strong> pada{' '}
                  {selectedLog.diverifikasi_at ? formatDate(selectedLog.diverifikasi_at) : '-'}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 cursor-pointer"
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

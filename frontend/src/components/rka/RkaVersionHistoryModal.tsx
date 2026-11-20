'use client';

import React, { useMemo, useState } from 'react';
import { Eye, GitBranch, GitCompare, History, Lock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockProfiles } from '@/lib/mock-data';
import { computeRkaVersionDiff, getVersionSnapshot } from '@/lib/rka-utils';
import type { RkaDocument } from '@/lib/types';
import { formatDateTime, formatRupiah } from '@/lib/utils';

interface RkaVersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  doc: RkaDocument;
  selectedVersionNumber: number;
  onSelectVersion: (nomorVersi: number) => void;
}

export default function RkaVersionHistoryModal({
  open,
  onClose,
  doc,
  selectedVersionNumber,
  onSelectVersion,
}: RkaVersionHistoryModalProps) {
  const versions = useMemo(
    () => [...(doc.versions || [])].sort((a, b) => b.nomor_versi - a.nomor_versi),
    [doc.versions]
  );

  const [tab, setTab] = useState<'VERSIONS' | 'AUDIT'>('VERSIONS');
  const [baseVerNum, setBaseVerNum] = useState<number>(() => {
    const asc = [...versions].sort((a, b) => a.nomor_versi - b.nomor_versi);
    return asc.length >= 2 ? asc[asc.length - 2].nomor_versi : asc[0]?.nomor_versi ?? 1;
  });
  const [targetVerNum, setTargetVerNum] = useState<number>(() => versions[0]?.nomor_versi ?? 1);

  const baseVersion = versions.find((v) => v.nomor_versi === baseVerNum);
  const targetVersion = versions.find((v) => v.nomor_versi === targetVerNum);

  const diffResult = useMemo(() => {
    const baseSnap = getVersionSnapshot(doc, baseVersion);
    const targetSnap = getVersionSnapshot(doc, targetVersion);
    return computeRkaVersionDiff(baseSnap, targetSnap);
  }, [doc, baseVersion, targetVersion]);

  const resolveActor = (userId?: string) => {
    if (!userId) return 'Sistem';
    return mockProfiles.find((p) => p.id === userId)?.nama_lengkap || userId;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Riwayat Versi & Audit Log — RKA ${doc.tahun_anggaran}`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setTab('VERSIONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'VERSIONS'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch size={13} /> Riwayat &amp; Perbandingan Versi ({versions.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              tab === 'AUDIT'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={13} /> Audit Log ({(doc.audit_logs || []).length})
          </button>
        </div>

        {tab === 'VERSIONS' ? (
          <div className="space-y-5">
            {/* Daftar Snapshot Versi */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Daftar Versi &amp; Arsip Read-Only
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {versions.map((v) => {
                  const isSelected = v.nomor_versi === selectedVersionNumber;
                  const isArchived = v.status === 'DIGANTIKAN';
                  return (
                    <div
                      key={v.id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isSelected ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                            v{v.nomor_versi}
                          </span>
                          <StatusBadge status={v.status} size="sm" />
                          {isArchived && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <Lock size={10} /> Arsip Read-Only
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-800">
                            {formatRupiah(v.total_anggaran)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {v.alasan_revisi || 'Penyusunan RKA'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Oleh {resolveActor(v.dibuat_oleh)} • {formatDateTime(v.diterapkan_at || v.created_at)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectVersion(v.nomor_versi);
                          onClose();
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Eye size={13} /> {isSelected ? 'Sedang Ditampilkan' : 'Lihat Versi Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perbandingan Perubahan Antar Versi */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitCompare size={15} className="text-blue-600" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Bandingkan Perubahan Pagu &amp; Kegiatan
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={baseVerNum}
                    onChange={(e) => setBaseVerNum(Number(e.target.value))}
                    className="select-field text-xs py-1 px-2"
                  >
                    {versions.map((v) => (
                      <option key={`b-${v.id}`} value={v.nomor_versi}>
                        Dari v{v.nomor_versi} ({v.status})
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">→</span>
                  <select
                    value={targetVerNum}
                    onChange={(e) => setTargetVerNum(Number(e.target.value))}
                    className="select-field text-xs py-1 px-2"
                  >
                    {versions.map((v) => (
                      <option key={`t-${v.id}`} value={v.nomor_versi}>
                        Ke v{v.nomor_versi} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">Pagu v{baseVerNum}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(diffResult.totalSebelum)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pagu v{targetVerNum}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(diffResult.totalSesudah)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Selisih Pagu</span>
                  <span
                    className={`font-mono font-bold ${
                      diffResult.deltaTotal > 0
                        ? 'text-emerald-700'
                        : diffResult.deltaTotal < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {diffResult.deltaTotal > 0 ? '+' : ''}
                    {formatRupiah(diffResult.deltaTotal)}
                  </span>
                </div>
              </div>

              {diffResult.entries.length === 0 ? (
                <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Tidak ada perbedaan rincian pos anggaran antara v{baseVerNum} dan v{targetVerNum}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {diffResult.entries.map((entry, idx) => (
                    <div
                      key={`${entry.kode}-${idx}`}
                      className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                            entry.tipe === 'TAMBAH'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : entry.tipe === 'HAPUS'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {entry.tipe}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">
                            <span className="font-mono text-slate-500 mr-1.5">{entry.kode}</span>
                            {entry.nama}
                          </div>
                          <div className="text-[10px] text-slate-400">{entry.kegiatanNama}</div>
                        </div>
                      </div>

                      <div className="font-mono text-right shrink-0">
                        {entry.sebelum > 0 && (
                          <span className="text-slate-400 line-through mr-2">
                            {formatRupiah(entry.sebelum)}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 mr-2">
                          {formatRupiah(entry.sesudah)}
                        </span>
                        <span
                          className={`font-bold ${
                            entry.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ({entry.selisih >= 0 ? '+' : ''}
                          {formatRupiah(entry.selisih)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(doc.audit_logs || []).length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Belum ada catatan audit log pada dokumen ini.
              </div>
            ) : (
              (doc.audit_logs || []).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        {log.aksi}
                      </span>
                      {log.versi && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                          v{log.versi}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">{log.aktor}</span>
                      <span className="text-[10px] text-slate-400">({log.peran})</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{log.ringkasan}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                    {formatDateTime(log.waktu)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

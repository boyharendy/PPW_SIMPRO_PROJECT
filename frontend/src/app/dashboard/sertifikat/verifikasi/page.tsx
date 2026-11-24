'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  FileCheck,
  Eye,
  FileBadge,
  FileText,
  AlertCircle,
  Check,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates } from '@/lib/mock-data';
import type { StudentCertificate, CertificateCategory } from '@/lib/types';

export default function VerifikasiSertifikatPage() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK' | 'SEMUA'>('MENUNGGU');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CertificateCategory>('ALL');
  const [verifyModal, setVerifyModal] = useState<StudentCertificate | null>(null);
  const [catatan, setCatatan] = useState('');
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const refreshData = () => {
    const data = storageSync.get<StudentCertificate[]>(
      STORAGE_KEYS.CERTIFICATES,
      mockStudentCertificates
    );
    setCertificates(data);
  };

  useEffect(() => {
    refreshData();
    const handleSync = () => refreshData();
    window.addEventListener('simpro_storage_change', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('simpro_storage_change', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const handleDecision = (decision: 'TERVERIFIKASI' | 'DITOLAK') => {
    if (!verifyModal) return;
    setActionError(null);

    if (decision === 'DITOLAK' && !catatan.trim()) {
      setActionError('Alasan penolakan wajib diisi agar mahasiswa mengetahui hal yang perlu diperbaiki.');
      return;
    }

    const isApprove = decision === 'TERVERIFIKASI';
    const patch: Partial<StudentCertificate> = {
      status: decision,
      diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
      diverifikasi_at: new Date().toISOString(),
      alasan_penolakan: isApprove ? undefined : catatan.trim(),
      catatan_perbaikan: isApprove ? undefined : (catatanPerbaikan.trim() || undefined),
      updated_at: new Date().toISOString(),
    };

    const updated = storageSync.update(
      STORAGE_KEYS.CERTIFICATES,
      verifyModal.id,
      patch,
      mockStudentCertificates
    );
    setCertificates(updated);
    setFeedbackToast({
      type: isApprove ? 'success' : 'danger',
      message: `Sertifikat ${verifyModal.jenis_sertifikasi} milik ${verifyModal.mahasiswa_nama} berhasil ${isApprove ? 'disetujui dan diverifikasi' : 'ditolak dengan catatan perbaikan'}.`,
    });
    setVerifyModal(null);
    setCatatan('');
    setCatatanPerbaikan('');

    setTimeout(() => {
      setFeedbackToast(null);
    }, 5000);
  };

  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const matchCategory = selectedCategory === 'ALL' || c.kategori === selectedCategory;
      let matchStatus = true;
      if (activeTab === 'MENUNGGU') matchStatus = c.status === 'MENUNGGU';
      else if (activeTab === 'TERVERIFIKASI') matchStatus = c.status === 'TERVERIFIKASI';
      else if (activeTab === 'DITOLAK') matchStatus = c.status === 'DITOLAK';
      return matchCategory && matchStatus;
    });
  }, [certificates, activeTab, selectedCategory]);

  const pendingCount = certificates.filter((c) => c.status === 'MENUNGGU').length;
  const verifiedCount = certificates.filter((c) => c.status === 'TERVERIFIKASI').length;
  const rejectedCount = certificates.filter((c) => c.status === 'DITOLAK').length;

  const columns: DataTableColumn<StudentCertificate>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Pengunggah',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.mahasiswa_nama}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            NIM: {r.mahasiswa_nim} • Angkatan {r.angkatan}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis',
      header: 'Jenis Sertifikasi & Lembaga',
      render: (r) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-800 text-sm leading-snug">{r.jenis_sertifikasi}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.lembaga_penerbit}</div>
        </div>
      ),
    },
    {
      key: 'kategori_skor',
      header: 'Kategori & Skor',
      render: (r) => (
        <div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              r.kategori === 'BAHASA'
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-purple-50 text-purple-700 border-purple-100'
            }`}
          >
            {r.kategori === 'BAHASA' ? 'Bahasa Asing' : 'Profesi'}
          </span>
          <div className="text-xs font-semibold text-slate-800 mt-1 font-mono">
            Skor: {r.skor_level}
          </div>
        </div>
      ),
    },
    {
      key: 'nomor_tanggal',
      header: 'Nomor & Terbit',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Terbit: {formatDateShort(r.tanggal_terbit)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Validasi',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Tindakan',
      className: 'text-right min-w-[120px] whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {r.status === 'MENUNGGU' ? (
            <button
              onClick={() => {
                setVerifyModal(r);
                setCatatan('');
                setCatatanPerbaikan('');
                setActionError(null);
              }}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <CheckCircle2 size={13} /> Telaah Berkas
            </button>
          ) : (
            <button
              onClick={() => {
                setVerifyModal(r);
                setCatatan(r.alasan_penolakan || '');
                setCatatanPerbaikan(r.catatan_perbaikan || '');
                setActionError(null);
              }}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Eye size={13} /> Riwayat
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/sertifikat"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Sertifikat
        </Link>
      </div>

      <PageHeader
        title="Verifikasi Sertifikat Mahasiswa"
        description="Pemeriksaan keabsahan dokumen bukti fisik atau scan sertifikat bahasa dan sertifikasi profesi mahasiswa oleh Dosen Verifikator."
      />

      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between shadow-2xs ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-slate-500 hover:text-slate-800 font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* 3 StatCards - Komposisi Seragam & Selaras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Tindakan"
          value={`${pendingCount} Berkas`}
          subtitle="Perlu diverifikasi oleh dosen"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Telah Disetujui"
          value={`${verifiedCount} Berkas`}
          subtitle="Tervalidasi & masuk rekap resmi"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Ditolak / Perlu Revisi"
          value={`${rejectedCount} Berkas`}
          subtitle="Dikembalikan untuk diperbaiki"
          badgeTone="rose"
          icon={<XCircle size={16} />}
        />
      </div>

      {/* Filter Tabs & Content Table */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setActiveTab('MENUNGGU')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'MENUNGGU'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('TERVERIFIKASI')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'TERVERIFIKASI'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terverifikasi ({verifiedCount})
              </button>
              <button
                onClick={() => setActiveTab('DITOLAK')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'DITOLAK'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ditolak ({rejectedCount})
              </button>
              <button
                onClick={() => setActiveTab('SEMUA')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'SEMUA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({certificates.length})
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'BAHASA', 'PROFESI_KOMPETENSI'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat === 'BAHASA' ? 'Bahasa' : 'Profesi'}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filtered.length} pengajuan sertifikat
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada antrean sertifikat untuk filter status yang dipilih."
        />
      </div>

      {/* Modal Telaah & Verifikasi Sertifikat */}
      <Modal
        open={Boolean(verifyModal)}
        onClose={() => setVerifyModal(null)}
        title={verifyModal?.status === 'MENUNGGU' ? 'Pemeriksaan & Verifikasi Sertifikat' : 'Riwayat Verifikasi Sertifikat'}
        size="md"
      >
        {verifyModal && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mahasiswa Pengunggah:</span>
                <span className="font-semibold text-slate-800">
                  {verifyModal.mahasiswa_nama} ({verifyModal.mahasiswa_nim}) • Angkatan {verifyModal.angkatan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jenis Sertifikasi:</span>
                <span className="font-semibold text-slate-800">{verifyModal.jenis_sertifikasi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lembaga Penerbit:</span>
                <span className="font-semibold text-slate-800">{verifyModal.lembaga_penerbit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Registrasi:</span>
                <span className="font-mono font-semibold text-slate-800">{verifyModal.nomor_sertifikat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Skor / Level Capaian:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {verifyModal.skor_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masa Berlaku:</span>
                <span className="font-medium text-slate-800">
                  {formatDateShort(verifyModal.tanggal_terbit)} s.d.{' '}
                  {verifyModal.is_seumur_hidup
                    ? 'Seumur Hidup'
                    : verifyModal.tanggal_kedaluwarsa
                    ? formatDateShort(verifyModal.tanggal_kedaluwarsa)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-400">Dokumen Scan:</span>
                <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline cursor-pointer">
                  <FileText size={14} />
                  <span>{verifyModal.berkas_nama || 'Unduh Berkas Sertifikat'}</span>
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-400">Status Saat Ini:</span>
                <StatusBadge status={verifyModal.status} size="sm" />
              </div>
              {verifyModal.diverifikasi_oleh && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Diverifikasi Oleh:</span>
                  <span className="font-medium text-slate-800">{verifyModal.diverifikasi_oleh}</span>
                </div>
              )}
            </div>

            {verifyModal.status === 'MENUNGGU' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alasan Penolakan (Wajib diisi jika menolak):
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tulis alasan jika sertifikat ditolak (contoh: nomor tidak valid, scan terpotong)..."
                    className="input-field resize-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Instruksi Perbaikan bagi Mahasiswa (Opsional):
                  </label>
                  <input
                    type="text"
                    value={catatanPerbaikan}
                    onChange={(e) => setCatatanPerbaikan(e.target.value)}
                    placeholder="Contoh: Unggah ulang berkas scan resolusi tinggi dengan stempel lembaga..."
                    className="input-field text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDecision('DITOLAK')}
                    className="btn-danger text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                  >
                    <XCircle size={14} /> Tolak Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('TERVERIFIKASI')}
                    className="btn-success text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Setujui &amp; Kunci Sertifikat
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {verifyModal.alasan_penolakan && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <p className="font-bold mb-0.5">Alasan Penolakan:</p>
                    <p>{verifyModal.alasan_penolakan}</p>
                    {verifyModal.catatan_perbaikan && (
                      <p className="mt-1 text-[11px] text-slate-600 italic">
                        Instruksi Perbaikan: {verifyModal.catatan_perbaikan}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVerifyModal(null)}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

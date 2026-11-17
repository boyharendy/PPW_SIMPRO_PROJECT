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
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates } from '@/lib/mock-data';
import type { StudentCertificate } from '@/lib/types';

export default function Page() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [activeTab, setActiveTab] = useState<'MENUNGGU' | 'SEMUA'>('MENUNGGU');
  const [verifyModal, setVerifyModal] = useState<StudentCertificate | null>(null);
  const [catatan, setCatatan] = useState('');

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

  const handleDecision = (status: 'TERVERIFIKASI' | 'DITOLAK') => {
    if (!verifyModal) return;

    const patch: Partial<StudentCertificate> = {
      status,
      diverifikasi_oleh: 'Dosen Verifikator Prodi',
      diverifikasi_at: new Date().toISOString(),
      alasan_penolakan: catatan.trim() || undefined,
    };

    const updated = storageSync.update(
      STORAGE_KEYS.CERTIFICATES,
      verifyModal.id,
      patch,
      mockStudentCertificates
    );
    setCertificates(updated);
    setVerifyModal(null);
    setCatatan('');
  };

  const filtered = useMemo(() => {
    if (activeTab === 'MENUNGGU') {
      return certificates.filter((c) => c.status === 'MENUNGGU');
    }
    return certificates;
  }, [certificates, activeTab]);

  const pendingCount = certificates.filter((c) => c.status === 'MENUNGGU').length;
  const verifiedCount = certificates.filter((c) => c.status === 'TERVERIFIKASI').length;
  const rejectedCount = certificates.filter((c) => c.status === 'DITOLAK').length;

  const columns: DataTableColumn<StudentCertificate>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa',
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
      header: 'Jenis & Lembaga',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.jenis_sertifikasi}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.lembaga_penerbit}</div>
        </div>
      ),
    },
    {
      key: 'nomor',
      header: 'Nomor & Skor',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <div className="text-xs font-semibold text-blue-700 mt-0.5">Skor: {r.skor_level}</div>
        </div>
      ),
    },
    {
      key: 'tanggal',
      header: 'Tanggal Terbit',
      render: (r) => (
        <span className="text-xs text-slate-600 font-medium">
          {formatDateShort(r.tanggal_terbit)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right min-w-[120px] whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {r.status === 'MENUNGGU' ? (
            <button
              onClick={() => {
                setVerifyModal(r);
                setCatatan('');
              }}
              className="h-8 px-3 text-xs font-medium rounded-full border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <CheckCircle2 size={13} /> Verifikasi
            </button>
          ) : (
            <button
              onClick={() => setVerifyModal(r)}
              className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs transition-all"
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
        description="Validasi keabsahan data registrasi dan dokumen sertifikat yang diunggah mahasiswa."
      />

      {/* 3 StatCards - Komposisi Seragam & Selaras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Menunggu Tindakan"
          value={`${pendingCount} Berkas`}
          subtitle="Perlu diverifikasi segera"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
        <StatCard
          title="Telah Disetujui"
          value={`${verifiedCount} Berkas`}
          subtitle="Memenuhi syarat kelulusan"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Ditolak / Draf"
          value={`${rejectedCount} Berkas`}
          subtitle="Perlu perbaikan berkas"
          badgeTone="rose"
          icon={<XCircle size={16} />}
        />
      </div>

      {/* Tabel Verifikasi */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setActiveTab('MENUNGGU')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'MENUNGGU'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Verifikasi ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('SEMUA')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'SEMUA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Riwayat ({certificates.length})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filtered.length} pengajuan sertifikat
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada antrean sertifikat yang menunggu verifikasi saat ini."
        />
      </div>

      {/* Modal Telaah & Verifikasi */}
      <Modal
        open={Boolean(verifyModal)}
        onClose={() => setVerifyModal(null)}
        title="Validasi Sertifikat Mahasiswa"
        size="md"
      >
        {verifyModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Mahasiswa:</span>
                <span className="font-semibold text-slate-800">
                  {verifyModal.mahasiswa_nama} ({verifyModal.mahasiswa_nim})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sertifikasi:</span>
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
                <span className="text-slate-400">Skor / Hasil:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {verifyModal.skor_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Saat Ini:</span>
                <StatusBadge status={verifyModal.status} size="sm" />
              </div>
            </div>

            {verifyModal.status === 'MENUNGGU' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Catatan Verifikasi (Opsional untuk Penolakan):
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tulis alasan jika menolak atau instruksi revisi..."
                    className="input-field resize-none text-xs"
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
                    <CheckCircle2 size={14} /> Setujui Sertifikat
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyModal(null)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileBadge,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Upload,
  FileText,
  Edit3,
  XCircle,
  FileCheck,
  Check,
  RefreshCw,
  Info,
  Search,
  ExternalLink,
  Award,
  Calendar,
  Building,
  Sparkles,
  Download,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates, mockCertificateBatchStats } from '@/lib/mock-data';
import type { StudentCertificate, CertificateCategory, CertificateBatchStat } from '@/lib/types';

export default function SertifikatPage() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [activeTab, setActiveTab] = useState<'DAFTAR' | 'VERIFIKASI' | 'REKAP'>('DAFTAR');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CertificateCategory>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<StudentCertificate | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);

  // Verifikasi modal & rejection state
  const [verifyModal, setVerifyModal] = useState<StudentCertificate | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'TERVERIFIKASI' | 'DITOLAK'>('TERVERIFIKASI');
  const [catatanPenolakan, setCatatanPenolakan] = useState('');
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Form states
  const [mhsNama, setMhsNama] = useState('');
  const [mhsNim, setMhsNim] = useState('');
  const [angkatan, setAngkatan] = useState(2023);
  const [kategori, setKategori] = useState<CertificateCategory>('BAHASA');
  const [jenisSertifikasi, setJenisSertifikasi] = useState('');
  const [lembagaPenerbit, setLembagaPenerbit] = useState('');
  const [nomorSertifikat, setNomorSertifikat] = useState('');
  const [skorLevel, setSkorLevel] = useState('');
  const [nilaiNumerik, setNilaiNumerik] = useState('');
  const [tanggalTerbit, setTanggalTerbit] = useState('');
  const [tanggalKedaluwarsa, setTanggalKedaluwarsa] = useState('');
  const [isSeumurHidup, setIsSeumurHidup] = useState(false);
  const [fileObj, setFileObj] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);

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

  const resetForm = () => {
    setEditingCertId(null);
    setMhsNama('');
    setMhsNim('');
    setAngkatan(2023);
    setKategori('BAHASA');
    setJenisSertifikasi('');
    setLembagaPenerbit('');
    setNomorSertifikat('');
    setSkorLevel('');
    setNilaiNumerik('');
    setTanggalTerbit('');
    setTanggalKedaluwarsa('');
    setIsSeumurHidup(false);
    setFileObj(null);
    setFileError(null);
    setFormError(null);
    setRejectionNotice(null);
  };

  const openNewForm = () => {
    resetForm();
    setFormModalOpen(true);
  };

  const openEditForm = (cert: StudentCertificate) => {
    setEditingCertId(cert.id);
    setMhsNama(cert.mahasiswa_nama);
    setMhsNim(cert.mahasiswa_nim);
    setAngkatan(cert.angkatan);
    setKategori(cert.kategori);
    setJenisSertifikasi(cert.jenis_sertifikasi);
    setLembagaPenerbit(cert.lembaga_penerbit);
    setNomorSertifikat(cert.nomor_sertifikat);
    setSkorLevel(cert.skor_level);
    setNilaiNumerik(cert.nilai_numerik !== undefined ? String(cert.nilai_numerik) : '');
    setTanggalTerbit(cert.tanggal_terbit);
    setTanggalKedaluwarsa(cert.tanggal_kedaluwarsa || '');
    setIsSeumurHidup(cert.is_seumur_hidup);
    setFileObj(cert.berkas_nama ? { name: cert.berkas_nama, size: cert.berkas_ukuran || 1024000 } : null);
    setFileError(null);
    setFormError(null);
    setRejectionNotice(cert.alasan_penolakan || null);
    setFormModalOpen(true);
    setDetailModal(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(ext)) {
      setFileError('Format berkas tidak diizinkan. Gunakan berkas PDF, JPG, PNG, DOCX, atau XLSX.');
      setFileObj(null);
      return;
    }

    // Maksimal 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('Ukuran berkas melebihi batas maksimum 5 MB.');
      setFileObj(null);
      return;
    }

    setFileObj({ name: file.name, size: file.size });
  };

  const handleSave = (targetStatus: 'DRAF' | 'MENUNGGU') => {
    setFormError(null);

    // Validasi dasar
    if (!mhsNama.trim() || !mhsNim.trim()) {
      setFormError('Nama dan NIM mahasiswa wajib diisi.');
      return;
    }

    if (targetStatus === 'MENUNGGU') {
      if (!jenisSertifikasi.trim() || !lembagaPenerbit.trim() || !nomorSertifikat.trim() || !skorLevel.trim() || !tanggalTerbit) {
        setFormError('Lengkapi seluruh data wajib: Jenis Sertifikasi, Lembaga, Nomor, Skor/Level, dan Tanggal Terbit.');
        return;
      }
      if (!isSeumurHidup && !tanggalKedaluwarsa && kategori === 'BAHASA') {
        setFormError('Sertifikat bahasa wajib memiliki tanggal kedaluwarsa (atau centang seumur hidup jika berlaku).');
        return;
      }
    }

    const payload: StudentCertificate = {
      id: editingCertId || `cert-${Date.now()}`,
      mahasiswa_nim: mhsNim.trim(),
      mahasiswa_nama: mhsNama.trim(),
      angkatan: Number(angkatan) || 2023,
      kategori,
      jenis_sertifikasi: jenisSertifikasi.trim() || 'Draf Sertifikat Baru',
      lembaga_penerbit: lembagaPenerbit.trim() || '-',
      nomor_sertifikat: nomorSertifikat.trim() || '-',
      skor_level: skorLevel.trim() || '-',
      nilai_numerik: nilaiNumerik ? parseFloat(nilaiNumerik) : undefined,
      tanggal_terbit: tanggalTerbit || new Date().toISOString().split('T')[0],
      tanggal_kedaluwarsa: isSeumurHidup ? undefined : (tanggalKedaluwarsa || undefined),
      is_seumur_hidup: isSeumurHidup,
      berkas_url: fileObj ? `/uploads/${fileObj.name}` : '/docs/sertifikat-sample.pdf',
      berkas_nama: fileObj?.name || 'sertifikat-unggah.pdf',
      berkas_ukuran: fileObj?.size || 1024000,
      status: targetStatus,
      alasan_penolakan: undefined,
      catatan_perbaikan: undefined,
      is_kedaluwarsa: false,
      is_segera_kedaluwarsa: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updated: StudentCertificate[];
    if (editingCertId) {
      updated = storageSync.update(
        STORAGE_KEYS.CERTIFICATES,
        editingCertId,
        payload,
        mockStudentCertificates
      );
    } else {
      updated = storageSync.prepend(
        STORAGE_KEYS.CERTIFICATES,
        payload,
        mockStudentCertificates
      );
    }

    setCertificates(updated);
    setFormModalOpen(false);
    resetForm();
    setVerificationFeedback(
      targetStatus === 'MENUNGGU'
        ? `Sertifikat ${payload.jenis_sertifikasi} berhasil diajukan untuk verifikasi dosen.`
        : `Draf sertifikat ${payload.jenis_sertifikasi} berhasil disimpan.`
    );
    setTimeout(() => setVerificationFeedback(null), 4000);
  };

  // Submit decision by Dosen Verifikator
  const submitVerification = () => {
    if (!verifyModal) return;
    if (verifyDecision === 'DITOLAK' && !catatanPenolakan.trim()) {
      alert('Alasan penolakan wajib diisi agar mahasiswa mengetahui bagian yang perlu diperbaiki.');
      return;
    }

    const isApprove = verifyDecision === 'TERVERIFIKASI';
    const patch: Partial<StudentCertificate> = {
      status: verifyDecision,
      diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
      diverifikasi_at: new Date().toISOString(),
      alasan_penolakan: isApprove ? undefined : catatanPenolakan.trim(),
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
    setVerificationFeedback(
      `Sertifikat ${verifyModal.jenis_sertifikasi} (${verifyModal.mahasiswa_nama}) berhasil ${
        isApprove ? 'diverifikasi sah' : 'dikembalikan ke mahasiswa untuk perbaikan'
      }.`
    );
    setVerifyModal(null);
    setCatatanPenolakan('');
    setCatatanPerbaikan('');
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  // Batch approve all pending
  const handleBatchApprove = () => {
    const pendings = certificates.filter((c) => c.status === 'MENUNGGU');
    if (pendings.length === 0) return;
    if (!confirm(`Setujui sekaligus seluruh ${pendings.length} berkas sertifikat yang sedang menunggu?`)) return;

    let updatedList = [...certificates];
    pendings.forEach((p) => {
      updatedList = storageSync.update(
        STORAGE_KEYS.CERTIFICATES,
        p.id,
        {
          status: 'TERVERIFIKASI',
          diverifikasi_oleh: 'Dr. Ahmad Fauzi, M.T. (Dosen Verifikator)',
          diverifikasi_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        mockStudentCertificates
      );
    });

    setCertificates(updatedList);
    setVerificationFeedback(`Berhasil menyetujui sekaligus ${pendings.length} sertifikat.`);
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  // Filtered certificates for Tab Daftar
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchCat = selectedCategory === 'ALL' || c.kategori === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchSearch =
        c.mahasiswa_nama.toLowerCase().includes(search.toLowerCase()) ||
        c.mahasiswa_nim.includes(search) ||
        c.jenis_sertifikasi.toLowerCase().includes(search.toLowerCase()) ||
        c.nomor_sertifikat.toLowerCase().includes(search.toLowerCase()) ||
        c.lembaga_penerbit.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [certificates, selectedCategory, selectedStatus, search]);

  // Statistics
  const verifiedCount = certificates.filter((c) => c.status === 'TERVERIFIKASI').length;
  const pendingCount = certificates.filter((c) => c.status === 'MENUNGGU').length;
  const needAttentionCount = certificates.filter(
    (c) => c.status === 'DITOLAK' || c.is_segera_kedaluwarsa || c.is_kedaluwarsa
  ).length;

  // Verifikasi queue
  const pendingCertificates = useMemo(() => {
    return certificates.filter((c) => c.status === 'MENUNGGU');
  }, [certificates]);

  // Rekap summary data
  const bahasaCount = certificates.filter((c) => c.kategori === 'BAHASA' && c.status === 'TERVERIFIKASI').length;
  const profesiCount = certificates.filter((c) => c.kategori === 'PROFESI_KOMPETENSI' && c.status === 'TERVERIFIKASI').length;
  const expiringSoonList = certificates.filter((c) => c.is_segera_kedaluwarsa || c.is_kedaluwarsa);

  // Columns for Tab Daftar
  const daftarColumns: DataTableColumn<StudentCertificate>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa & Angkatan',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {r.mahasiswa_nama.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug">{r.mahasiswa_nama}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {r.mahasiswa_nim} • Angkatan {r.angkatan}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_sertifikasi',
      header: 'Sertifikasi & Kategori',
      render: (r) => (
        <div className="space-y-1 max-w-xs">
          <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug">{r.jenis_sertifikasi}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                r.kategori === 'BAHASA'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {r.kategori === 'BAHASA' ? 'Bahasa Asing' : 'Profesi & Kompetensi'}
            </span>
            <span className="text-[11px] text-slate-500 truncate">{r.lembaga_penerbit}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'nomor',
      header: 'No. Sertifikat & Skor',
      render: (r) => (
        <div className="space-y-1">
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <span className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {r.skor_level}
          </span>
        </div>
      ),
    },
    {
      key: 'masa_berlaku',
      header: 'Masa Berlaku',
      render: (r) => (
        <div className="space-y-1 text-xs">
          {r.is_seumur_hidup ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check size={11} /> Seumur Hidup
            </span>
          ) : (
            <div>
              <div className="text-slate-700 font-medium">
                s.d. {r.tanggal_kedaluwarsa ? formatDateShort(r.tanggal_kedaluwarsa) : '-'}
              </div>
              {r.is_kedaluwarsa ? (
                <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Kedaluwarsa
                </span>
              ) : r.is_segera_kedaluwarsa ? (
                <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &lt; 30 Hari Lagi
                </span>
              ) : (
                <span className="inline-block mt-0.5 text-[10px] text-slate-500">Masa Aktif Sah</span>
              )}
            </div>
          )}
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
      header: 'Aksi',
      className: 'text-right min-w-[150px] whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setDetailModal(r)}
            className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center gap-1 transition-all shadow-2xs"
            title="Lihat Detail Sertifikat"
          >
            <Eye size={12} /> Detail
          </button>
          {(r.status === 'DRAF' || r.status === 'DITOLAK') && (
            <button
              onClick={() => openEditForm(r)}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 transition-all shadow-2xs"
              title={r.status === 'DITOLAK' ? 'Perbaiki Sertifikat' : 'Lanjutkan Edit'}
            >
              <Edit3 size={12} /> {r.status === 'DITOLAK' ? 'Perbaiki' : 'Edit'}
            </button>
          )}
          {r.status === 'MENUNGGU' && (
            <button
              onClick={() => {
                setVerifyModal(r);
                setVerifyDecision('TERVERIFIKASI');
                setCatatanPenolakan('');
                setCatatanPerbaikan('');
              }}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1 transition-all shadow-2xs"
              title="Verifikasi Validitas"
            >
              <ShieldCheck size={12} /> Verifikasi
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Modul 6: Sertifikat Bahasa & Profesi"
        description="Pusat pencatatan, verifikasi dosen, dan rekapitulasi kelulusan berbasis sertifikasi kemampuan bahasa asing serta kompetensi profesi mahasiswa untuk akreditasi prodi dan SKPI."
        badge={
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <Sparkles size={12} />
            Standar Akreditasi & SKPI
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openNewForm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Unggah Sertifikat Baru
            </button>
            <ExportMenu filename="daftar-sertifikat-mahasiswa" />
          </div>
        }
      />

      {/* Feedback Toast */}
      {verificationFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{verificationFeedback}</span>
          </div>
          <button
            onClick={() => setVerificationFeedback(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Symmetrical Grid (Color Icon Containers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sertifikat"
          value={`${certificates.length} Berkas`}
          subtitle="Tercatat di basis data prodi"
          color="blue"
          icon={<FileBadge size={18} />}
        />
        <StatCard
          title="Terverifikasi"
          value={`${verifiedCount} Berkas`}
          subtitle="Tervalidasi & masuk rekap resmi"
          color="emerald"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          title="Menunggu Validasi"
          value={`${pendingCount} Berkas`}
          subtitle="Menanti peninjauan verifikator"
          color="amber"
          icon={<Clock size={18} />}
        />
        <StatCard
          title="Perlu Perhatian"
          value={`${needAttentionCount} Berkas`}
          subtitle="Ditolak / segera kedaluwarsa"
          color="rose"
          icon={<AlertTriangle size={18} />}
        />
      </div>

      {/* Navigation Tab Bar Terpadu */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('DAFTAR')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'DAFTAR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileBadge className="h-4 w-4" />
            <span>Daftar Sertifikat</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'DAFTAR' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {certificates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFIKASI')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'VERIFIKASI'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Verifikasi Dosen</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'VERIFIKASI'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pendingCount} Menunggu
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('REKAP')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'REKAP'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Rekapitulasi & Masa Berlaku</span>
            {needAttentionCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'REKAP' ? 'bg-rose-400 text-white' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {needAttentionCount} Cek
              </span>
            )}
          </button>
        </div>

        {/* Deep link ke halaman dedicated */}
        <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
          {activeTab === 'VERIFIKASI' && (
            <Link
              href="/dashboard/sertifikat/verifikasi"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
            >
              <span>Buka Halaman Lengkap Verifikasi</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          {activeTab === 'REKAP' && (
            <Link
              href="/dashboard/sertifikat/rekap"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
            >
              <span>Buka Halaman Lengkap Rekap</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR SERTIFIKAT */}
      {/* ========================================================================= */}
      {activeTab === 'DAFTAR' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Toolbar Pencarian & Filter Terstandar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Filter:
              </span>

              {/* Filter Kategori */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['ALL', 'BAHASA', 'PROFESI_KOMPETENSI'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat === 'BAHASA' ? 'Bahasa Asing' : 'Profesi & Kompetensi'}
                  </button>
                ))}
              </div>

              {/* Filter Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Status Validasi</option>
                <option value="MENUNGGU">Menunggu Validasi</option>
                <option value="TERVERIFIKASI">Terverifikasi Sah</option>
                <option value="DITOLAK">Ditolak / Perlu Revisi</option>
                <option value="DRAF">Draf Tersimpan</option>
              </select>
            </div>

            {/* Kotak Pencarian */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari mahasiswa, NIM, atau nomor..."
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
                Menampilkan <strong>{filteredCertificates.length}</strong> data
              </span>
            </div>
          </div>

          {/* Tabel Sertifikat */}
          <DataTable
            columns={daftarColumns}
            data={filteredCertificates}
            emptyMessage="Tidak ada data sertifikat mahasiswa untuk filter yang dipilih."
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERIFIKASI SERTIFIKAT (DOSEN VERIFIKATOR) */}
      {/* ========================================================================= */}
      {activeTab === 'VERIFIKASI' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antrean Verifikasi Validitas Sertifikat</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dosen memeriksa keabsahan nomor registrasi, lembaga penerbit, skor/level, dan masa berlaku berkas.
              </p>
            </div>

            {pendingCount > 0 && (
              <button
                onClick={handleBatchApprove}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Setujui Semua ({pendingCount} Berkas)
              </button>
            )}
          </div>

          {pendingCertificates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">Semua Sertifikat Selesai Ditinjau</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada antrean sertifikat yang menunggu verifikasi saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Mahasiswa</th>
                    <th className="px-4 py-3">Sertifikasi & Kategori</th>
                    <th className="px-4 py-3">Nomor Registrasi & Skor</th>
                    <th className="px-4 py-3">Masa Berlaku</th>
                    <th className="px-4 py-3">Dokumen Berkas</th>
                    <th className="px-4 py-3 text-right">Tindakan Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{cert.mahasiswa_nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {cert.mahasiswa_nim} • Angkatan {cert.angkatan}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{cert.jenis_sertifikasi}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cert.kategori === 'BAHASA'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {cert.kategori === 'BAHASA' ? 'Bahasa Asing' : 'Profesi'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">{cert.lembaga_penerbit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-700">{cert.nomor_sertifikat}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {cert.skor_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">
                          {cert.is_seumur_hidup
                            ? 'Seumur Hidup'
                            : `s.d. ${cert.tanggal_kedaluwarsa ? formatDateShort(cert.tanggal_kedaluwarsa) : '-'}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailModal(cert)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                        >
                          <FileText size={13} />
                          <span className="truncate max-w-[120px]">{cert.berkas_nama || 'sertifikat.pdf'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setVerifyModal(cert);
                              setVerifyDecision('TERVERIFIKASI');
                              setCatatanPenolakan('');
                              setCatatanPerbaikan('');
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Check size={12} /> Setujui
                          </button>
                          <button
                            onClick={() => {
                              setVerifyModal(cert);
                              setVerifyDecision('DITOLAK');
                              setCatatanPenolakan('');
                              setCatatanPerbaikan('');
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                          >
                            <XCircle size={12} /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REKAPITULASI & MASA BERLAKU */}
      {/* ========================================================================= */}
      {activeTab === 'REKAP' && (
        <div className="space-y-5">
          {/* Ringkasan Distribusi & Status Masa Berlaku */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Distribusi Bidang</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Bahasa vs Profesi</h4>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Sertifikat Bahasa Asing</span>
                  <span className="font-bold text-blue-700">{bahasaCount} Berkas</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(bahasaCount / (bahasaCount + profesiCount || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-600">Sertifikat Profesi & Industri</span>
                  <span className="font-bold text-purple-700">{profesiCount} Berkas</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(profesiCount / (bahasaCount + profesiCount || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Peringatan Masa Berlaku</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Deteksi Kedaluwarsa</h4>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Segera Kedaluwarsa (&lt;30 hari)</span>
                  <span className="font-bold text-amber-600">
                    {certificates.filter((c) => c.is_segera_kedaluwarsa).length} Mahasiswa
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Telah Kedaluwarsa</span>
                  <span className="font-bold text-rose-600">
                    {certificates.filter((c) => c.is_kedaluwarsa).length} Berkas
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Masa Berlaku Seumur Hidup</span>
                  <span className="font-bold text-emerald-600">
                    {certificates.filter((c) => c.is_seumur_hidup).length} Berkas
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Capaian Akreditasi</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Rasio Sertifikasi Angkatan</h4>
              <p className="text-xs text-slate-500 mt-2">
                Memenuhi syarat indikator IKU-1 dan borang akreditasi LAM-INFOKOM terkait rekognisi kompetensi global lulusan.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {Math.round((verifiedCount / (certificates.length || 1)) * 100)}%
                </span>
                <span className="text-[11px] text-slate-500">Berkas Terverifikasi dari Total Input</span>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi per Angkatan */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Rekapitulasi Capaian Sertifikasi per Angkatan</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agregasi capaian skor rata-rata TOEFL, kelulusan sertifikasi profesi, dan status verifikasi.
                </p>
              </div>
              <ExportMenu filename="rekapitulasi-sertifikat-per-angkatan" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Tahun Angkatan</th>
                    <th className="px-4 py-3">Total Mahasiswa</th>
                    <th className="px-4 py-3">Punya Sertifikat</th>
                    <th className="px-4 py-3">Sertifikat Bahasa</th>
                    <th className="px-4 py-3">Sertifikat Profesi</th>
                    <th className="px-4 py-3">Total Terverifikasi</th>
                    <th className="px-4 py-3 text-right">Rasio Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockCertificateBatchStats.map((stat) => (
                    <tr key={stat.angkatan} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">Angkatan {stat.angkatan}</td>
                      <td className="px-4 py-3 text-slate-700">{stat.total_mahasiswa} Orang</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{stat.mahasiswa_memiliki_sertifikat} Orang</td>
                      <td className="px-4 py-3 text-slate-700">{stat.sertifikat_bahasa}</td>
                      <td className="px-4 py-3 text-slate-700">{stat.sertifikat_profesi}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {stat.total_sertifikat_terverifikasi}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {stat.persentase_kepemilikan}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL SERTIFIKAT */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(detailModal)}
        onClose={() => setDetailModal(null)}
        title="Detail Berkas Sertifikat Mahasiswa"
        size="md"
      >
        {detailModal && (
          <div className="space-y-4">
            {detailModal.status === 'DITOLAK' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle size={15} />
                  <span>Catatan Penolakan oleh Dosen Verifikator:</span>
                </div>
                <p className="text-slate-700 pl-5">
                  {detailModal.alasan_penolakan || 'Dokumen scan tidak terbaca jelas atau nomor registrasi tidak valid.'}
                </p>
                {detailModal.catatan_perbaikan && (
                  <p className="text-slate-600 pl-5 text-[11px] italic">
                    Saran: {detailModal.catatan_perbaikan}
                  </p>
                )}
              </div>
            )}

            {detailModal.status === 'TERVERIFIKASI' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>
                  Sertifikat telah terverifikasi sah. Berkas terkunci dan tidak dapat diubah tanpa izin prodi.
                </span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Mahasiswa:</span>
                <span className="font-semibold text-slate-800">{detailModal.mahasiswa_nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIM / Angkatan:</span>
                <span className="font-semibold text-slate-800">
                  {detailModal.mahasiswa_nim} (Angkatan {detailModal.angkatan})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-medium text-slate-800">
                  {detailModal.kategori === 'BAHASA' ? 'Bahasa Asing' : 'Profesi & Kompetensi'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jenis Sertifikasi:</span>
                <span className="font-semibold text-slate-800">{detailModal.jenis_sertifikasi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lembaga Penerbit:</span>
                <span className="font-semibold text-slate-800">{detailModal.lembaga_penerbit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Sertifikat:</span>
                <span className="font-mono font-semibold text-slate-800">{detailModal.nomor_sertifikat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hasil / Skor / Level:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {detailModal.skor_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masa Berlaku:</span>
                <span className="font-medium text-slate-800">
                  {formatDateShort(detailModal.tanggal_terbit)} s.d.{' '}
                  {detailModal.is_seumur_hidup
                    ? 'Seumur Hidup'
                    : detailModal.tanggal_kedaluwarsa
                    ? formatDateShort(detailModal.tanggal_kedaluwarsa)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Berkas Dokumen:</span>
                <a
                  href={detailModal.berkas_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  <FileText size={13} />
                  <span>{detailModal.berkas_nama || 'sertifikat-lampiran.pdf'}</span>
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Validasi:</span>
                <StatusBadge status={detailModal.status} size="sm" />
              </div>
              {detailModal.diverifikasi_oleh && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Diverifikasi Oleh:</span>
                  <span className="font-medium text-slate-800">{detailModal.diverifikasi_oleh}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {detailModal.status === 'DITOLAK' && (
                <button
                  type="button"
                  onClick={() => openEditForm(detailModal)}
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw size={13} /> Perbaiki &amp; Ajukan Ulang
                </button>
              )}
              {detailModal.status === 'DRAF' && (
                <button
                  type="button"
                  onClick={() => openEditForm(detailModal)}
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 size={13} /> Lanjutkan Draf
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VERIFIKASI DOSEN */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(verifyModal)}
        onClose={() => setVerifyModal(null)}
        title="Validasi Sertifikat Mahasiswa"
        size="md"
      >
        {verifyModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">{verifyModal.jenis_sertifikasi}</div>
              <div className="text-slate-500">
                Oleh: <strong>{verifyModal.mahasiswa_nama}</strong> ({verifyModal.mahasiswa_nim})
              </div>
              <div className="flex items-center gap-3 pt-1 text-slate-600">
                <span>Lembaga: <strong>{verifyModal.lembaga_penerbit}</strong></span>
                <span>•</span>
                <span>No: <strong className="font-mono">{verifyModal.nomor_sertifikat}</strong></span>
                <span>•</span>
                <span>Skor: <strong className="text-blue-700">{verifyModal.skor_level}</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Keputusan Verifikasi *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyDecision('TERVERIFIKASI')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    verifyDecision === 'TERVERIFIKASI'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Setujui &amp; Verifikasi Sah
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyDecision('DITOLAK')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    verifyDecision === 'DITOLAK'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle size={16} className="text-rose-600" />
                  Tolak / Minta Revisi
                </button>
              </div>
            </div>

            {verifyDecision === 'DITOLAK' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alasan Penolakan (Wajib Diisi) *
                  </label>
                  <textarea
                    rows={2}
                    value={catatanPenolakan}
                    onChange={(e) => setCatatanPenolakan(e.target.value)}
                    placeholder="Contoh: Dokumen scan buram, nomor sertifikat tidak terlacak di pangkalan data penerbit."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Saran &amp; Arahan Perbaikan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={catatanPerbaikan}
                    onChange={(e) => setCatatanPerbaikan(e.target.value)}
                    placeholder="Contoh: Silakan unggah ulang scan dokumen asli dengan resolusi minimal 300 DPI."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVerifyModal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitVerification}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors ${
                  verifyDecision === 'TERVERIFIKASI'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Simpan Keputusan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: FORM UNGGAH / PERBAIKI SERTIFIKAT */}
      {/* ========================================================================= */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCertId ? 'Perbaiki / Perbarui Pengajuan Sertifikat' : 'Unggah Sertifikat Bahasa & Profesi'}
        size="md"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {rejectionNotice && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <p className="font-bold flex items-center gap-1 mb-0.5">
                <AlertTriangle size={13} /> Catatan Perbaikan Sebelumnya:
              </p>
              <p className="text-slate-700">{rejectionNotice}</p>
            </div>
          )}

          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Mahasiswa *</label>
              <input
                type="text"
                value={mhsNama}
                onChange={(e) => setMhsNama(e.target.value)}
                placeholder="Nama lengkap mahasiswa"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">NIM Mahasiswa *</label>
              <input
                type="text"
                value={mhsNim}
                onChange={(e) => setMhsNim(e.target.value)}
                placeholder="Contoh: 220101001"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Sertifikat *</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as CertificateCategory)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="BAHASA">Bahasa Asing (TOEFL, IELTS, dll)</option>
                <option value="PROFESI_KOMPETENSI">Profesi &amp; Kompetensi (BNSP, Industri)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tahun Angkatan *</label>
              <select
                value={angkatan}
                onChange={(e) => setAngkatan(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
                <option value={2021}>2021</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Jenis Sertifikasi *</label>
            <input
              type="text"
              value={jenisSertifikasi}
              onChange={(e) => setJenisSertifikasi(e.target.value)}
              placeholder="Contoh: TOEFL ITP, AWS Certified Cloud Practitioner, Junior Web Developer BNSP"
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Lembaga Penerbit *</label>
              <input
                type="text"
                value={lembagaPenerbit}
                onChange={(e) => setLembagaPenerbit(e.target.value)}
                placeholder="Contoh: ETS, BNSP, Microsoft"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Registrasi Sertifikat *</label>
              <input
                type="text"
                value={nomorSertifikat}
                onChange={(e) => setNomorSertifikat(e.target.value)}
                placeholder="Contoh: FTS-ITP-2024-88912"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Hasil / Skor / Level *</label>
              <input
                type="text"
                value={skorLevel}
                onChange={(e) => setSkorLevel(e.target.value)}
                placeholder="Contoh: 520, Band 6.5, Kompeten"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nilai Numerik (Opsional)</label>
              <input
                type="number"
                step="0.1"
                value={nilaiNumerik}
                onChange={(e) => setNilaiNumerik(e.target.value)}
                placeholder="Contoh: 520"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Terbit *</label>
              <input
                type="date"
                value={tanggalTerbit}
                onChange={(e) => setTanggalTerbit(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tanggal Kedaluwarsa {isSeumurHidup ? '(Tidak Berlaku)' : '*'}
              </label>
              <input
                type="date"
                disabled={isSeumurHidup}
                value={tanggalKedaluwarsa}
                onChange={(e) => setTanggalKedaluwarsa(e.target.value)}
                className={`w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 ${
                  isSeumurHidup ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="seumurHidupCheck"
              checked={isSeumurHidup}
              onChange={(e) => {
                setIsSeumurHidup(e.target.checked);
                if (e.target.checked) setTanggalKedaluwarsa('');
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="seumurHidupCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Sertifikat berlaku seumur hidup (tanpa tanggal kedaluwarsa)
            </label>
          </div>

          {/* Area Unggah Berkas */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Unggah Berkas Scan Sertifikat (PDF, JPG, PNG, Maks. 5 MB) *
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="certFile"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="certFile" className="cursor-pointer block">
                <Upload className="h-7 w-7 text-blue-600 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  {fileObj ? fileObj.name : 'Pilih dokumen dari perangkat Anda'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {fileObj ? `${(fileObj.size / 1024).toFixed(1)} KB` : 'Maksimal 5 MB (PDF diutamakan)'}
                </p>
              </label>
            </div>
            {fileError && <p className="text-xs text-rose-600 font-medium">{fileError}</p>}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSave('DRAF')}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Simpan sebagai Draf
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSave('MENUNGGU')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                {editingCertId ? 'Simpan & Ajukan Ulang' : 'Ajukan untuk Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

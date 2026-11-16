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
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates } from '@/lib/mock-data';
import type { StudentCertificate, CertificateCategory } from '@/lib/types';

export default function Page() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CertificateCategory>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<StudentCertificate | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Form states
  const [mhsNama, setMhsNama] = useState('');
  const [mhsNim, setMhsNim] = useState('');
  const [angkatan, setAngkatan] = useState(2023);
  const [kategori, setKategori] = useState<CertificateCategory>('BAHASA');
  const [jenisSertifikasi, setJenisSertifikasi] = useState('');
  const [lembagaPenerbit, setLembagaPenerbit] = useState('');
  const [nomorSertifikat, setNomorSertifikat] = useState('');
  const [skorLevel, setSkorLevel] = useState('');
  const [tanggalTerbit, setTanggalTerbit] = useState('');
  const [tanggalKedaluwarsa, setTanggalKedaluwarsa] = useState('');
  const [isSeumurHidup, setIsSeumurHidup] = useState(false);

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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mhsNama.trim() || !jenisSertifikasi.trim() || !nomorSertifikat.trim()) return;

    const newCert: StudentCertificate = {
      id: `cert-${Date.now()}`,
      mahasiswa_nim: mhsNim.trim() || '220101099',
      mahasiswa_nama: mhsNama.trim(),
      angkatan,
      kategori,
      jenis_sertifikasi: jenisSertifikasi.trim(),
      lembaga_penerbit: lembagaPenerbit.trim() || 'Lembaga Sertifikasi Resmi',
      nomor_sertifikat: nomorSertifikat.trim(),
      skor_level: skorLevel.trim() || 'Kompeten',
      tanggal_terbit: tanggalTerbit || new Date().toISOString().split('T')[0],
      tanggal_kedaluwarsa: isSeumurHidup ? undefined : (tanggalKedaluwarsa || undefined),
      is_seumur_hidup: isSeumurHidup,
      berkas_url: `/docs/sertifikat-${nomorSertifikat.trim().toLowerCase()}.pdf`,
      status: 'MENUNGGU',
      is_kedaluwarsa: false,
      is_segera_kedaluwarsa: false,
      created_at: new Date().toISOString(),
    };

    const updated = storageSync.prepend(STORAGE_KEYS.CERTIFICATES, newCert, mockStudentCertificates);
    setCertificates(updated);
    setUploadModalOpen(false);

    // Reset form
    setMhsNama('');
    setMhsNim('');
    setJenisSertifikasi('');
    setLembagaPenerbit('');
    setNomorSertifikat('');
    setSkorLevel('');
    setTanggalTerbit('');
    setTanggalKedaluwarsa('');
    setIsSeumurHidup(false);
  };

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchCat = selectedCategory === 'ALL' || c.kategori === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchSearch =
        c.mahasiswa_nama.toLowerCase().includes(search.toLowerCase()) ||
        c.mahasiswa_nim.includes(search) ||
        c.jenis_sertifikasi.toLowerCase().includes(search.toLowerCase()) ||
        c.nomor_sertifikat.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [certificates, selectedCategory, selectedStatus, search]);

  // Statistics
  const verifiedCount = certificates.filter((c) => c.status === 'TERVERIFIKASI').length;
  const pendingCount = certificates.filter((c) => c.status === 'MENUNGGU').length;
  const expiringCount = certificates.filter((c) => c.is_segera_kedaluwarsa || c.is_kedaluwarsa).length;

  const columns: DataTableColumn<StudentCertificate>[] = [
    {
      key: 'mahasiswa',
      header: 'Mahasiswa & Angkatan',
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
      key: 'jenis_sertifikasi',
      header: 'Sertifikasi & Kategori',
      render: (r) => (
        <div className="max-w-xs">
          <div className="font-semibold text-slate-800 text-sm leading-snug">{r.jenis_sertifikasi}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                r.kategori === 'BAHASA'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : 'bg-purple-50 text-purple-700 border-purple-100'
              }`}
            >
              {r.kategori === 'BAHASA' ? 'Bahasa Asing' : 'Profesi & Kompetensi'}
            </span>
            <span className="text-xs text-slate-500 truncate">{r.lembaga_penerbit}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'nomor',
      header: 'No. Sertifikat & Skor',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <div className="mt-1">
            <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {r.skor_level}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'masa_berlaku',
      header: 'Masa Berlaku',
      render: (r) => (
        <div>
          {r.is_seumur_hidup ? (
            <span className="text-xs text-emerald-700 font-medium">Seumur Hidup</span>
          ) : (
            <div>
              <div className="text-xs text-slate-700">
                s.d. {r.tanggal_kedaluwarsa ? formatDateShort(r.tanggal_kedaluwarsa) : '-'}
              </div>
              {r.is_kedaluwarsa ? (
                <span className="inline-block mt-0.5 text-xs text-rose-600 font-medium">Kedaluwarsa</span>
              ) : r.is_segera_kedaluwarsa ? (
                <span className="inline-block mt-0.5 text-xs text-amber-600 font-medium">&lt; 30 Hari Lagi</span>
              ) : (
                <span className="inline-block mt-0.5 text-xs text-slate-400">Aktif</span>
              )}
            </div>
          )}
        </div>
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
      className: 'text-right min-w-[100px] whitespace-nowrap',
      render: (r) => (
        <button
          onClick={() => setDetailModal(r)}
          className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
        >
          <Eye size={13} /> Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sertifikat Mahasiswa"
        description="Pencatatan dan pengelolaan sertifikat kemampuan bahasa asing serta kompetensi profesi mahasiswa."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/sertifikat/verifikasi"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <ShieldCheck size={15} /> Verifikasi
            </Link>
            <Link
              href="/dashboard/sertifikat/rekap"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Clock size={15} /> Rekapitulasi
            </Link>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus size={16} /> Unggah Sertifikat
            </button>
            <ExportMenu filename="daftar-sertifikat-mahasiswa" />
          </div>
        }
      />

      {/* 3 StatCards - Komposisi Seragam & Selaras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Sertifikat"
          value={`${certificates.length} Berkas`}
          subtitle="Tercatat di pangkalan data prodi"
          badgeTone="blue"
          icon={<FileBadge size={16} />}
        />
        <StatCard
          title="Terverifikasi"
          value={`${verifiedCount} Berkas`}
          subtitle="Tervalidasi & diakui kelulusan"
          badgeTone="emerald"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Menunggu Validasi"
          value={`${pendingCount} Berkas`}
          subtitle="Perlu ditinjau dosen verifikator"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
      </div>

      {/* Filter Tabs & Search */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Kategori:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'BAHASA', 'PROFESI_KOMPETENSI'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat === 'BAHASA' ? 'Bahasa Asing' : 'Profesi'}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-0 sm:ml-2">
              {['ALL', 'TERVERIFIKASI', 'MENUNGGU'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedStatus === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'Semua Status' : st === 'TERVERIFIKASI' ? 'Terverifikasi' : 'Menunggu'}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa, nomor, atau sertifikat..."
              className="input-field text-xs py-1.5 px-3"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCertificates}
          emptyMessage="Tidak ada data sertifikat mahasiswa untuk filter yang dipilih."
        />
      </div>

      {/* Modal Detail Sertifikat */}
      <Modal
        open={Boolean(detailModal)}
        onClose={() => setDetailModal(null)}
        title="Detail Sertifikat Mahasiswa"
        size="md"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Mahasiswa:</span>
                <span className="font-semibold text-slate-800">{detailModal.mahasiswa_nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIM / Angkatan:</span>
                <span className="font-semibold text-slate-800">{detailModal.mahasiswa_nim} (Angkatan {detailModal.angkatan})</span>
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
                <span className="text-slate-400">Hasil / Skor:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{detailModal.skor_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masa Berlaku:</span>
                <span className="font-medium text-slate-800">
                  {formatDateShort(detailModal.tanggal_terbit)} s.d. {detailModal.is_seumur_hidup ? 'Seumur Hidup' : detailModal.tanggal_kedaluwarsa ? formatDateShort(detailModal.tanggal_kedaluwarsa) : '-'}
                </span>
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
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="btn-primary text-xs px-4 py-2"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Unggah Sertifikat Baru */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Unggah Sertifikat Bahasa / Profesi"
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Mahasiswa</label>
              <input
                type="text"
                value={mhsNama}
                onChange={(e) => setMhsNama(e.target.value)}
                placeholder="Nama lengkap"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">NIM Mahasiswa</label>
              <input
                type="text"
                value={mhsNim}
                onChange={(e) => setMhsNim(e.target.value)}
                placeholder="220101000"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Sertifikat</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as CertificateCategory)}
                className="select-field"
              >
                <option value="BAHASA">Bahasa Asing (TOEFL/IELTS/TOEIC)</option>
                <option value="PROFESI_KOMPETENSI">Profesi &amp; Kompetensi (BNSP/Cloud/IT)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tahun Angkatan</label>
              <input
                type="number"
                min={2018}
                max={2030}
                value={angkatan}
                onChange={(e) => setAngkatan(Number(e.target.value))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Sertifikasi / Ujian</label>
            <input
              type="text"
              value={jenisSertifikasi}
              onChange={(e) => setJenisSertifikasi(e.target.value)}
              placeholder="Contoh: TOEFL ITP, AWS Cloud Practitioner, Sertifikasi BNSP"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Lembaga Penerbit Resmi</label>
            <input
              type="text"
              value={lembagaPenerbit}
              onChange={(e) => setLembagaPenerbit(e.target.value)}
              placeholder="Contoh: ETS Indonesia, British Council, BNSP"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Registrasi / Sertifikat</label>
              <input
                type="text"
                value={nomorSertifikat}
                onChange={(e) => setNomorSertifikat(e.target.value)}
                placeholder="Contoh: ETS-ITP-2024-001"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Skor / Level Capaian</label>
              <input
                type="text"
                value={skorLevel}
                onChange={(e) => setSkorLevel(e.target.value)}
                placeholder="Contoh: 550, Band 7.0, Kompeten"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Terbit</label>
              <input
                type="date"
                value={tanggalTerbit}
                onChange={(e) => setTanggalTerbit(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Kedaluwarsa</label>
              <input
                type="date"
                value={tanggalKedaluwarsa}
                disabled={isSeumurHidup}
                onChange={(e) => setTanggalKedaluwarsa(e.target.value)}
                className="input-field disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="seumurHidup"
              checked={isSeumurHidup}
              onChange={(e) => setIsSeumurHidup(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
            />
            <label htmlFor="seumurHidup" className="text-xs text-slate-700 font-medium cursor-pointer">
              Sertifikat berlaku seumur hidup (tanpa masa kedaluwarsa)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Simpan &amp; Ajukan Validasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileBadge,
  Clock,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Award,
  Send,
  Bell,
  BarChart3,
  Users,
  AlertTriangle,
  GraduationCap,
  Percent,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { formatDateShort } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockStudentCertificates, mockCertificateBatchStats } from '@/lib/mock-data';
import type { StudentCertificate, CertificateBatchStat } from '@/lib/types';

export default function RekapSertifikatPage() {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [activeSection, setActiveSection] = useState<'MASA_BERLAKU' | 'ANGKATAN' | 'SKOR_BAHASA'>('MASA_BERLAKU');
  const [filterMasa, setFilterMasa] = useState<'ALL' | 'AKTIF' | 'SEGERA' | 'KEDALUWARSA'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const verifiedCerts = useMemo(() => {
    return certificates.filter((c) => c.status === 'TERVERIFIKASI');
  }, [certificates]);

  const bahasaCerts = useMemo(() => {
    return verifiedCerts.filter((c) => c.kategori === 'BAHASA');
  }, [verifiedCerts]);

  const profesiCerts = useMemo(() => {
    return verifiedCerts.filter((c) => c.kategori === 'PROFESI_KOMPETENSI');
  }, [verifiedCerts]);

  const activeCount = verifiedCerts.filter((c) => !c.is_kedaluwarsa && !c.is_segera_kedaluwarsa).length;
  const expiringCount = verifiedCerts.filter((c) => c.is_segera_kedaluwarsa).length;
  const expiredCount = verifiedCerts.filter((c) => c.is_kedaluwarsa).length;

  const filteredMasaList = useMemo(() => {
    if (filterMasa === 'SEGERA') {
      return verifiedCerts.filter((c) => c.is_segera_kedaluwarsa);
    }
    if (filterMasa === 'KEDALUWARSA') {
      return verifiedCerts.filter((c) => c.is_kedaluwarsa);
    }
    if (filterMasa === 'AKTIF') {
      return verifiedCerts.filter((c) => !c.is_kedaluwarsa && !c.is_segera_kedaluwarsa);
    }
    return verifiedCerts;
  }, [verifiedCerts, filterMasa]);

  const handleSendReminder = (cert: StudentCertificate) => {
    const updated = storageSync.update(
      STORAGE_KEYS.CERTIFICATES,
      cert.id,
      { notifikasi_kedaluwarsa_terkirim: true },
      mockStudentCertificates
    );
    setCertificates(updated);
    setToastMessage(`Pesan pengingat pembaruan sertifikat berhasil dikirimkan ke mahasiswa ${cert.mahasiswa_nama} (${cert.mahasiswa_nim}).`);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Sebaran Skor Bahasa (TOEFL & IELTS)
  const toeflDistribution = useMemo(() => {
    const toeflList = bahasaCerts.filter((c) =>
      c.jenis_sertifikasi.toUpperCase().includes('TOEFL') ||
      c.jenis_sertifikasi.toUpperCase().includes('TOEIC')
    );

    let under450 = 0;
    let range450to499 = 0;
    let range500to549 = 0;
    let above550 = 0;

    toeflList.forEach((c) => {
      const score = c.nilai_numerik || parseInt(c.skor_level) || 0;
      if (score < 450) under450++;
      else if (score < 500) range450to499++;
      else if (score < 550) range500to549++;
      else above550++;
    });

    const total = toeflList.length || 1;
    return [
      { label: 'Tinggi (≥ 550)', count: above550, pct: ((above550 / total) * 100).toFixed(1), badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { label: 'Menengah Atas (500 – 549)', count: range500to549, pct: ((range500to549 / total) * 100).toFixed(1), badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      { label: 'Standar Lulus (450 – 499)', count: range450to499, pct: ((range450to499 / total) * 100).toFixed(1), badge: 'bg-amber-50 text-amber-700 border-amber-200' },
      { label: 'Perlu Pengulangan (< 450)', count: under450, pct: ((under450 / total) * 100).toFixed(1), badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    ];
  }, [bahasaCerts]);

  const columnsMasaBerlaku: DataTableColumn<StudentCertificate>[] = [
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
      key: 'jenis',
      header: 'Jenis Sertifikasi & Kategori',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.jenis_sertifikasi}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.lembaga_penerbit}</div>
        </div>
      ),
    },
    {
      key: 'nomor_skor',
      header: 'Nomor & Skor',
      render: (r) => (
        <div>
          <div className="text-xs text-slate-700 font-mono">{r.nomor_sertifikat}</div>
          <div className="text-xs font-semibold text-blue-700 mt-0.5">Skor: {r.skor_level}</div>
        </div>
      ),
    },
    {
      key: 'kedaluwarsa',
      header: 'Tanggal Kedaluwarsa',
      render: (r) => (
        <span className="text-xs text-slate-700 font-medium">
          {r.is_seumur_hidup
            ? 'Seumur Hidup'
            : r.tanggal_kedaluwarsa
            ? formatDateShort(r.tanggal_kedaluwarsa)
            : '-'}
        </span>
      ),
    },
    {
      key: 'status_masa',
      header: 'Status Masa Berlaku',
      render: (r) => {
        if (r.is_seumur_hidup) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 size={12} /> Seumur Hidup
            </span>
          );
        }
        if (r.is_kedaluwarsa) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <ShieldAlert size={12} /> Kedaluwarsa
            </span>
          );
        }
        if (r.is_segera_kedaluwarsa) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Clock size={12} /> &lt; 30 Hari Lagi
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <CheckCircle2 size={12} /> Masih Aktif
          </span>
        );
      },
    },
    {
      key: 'aksi_pengingat',
      header: 'Pengingat Mahasiswa',
      className: 'text-right min-w-[130px] whitespace-nowrap',
      render: (r) => {
        if (r.is_seumur_hidup) {
          return <span className="text-xs text-slate-400 italic">Tidak kedaluwarsa</span>;
        }
        if (r.is_segera_kedaluwarsa || r.is_kedaluwarsa) {
          return (
            <button
              onClick={() => handleSendReminder(r)}
              disabled={r.notifikasi_kedaluwarsa_terkirim}
              className={`h-8 px-3 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                r.notifikasi_kedaluwarsa_terkirim
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Send size={12} />
              <span>{r.notifikasi_kedaluwarsa_terkirim ? 'Telah Diingatkan' : 'Kirim Notifikasi'}</span>
            </button>
          );
        }
        return <span className="text-xs text-slate-400">-</span>;
      },
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
        title="Rekapitulasi Sertifikat & Masa Berlaku"
        description="Analisis statistik kepemilikan sertifikat terverifikasi per angkatan, sebaran skor kemampuan bahasa, serta pemantauan masa aktif dokumen kelulusan."
        actions={<ExportMenu filename="rekapitulasi-sertifikat-mahasiswa" />}
      />

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-slate-800 font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* 4 StatCards yang seragam, jelas, dan selaras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sertifikat Terverifikasi"
          value={`${verifiedCerts.length} Berkas`}
          subtitle="Tervalidasi dosen verifikator"
          badgeTone="blue"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Sertifikasi Bahasa"
          value={`${bahasaCerts.length} Berkas`}
          subtitle="TOEFL, IELTS, TOEIC, JLPT"
          badgeTone="indigo"
          icon={<FileBadge size={16} />}
        />
        <StatCard
          title="Sertifikasi Profesi"
          value={`${profesiCerts.length} Berkas`}
          subtitle="BNSP, Cloud & Industri"
          badgeTone="emerald"
          icon={<Award size={16} />}
        />
        <StatCard
          title="Segera Kedaluwarsa"
          value={`${expiringCount} Berkas`}
          subtitle="Perlu perpanjangan (< 30 hari)"
          badgeTone="amber"
          icon={<Clock size={16} />}
        />
      </div>

      {/* Navigasi Sub-Tab Rekapitulasi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('MASA_BERLAKU')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSection === 'MASA_BERLAKU'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock size={14} /> Pemantauan Masa Berlaku
        </button>
        <button
          onClick={() => setActiveSection('ANGKATAN')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSection === 'ANGKATAN'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <GraduationCap size={14} /> Rekapitulasi per Angkatan
        </button>
        <button
          onClick={() => setActiveSection('SKOR_BAHASA')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSection === 'SKOR_BAHASA'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={14} /> Sebaran Skor Bahasa
        </button>
      </div>

      {/* SECTION 1: Pemantauan Masa Berlaku & Pengingat */}
      {activeSection === 'MASA_BERLAKU' && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'AKTIF', 'SEGERA', 'KEDALUWARSA'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMasa(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterMasa === m
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'ALL'
                    ? `Semua (${verifiedCerts.length})`
                    : m === 'AKTIF'
                    ? `Masih Aktif (${activeCount})`
                    : m === 'SEGERA'
                    ? `Segera Kedaluwarsa (${expiringCount})`
                    : `Kedaluwarsa (${expiredCount})`}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredMasaList.length} sertifikat terverifikasi
            </span>
          </div>

          <DataTable
            columns={columnsMasaBerlaku}
            data={filteredMasaList}
            emptyMessage="Tidak ada data sertifikat terverifikasi untuk status masa berlaku yang dipilih."
          />
        </div>
      )}

      {/* SECTION 2: Rekapitulasi per Angkatan */}
      {activeSection === 'ANGKATAN' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockCertificateBatchStats.map((stat) => (
              <div key={stat.angkatan} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Angkatan {stat.angkatan}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {stat.persentase_kepemilikan}% Tersertifikasi
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.mahasiswa_memiliki_sertifikat}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {stat.total_mahasiswa} Mahasiswa
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(stat.persentase_kepemilikan, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sertifikat Bahasa:</span>
                    <strong className="text-slate-800">{stat.sertifikat_bahasa} Berkas</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sertifikat Profesi:</span>
                    <strong className="text-slate-800">{stat.sertifikat_profesi} Berkas</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Tabel Rekapitulasi Kepemilikan Sertifikat Resmi Program Studi
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tahun Angkatan</th>
                    <th className="py-2.5 px-3">Populasi Mahasiswa</th>
                    <th className="py-2.5 px-3">Mahasiswa Tersertifikasi</th>
                    <th className="py-2.5 px-3">Sertifikat Bahasa</th>
                    <th className="py-2.5 px-3">Sertifikat Profesi</th>
                    <th className="py-2.5 px-3">Total Dokumen Sah</th>
                    <th className="py-2.5 px-3">Persentase Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockCertificateBatchStats.map((s) => (
                    <tr key={s.angkatan} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">Angkatan {s.angkatan}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.total_mahasiswa} Orang</td>
                      <td className="py-2.5 px-3 font-semibold text-blue-700">{s.mahasiswa_memiliki_sertifikat} Orang</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.sertifikat_bahasa}</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.sertifikat_profesi}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{s.total_sertifikat_terverifikasi}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {s.persentase_kepemilikan}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Sebaran Skor Bahasa */}
      {activeSection === 'SKOR_BAHASA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Distribusi Skor TOEFL / TOEIC</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standar minimal kelulusan prodi: skor TOEFL ITP ≥ 450
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {bahasaCerts.length} Peserta Terdata
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {toeflDistribution.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">
                      {item.count} Mahasiswa ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(parseFloat(item.pct), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Kebijakan Kelayakan Sertifikasi Kelulusan</h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">1. Sertifikat Kemampuan Bahasa Asing</p>
                <p>
                  Mahasiswa wajib memiliki minimal satu sertifikat bahasa asing resmi (TOEFL ITP minimal 450, IELTS minimal 5.5, TOEIC minimal 600, atau JLPT minimal N3) yang masih berlaku saat sidang tugas akhir.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">2. Sertifikat Kompetensi Profesi</p>
                <p>
                  Sertifikat profesi yang diakui berasal dari Badan Nasional Sertifikasi Profesi (BNSP), Lembaga Sertifikasi Profesi (LSP), atau sertifikasi vendor internasional (AWS, Google Cloud, Cisco, Oracle, Microsoft).
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">3. Ketentuan Masa Berlaku</p>
                <p>
                  Sistem otomatis memberikan peringatan kepada mahasiswa yang masa berlaku sertifikatnya tersisa &lt; 30 hari agar segera melakukan pembaruan atau tes ulang.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

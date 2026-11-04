'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockRkaDocuments } from '@/lib/mock-data';
import { rkaService } from '@/lib/api/services/rka.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RkaDocument } from '@/lib/types';
import {
  Plus,
  Eye,
  Layers,
  Sparkles,
  ChevronRight,
  Search,
  Calendar,
  PieChart,
  Receipt,
  FileEdit,
} from 'lucide-react';
import { formatRupiah, calculateAbsorptionPercentage } from '@/lib/utils';

const QUARTERLY_RKA_DATA = [
  { triwulan: 'TW I (Jan–Mar)', Target: 90, Realisasi: 85 },
  { triwulan: 'TW II (Apr–Jun)', Target: 120, Realisasi: 115 },
  { triwulan: 'TW III (Jul–Sep)', Target: 140, Realisasi: 137.5 },
  { triwulan: 'TW IV (Okt–Des)', Target: 100, Realisasi: 72 },
];

const RKA_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Realisasi', fill: '#6EE7B7', name: 'Realisasi Serapan (Juta Rp)' },
  { dataKey: 'Target', fill: '#818CF8', name: 'Pagu Rencana (Juta Rp)' },
];

const PRIORITY_PROGRAMS = [
  {
    nama: 'Pengembangan Kurikulum OBE & RPS',
    pagu: 'Rp 85.000.000',
    serapan: '88% terserap',
    desc: 'Lokakarya penyelarasan CPL, CPMK, dan evaluasi mitra.',
    href: '/dashboard/rka/2025/versi-kerja',
  },
  {
    nama: 'Bantuan Publikasi & Seminar Dosen',
    pagu: 'Rp 120.000.000',
    serapan: '76% terserap',
    desc: 'Insentif publikasi Scopus/Sinta dan perjalanan dinas.',
    href: '/dashboard/rka/2025/realisasi',
  },
  {
    nama: 'Pemeliharaan Sarana Lab Komputer',
    pagu: 'Rp 145.000.000',
    serapan: '70% terserap',
    desc: 'Peremajaan perangkat jaringan dan lisensi perangkat lunak.',
    href: '/dashboard/rka/2025/serapan',
  },
  {
    nama: 'Pembinaan Prestasi & Sertifikasi Mhs',
    pagu: 'Rp 100.000.000',
    serapan: '68% terserap',
    desc: 'Dukungan kompetisi nasional dan uji kompetensi profesi.',
    href: '/dashboard/rka/2025',
  },
];

export default function RkaListPage() {
  const [rkaList, setRkaList] = useState<RkaDocument[]>(mockRkaDocuments);
  const [modalOpen, setModalOpen] = useState(false);
  const [tahunBaru, setTahunBaru] = useState(new Date().getFullYear() + 1);
  const [judulBaru, setJudulBaru] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'DRAF'>('ALL');

  useEffect(() => {
    const local = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
    if (local && local.length > 0) {
      setRkaList(local);
    }

    let active = true;
    rkaService
      .getRkaList()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setRkaList(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: RkaDocument = {
      id: `rka-${tahunBaru}`,
      tahun_anggaran: tahunBaru,
      judul: judulBaru || `Rencana Kerja dan Anggaran (RKA) Prodi SI Tahun ${tahunBaru}`,
      status: 'DRAF',
      total_anggaran: 0,
      dibuat_oleh: 'u-admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: [
        {
          id: `rka-ver-${tahunBaru}-1`,
          rka_id: `rka-${tahunBaru}`,
          nomor_versi: 1,
          status: 'DRAF',
          total_anggaran: 0,
          row_version: 1,
          dibuat_oleh: 'u-admin',
          created_at: new Date().toISOString(),
        },
      ],
    };

    const updated = storageSync.prepend(STORAGE_KEYS.RKA_DOCUMENTS, newDoc, rkaList);
    setRkaList(updated);
    setModalOpen(false);

    try {
      await rkaService.createRka(newDoc);
    } catch {
      // Offline fallback
    }
  };

  const activeDoc = rkaList[0] || mockRkaDocuments[0];
  const serapanPct = calculateAbsorptionPercentage(
    activeDoc.total_realisasi || 0,
    activeDoc.total_anggaran
  );
  const sisaPagu = (activeDoc.total_anggaran || 0) - (activeDoc.total_realisasi || 0);

  const filteredRka = rkaList.filter((doc) => {
    const matchSearch =
      doc.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.tahun_anggaran).includes(searchTerm);
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'DRAF'
        ? doc.status === 'DRAF'
        : doc.status !== 'DRAF';
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rencana Kerja dan Anggaran (RKA) Program Studi"
        description="Penyusunan RKA tahunan berversi, pengelolaan pos kegiatan, pencatatan realisasi, dan pemantauan serapan anggaran."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Buat RKA Tahun Anggaran</span>
          </button>
        }
      />

      {/* Main LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title={`Pagu RKA ${activeDoc.tahun_anggaran}`}
              value={formatRupiah(activeDoc.total_anggaran)}
              badgeText={`TA ${activeDoc.tahun_anggaran}`}
              badgeTone="emerald"
              subtitle="Pagu anggaran disahkan"
            />
            <StatCard
              title="Realisasi Serapan"
              value={`${serapanPct}%`}
              badgeText="+15% TW III"
              badgeTone="emerald"
              subtitle={formatRupiah(activeDoc.total_realisasi || 0)}
            />
            <StatCard
              title="Sisa Pagu Tersedia"
              value={formatRupiah(sisaPagu)}
              badgeText={`${rkaList.length} Dokumen`}
              badgeTone="indigo"
              subtitle="Siap dialokasikan TW IV"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Pagu vs Realisasi Serapan</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Pemantauan distribusi serapan anggaran operasional prodi per triwulan (Juta Rupiah)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Tahun Anggaran 2025
                </span>
                <Link
                  href="/dashboard/rka/2025/serapan"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Detail Serapan →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Realisasi Terserap</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Target Pagu Triwulan</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Kendali Versi &amp; Revisi</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Setiap revisi anggaran disimpan sebagai <strong>versi historis terpisah</strong> dilengkapi komparasi otomatis (Diff Viewer) antar versi.
                  </p>
                </div>

                <Link
                  href="/dashboard/rka/2025/versi-kerja"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <FileEdit className="w-4 h-4" />
                  <span>Buka Editor Versi Kerja</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={QUARTERLY_RKA_DATA}
                  xKey="triwulan"
                  series={RKA_SERIES}
                  domain={[0, 160]}
                  ticks={[0, 40, 80, 120, 160]}
                  yAxisFormatter={(val) => `${val} Jt`}
                  tooltipFormatter={(val) => `Rp ${val} Jt`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage RKA Documents Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Dokumen RKA Tahunan</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari tahun atau judul RKA..."
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* LoopAI Pill Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Semua Dokumen</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {rkaList.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('AKTIF')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  statusFilter === 'AKTIF'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Disahkan &amp; Berjalan</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'AKTIF' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {rkaList.filter((d) => d.status !== 'DRAF').length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('DRAF')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  statusFilter === 'DRAF'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Draf Penyusunan</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'DRAF' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {rkaList.filter((d) => d.status === 'DRAF').length}
                </span>
              </button>
            </div>

            {/* LoopAI Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs sm:text-sm font-medium text-slate-400">
                    <th className="py-3 px-3 text-left">Tahun &amp; Dokumen</th>
                    <th className="py-3 px-3 text-left">Pagu Anggaran</th>
                    <th className="py-3 px-3 text-left">Serapan</th>
                    <th className="py-3 px-3 text-left">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredRka.map((row, idx) => {
                    const pct = calculateAbsorptionPercentage(
                      row.total_realisasi || 0,
                      row.total_anggaran
                    );
                    const avatarColors = [
                      'bg-indigo-100 text-indigo-700',
                      'bg-emerald-100 text-emerald-700',
                      'bg-sky-100 text-sky-700',
                    ];

                    return (
                      <tr key={row.id} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div
                                className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center ${
                                  avatarColors[idx % avatarColors.length]
                                }`}
                              >
                                {String(row.tahun_anggaran).slice(-2)}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                v{row.versions?.length || 1}
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/rka/${row.tahun_anggaran}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1 transition-colors"
                              >
                                {row.judul}
                              </Link>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Tahun Anggaran {row.tahun_anggaran} &bull; {row.versions?.length || 1} Versi
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {formatRupiah(row.total_anggaran)}
                          </p>
                          <p className="text-xs text-slate-400">
                            Realisasi: {formatRupiah(row.total_realisasi || 0)}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 w-36">
                          <div className="space-y-1">
                            <span className="text-xs font-extrabold text-indigo-700">{pct}%</span>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={row.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/dashboard/rka/${row.tahun_anggaran}`}
                            className="btn-secondary text-xs sm:text-sm py-1.5 px-3.5 inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            <span>Buka RKA</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Top Right Card: Priority Programs */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Pos Anggaran Utama</h3>
              <Link
                href="/dashboard/rka/2025/serapan"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="space-y-2">
              {PRIORITY_PROGRAMS.map((prog, idx) => (
                <Link
                  key={idx}
                  href={prog.href}
                  className={`block rounded-2xl p-3.5 transition-all ${
                    idx === 0
                      ? 'bg-indigo-50/60 border border-indigo-100/80'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {prog.nama}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                    <span className="font-semibold text-slate-700">{prog.pagu}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 font-semibold">{prog.serapan}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">
                    {prog.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Pengelolaan Anggaran Berversi 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali RKA
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Diff Versi
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Multi-Revisi
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-37 s/d FR-40
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/rka/2025/versi-kerja"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Editor Versi Kerja
                </p>
              </Link>

              <Link
                href="/dashboard/rka/2025/realisasi"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Catat Realisasi
                </p>
              </Link>

              <Link
                href="/dashboard/rka/2025/serapan"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Monitoring Serapan
                </p>
              </Link>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Tahun RKA Baru
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Inisiasi dokumen RKA tahun baru...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Buat RKA Baru */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat RKA Tahun Anggaran Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          <div>
            <label className="label">Tahun Anggaran</label>
            <input
              type="number"
              min={2024}
              max={2035}
              required
              value={tahunBaru}
              onChange={(e) => setTahunBaru(Number(e.target.value) || 2026)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="label">Judul Dokumen RKA</label>
            <input
              type="text"
              required
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
              placeholder={`Rencana Kerja dan Anggaran (RKA) Prodi SI Tahun ${tahunBaru}`}
              className="input-field text-sm"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900 leading-relaxed">
            Sistem akan secara otomatis menerbitkan dokumen RKA berstatus <strong>DRAF</strong> beserta <strong>Versi Kerja Nomor 1</strong> yang siap diisi dengan daftar kegiatan dan pos anggaran.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">
              Batal
            </button>
            <button type="submit" className="btn-primary text-sm">
              Buat Dokumen RKA
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

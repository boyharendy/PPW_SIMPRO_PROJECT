'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockPublications } from '@/lib/mock-data';
import { publicationService } from '@/lib/api/services/publication.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { Publication } from '@/lib/types';
import {
  Plus,
  Search,
  BookOpen,
  ExternalLink,
  Eye,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  BarChart3,
  Award,
  Calendar,
} from 'lucide-react';

const PUB_ANALYTICS_DATA = [
  { kategori: 'Scopus Q1/Q2', Terbit: 4, Proses: 2 },
  { kategori: 'Sinta 1 & 2', Terbit: 7, Proses: 3 },
  { kategori: 'Sinta 3 & 4', Terbit: 5, Proses: 2 },
  { kategori: 'Prosiding', Terbit: 6, Proses: 2 },
  { kategori: 'HKI & Buku', Terbit: 5, Proses: 1 },
];

const PUB_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Terbit', fill: '#6EE7B7', name: 'Terbit & Terverifikasi' },
  { dataKey: 'Proses', fill: '#818CF8', name: 'Tahap Submit / Review' },
];

export default function PublikasiListPage() {
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');

  useEffect(() => {
    const local = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    if (local && local.length > 0) {
      setPublications(local);
    }

    let active = true;
    publicationService
      .getPublications()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setPublications(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = publications.filter((p) => {
    const matchSearch =
      p.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nama_target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.some((a) => a.nama_penulis.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchJenis = selectedJenis === 'ALL' || p.jenis === selectedJenis;
    return matchSearch && matchJenis;
  });

  const pendingVerif = publications.filter((p) => p.status_verifikasi === 'MENUNGGU');
  const studentCollab = publications.filter((p) =>
    p.authors?.some((a) => a.tipe_penulis === 'MAHASISWA')
  );
  const terbitCount = publications.filter((p) => p.status === 'TERBIT').length;

  const filterTabs = [
    { key: 'ALL', label: 'Semua Karya', count: publications.length },
    { key: 'JURNAL', label: 'Jurnal', count: publications.filter((p) => p.jenis === 'JURNAL').length },
    { key: 'PROSIDING', label: 'Prosiding', count: publications.filter((p) => p.jenis === 'PROSIDING').length },
    { key: 'BUKU', label: 'Buku', count: publications.filter((p) => p.jenis === 'BUKU').length },
    { key: 'HKI', label: 'HKI', count: publications.filter((p) => p.jenis === 'HKI').length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Publikasi Ilmiah Dosen & Mahasiswa"
        description="Pencatatan artikel jurnal, prosiding konferensi, buku, dan HKI beserta pelacakan tahapan publikasi dan verifikasi."
        action={
          <Link
            href="/dashboard/publikasi/baru"
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Tambah Publikasi</span>
          </Link>
        }
      />

      {/* Main LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Karya Ilmiah"
              value={`${publications.length} Karya`}
              badgeText={`+${terbitCount} Terbit`}
              badgeTone="emerald"
              subtitle="Tercatat resmi di prodi"
            />
            <StatCard
              title="Kolaborasi Mahasiswa"
              value={`${studentCollab.length} Riset`}
              badgeText="IKU-5 Aktif"
              badgeTone="indigo"
              subtitle="Keterlibatan dosen & mhs"
            />
            <StatCard
              title="Antrean Verifikasi"
              value={`${pendingVerif.length} Karya`}
              badgeText={pendingVerif.length > 0 ? 'Perlu Cek' : 'Tuntas'}
              badgeTone={pendingVerif.length > 0 ? 'amber' : 'emerald'}
              subtitle="Unggahan mandiri mahasiswa"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Capaian Publikasi &amp; Akreditasi</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Distribusi luaran karya ilmiah berdasarkan peringkat indeksasi dan tahapan naskah
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Tahun Akademik 2025
                </span>
                <Link
                  href="/dashboard/publikasi/rekap"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Detail IKU →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Terbit &amp; Terverifikasi</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Tahap Submit / Review</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Sinkronisasi BKD &amp; IKU</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Karya dosen yang berstatus <strong>Terbit</strong> otomatis diteruskan ke portofolio Kinerja Dosen dan borang akreditasi prodi.
                  </p>
                </div>

                <Link
                  href="/dashboard/publikasi/rekap"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Buka Analitik Rekap</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={PUB_ANALYTICS_DATA}
                  xKey="kategori"
                  series={PUB_SERIES}
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tooltipFormatter={(val) => `${val} Karya`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage Publications Table Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Direktori Publikasi</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari judul, jurnal, atau penulis..."
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* LoopAI Pill Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {filterTabs.map((tab) => {
                const isActive = selectedJenis === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedJenis(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LoopAI Avatar Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs sm:text-sm font-medium text-slate-400">
                    <th className="py-3 px-3 text-left">Penulis Utama</th>
                    <th className="py-3 px-3 text-left">Judul Karya &amp; Target</th>
                    <th className="py-3 px-3 text-left">Indeksasi</th>
                    <th className="py-3 px-3 text-left">Tahun</th>
                    <th className="py-3 px-3 text-left">Status Tahapan</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map((row, idx) => {
                    const firstAuthor = row.authors[0]?.nama_penulis || 'Sivitas Akademika';
                    const initials = firstAuthor
                      .replace(/Dr\.|M\.T\.|M\.Kom\.|S\.Kom\.|,/g, '')
                      .trim()
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('');
                    const avatarColors = [
                      'bg-indigo-100 text-indigo-700',
                      'bg-emerald-100 text-emerald-700',
                      'bg-sky-100 text-sky-700',
                      'bg-purple-100 text-purple-700',
                    ];

                    return (
                      <tr key={row.id} className="hover:bg-indigo-50/25 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div
                                className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center ${
                                  avatarColors[idx % avatarColors.length]
                                }`}
                              >
                                {initials}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                {row.authors.length}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-[150px]">
                              <p className="font-bold text-slate-900 text-sm truncate">{firstAuthor}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {row.authors.length > 1
                                  ? `+${row.authors.length - 1} rekan penulis`
                                  : 'Penulis Tunggal'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <Link
                            href={`/dashboard/publikasi/${row.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1 transition-colors"
                          >
                            {row.judul}
                          </Link>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {row.nama_target}
                          </p>
                          {row.doi && (
                            <a
                              href={`https://doi.org/${row.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                            >
                              <ExternalLink size={11} />
                              <span>{row.doi}</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold">
                            {row.jenis}
                          </span>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            {row.peringkat.replace(/_/g, ' ')}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">{row.tahun}</td>
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <StatusBadge status={row.status} size="sm" />
                            {row.status_verifikasi !== 'TIDAK_PERLU' && (
                              <div className="block">
                                <StatusBadge status={row.status_verifikasi} size="sm" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/dashboard/publikasi/${row.id}`}
                            className="btn-secondary text-xs sm:text-sm py-1.5 px-3.5 inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
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
          {/* 1. Top Right Card: Priority Tasks Style */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Antrean Prioritas</h3>
              <Link
                href="/dashboard/publikasi/verifikasi"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="space-y-2">
              {publications.slice(0, 4).map((pub, idx) => (
                <Link
                  key={pub.id}
                  href={
                    pub.status_verifikasi === 'MENUNGGU'
                      ? '/dashboard/publikasi/verifikasi'
                      : `/dashboard/publikasi/${pub.id}`
                  }
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
                        {pub.jenis} &bull; {pub.peringkat.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                    <span>Tahun {pub.tahun}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-600 font-semibold">{pub.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 pl-6 line-clamp-1 font-medium">
                    {pub.judul}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Manajemen Riset &amp; Karya Ilmiah 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali Publikasi
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Auto-Sync BKD
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Multi-Penulis
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-29 s/d FR-32
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/publikasi/baru"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Input Karya Baru
                </p>
              </Link>

              <Link
                href="/dashboard/publikasi/verifikasi"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Verifikasi Mhs
                </p>
              </Link>

              <Link
                href="/dashboard/publikasi/review-saya"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Review Naskah
                </p>
              </Link>

              <Link
                href="/dashboard/publikasi/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Rekapitulasi IKU
                </p>
              </Link>
            </div>

            <Link
              href="/dashboard/publikasi/baru"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Catat publikasi atau HKI baru...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

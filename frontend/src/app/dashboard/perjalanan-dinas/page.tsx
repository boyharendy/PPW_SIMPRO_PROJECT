'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockBusinessTrips } from '@/lib/mock-data';
import { tripService } from '@/lib/api/services/trip.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { BusinessTrip } from '@/lib/types';
import {
  Plus,
  Plane,
  Search,
  Eye,
  Sparkles,
  ChevronRight,
  Calendar,
  CheckCircle2,
  FileText,
  Receipt,
} from 'lucide-react';
import { formatDateShort, formatRupiah } from '@/lib/utils';

const TRIP_COST_CHART = [
  { komponen: 'Transportasi', Estimasi: 14.5, Realisasi: 13.8 },
  { komponen: 'Akomodasi', Estimasi: 12.0, Realisasi: 11.2 },
  { komponen: 'Uang Harian', Estimasi: 8.5, Realisasi: 8.5 },
  { komponen: 'Registrasi', Estimasi: 9.0, Realisasi: 8.6 },
];

const TRIP_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Estimasi', fill: '#6EE7B7', name: 'Estimasi Pengajuan (Juta Rp)' },
  { dataKey: 'Realisasi', fill: '#818CF8', name: 'Realisasi Riil SPJ (Juta Rp)' },
];

export default function PerjalananDinasListPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const local = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    if (local && local.length > 0) {
      setTrips(local);
    }

    let active = true;
    tripService
      .getTrips()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setTrips(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = trips.filter((t) => {
    const matchSearch =
      t.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maksud_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.pengaju?.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalEstimasiAll = trips.reduce(
    (sum, t) => sum + t.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0),
    0
  );
  const pendingCount = trips.filter((t) => t.status === 'DIAJUKAN').length;
  const approvedCount = trips.filter(
    (t) => t.status === 'DISETUJUI' || t.status === 'DILAPORKAN' || t.status === 'SELESAI'
  ).length;

  const statusTabs = [
    { key: 'ALL', label: 'Semua Penugasan', count: trips.length },
    { key: 'DIAJUKAN', label: 'Diajukan', count: trips.filter((t) => t.status === 'DIAJUKAN').length },
    { key: 'DISETUJUI', label: 'Disetujui', count: trips.filter((t) => t.status === 'DISETUJUI').length },
    { key: 'DILAPORKAN', label: 'Dilaporkan', count: trips.filter((t) => t.status === 'DILAPORKAN').length },
    { key: 'SELESAI', label: 'Selesai', count: trips.filter((t) => t.status === 'SELESAI').length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar & Kendali Perjalanan Dinas Dosen"
        description="Pengajuan izin tugas, persetujuan perjalanan dinas, pelaporan hasil, dan verifikasi bukti riil pengeluaran (SPJ)."
        action={
          <Link
            href="/dashboard/perjalanan-dinas/baru"
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Ajukan Perjalanan Baru</span>
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
              title="Total Penugasan"
              value={`${trips.length} Tugas`}
              badgeText={`+${approvedCount} Disetujui`}
              badgeTone="emerald"
              subtitle="Semester Ganjil 2024/2025"
            />
            <StatCard
              title="Total Estimasi Biaya"
              value={formatRupiah(totalEstimasiAll)}
              badgeText="-6.4% Efisien"
              badgeTone="indigo"
              subtitle="Dibandingkan pagu awal"
            />
            <StatCard
              title="Antrean Persetujuan"
              value={`${pendingCount} Pengajuan`}
              badgeText={pendingCount > 0 ? 'Perlu Tindakan' : 'Terkendali'}
              badgeTone={pendingCount > 0 ? 'amber' : 'emerald'}
              subtitle="Menunggu persetujuan Kaprodi"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Estimasi vs Realisasi SPJ</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Perbandingan komponen biaya pengajuan terhadap bukti pengeluaran riil (Juta Rupiah)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Tahun Anggaran 2025
                </span>
                <Link
                  href="/dashboard/perjalanan-dinas/rekap"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Rekap SPJ →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Estimasi Awal</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Realisasi Riil SPJ</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Akuntabilitas SPJ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Seluruh perjalanan dinas yang telah selesai wajib mengunggah laporan hasil dan kuitansi riil maksimal <strong>7 hari kerja</strong>.
                  </p>
                </div>

                <Link
                  href="/dashboard/perjalanan-dinas/persetujuan"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buka Antrean Persetujuan</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={TRIP_COST_CHART}
                  xKey="komponen"
                  series={TRIP_SERIES}
                  domain={[0, 16]}
                  ticks={[0, 4, 8, 12, 16]}
                  yAxisFormatter={(val) => `${val} Jt`}
                  tooltipFormatter={(val) => `Rp ${val.toFixed(1)} Jt`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage Trips Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Penugasan Perjalanan Dinas</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari tujuan, kegiatan, atau dosen..."
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* LoopAI Pill Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {statusTabs.map((tab) => {
                const isActive = selectedStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedStatus(tab.key)}
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
                    <th className="py-3 px-3 text-left">Pelaksana</th>
                    <th className="py-3 px-3 text-left">Tujuan &amp; Maksud Kegiatan</th>
                    <th className="py-3 px-3 text-left">Jadwal</th>
                    <th className="py-3 px-3 text-left">Estimasi &amp; Dana</th>
                    <th className="py-3 px-3 text-left">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map((row, idx) => {
                    const totalEstimasi = row.costs.reduce((s, c) => s + (c.estimasi_biaya || 0), 0);
                    const totalRealisasi = row.costs.reduce((s, c) => s + (c.realisasi_biaya || 0), 0);
                    const name = row.pengaju?.nama_lengkap || 'Dosen Prodi';
                    const initials = name
                      .replace(/Dr\.|M\.T\.|M\.Kom\.|,/g, '')
                      .trim()
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('');
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
                                className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center ${
                                  avatarColors[idx % avatarColors.length]
                                }`}
                              >
                                {initials}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                ✈
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{name}</p>
                              <p className="text-xs text-slate-400">
                                {row.sumber_dana.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <Link
                            href={`/dashboard/perjalanan-dinas/${row.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1 transition-colors"
                          >
                            {row.tujuan}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {row.maksud_kegiatan}
                          </p>
                          {row.nomor_surat_tugas && (
                            <span className="inline-block mt-1 text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              ST: {row.nomor_surat_tugas}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-xs sm:text-sm text-slate-600 font-medium whitespace-nowrap">
                          {formatDateShort(row.tanggal_berangkat)} – {formatDateShort(row.tanggal_kembali)}
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-extrabold text-slate-900 text-sm">
                            {formatRupiah(totalEstimasi)}
                          </p>
                          {totalRealisasi > 0 && (
                            <p className="text-xs text-emerald-600 font-semibold">
                              Riil: {formatRupiah(totalRealisasi)}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <StatusBadge status={row.status} size="sm" />
                            {row.status === 'DISETUJUI' && (
                              <Link
                                href={`/dashboard/perjalanan-dinas/${row.id}/laporan`}
                                className="text-xs font-bold text-indigo-600 hover:underline block"
                              >
                                + Unggah SPJ
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/dashboard/perjalanan-dinas/${row.id}`}
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
              <h3 className="text-lg font-bold text-slate-900">Tindak Lanjut Dinas</h3>
              <Link
                href="/dashboard/perjalanan-dinas/persetujuan"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="space-y-2">
              {trips.slice(0, 4).map((t, idx) => (
                <Link
                  key={t.id}
                  href={
                    t.status === 'DIAJUKAN'
                      ? '/dashboard/perjalanan-dinas/persetujuan'
                      : `/dashboard/perjalanan-dinas/${t.id}`
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
                        {t.tujuan}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                    <span>{formatDateShort(t.tanggal_berangkat)}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-600 font-semibold">{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 pl-6 line-clamp-1">
                    {t.maksud_kegiatan}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Administrasi Tugas Luar &amp; SPJ 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali Dinas
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Integrasi RKA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Surat Tugas
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-33 s/d FR-36
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/perjalanan-dinas/baru"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Ajukan Dinas Baru
                </p>
              </Link>

              <Link
                href="/dashboard/perjalanan-dinas/persetujuan"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Persetujuan Kaprodi
                </p>
              </Link>

              <Link
                href={`/dashboard/perjalanan-dinas/${trips[0]?.id || 'trip-1'}/laporan`}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Unggah Laporan
                </p>
              </Link>

              <Link
                href="/dashboard/perjalanan-dinas/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Rekapitulasi SPJ
                </p>
              </Link>
            </div>

            <Link
              href="/dashboard/perjalanan-dinas/baru"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Buat permohonan perjalanan dinas...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

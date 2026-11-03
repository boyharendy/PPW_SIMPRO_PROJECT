'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockRpsSubmissions, mockCourses } from '@/lib/mock-data';
import { rpsService } from '@/lib/api/services/rps.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RpsSubmission } from '@/lib/types';
import {
  Plus,
  BookCheck,
  Eye,
  Search,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Calendar,
  ClipboardCheck,
  FileCheck,
  BarChart3,
} from 'lucide-react';

const RPS_COMPLIANCE_CHART = [
  { komponen: 'CPL & CPMK', Memenuhi: 18, Revisi: 1 },
  { komponen: 'Bahan Kajian', Memenuhi: 19, Revisi: 0 },
  { komponen: 'Metode OBE', Memenuhi: 17, Revisi: 2 },
  { komponen: 'Rubrik Nilai', Memenuhi: 16, Revisi: 3 },
  { komponen: 'Pustaka Utama', Memenuhi: 18, Revisi: 1 },
];

const RPS_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Memenuhi', fill: '#6EE7B7', name: 'Memenuhi Standar SPMI' },
  { dataKey: 'Revisi', fill: '#818CF8', name: 'Perlu Penyempurnaan' },
];

export default function RpsListPage() {
  const [submissions, setSubmissions] = useState<RpsSubmission[]>(mockRpsSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const local = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
    if (local && local.length > 0) {
      setSubmissions(local);
    }

    let active = true;
    rpsService
      .getSubmissions()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setSubmissions(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = submissions.filter((s) => {
    const matchSearch =
      (s.course?.nama_mk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.course?.kode_mk || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const disahkanCount = submissions.filter((s) => s.status === 'DISAHKAN').length;
  const reviewCount = submissions.filter(
    (s) => s.status === 'DIAJUKAN' || s.status === 'DIREVIEW'
  ).length;
  const revisiCount = submissions.filter((s) => s.status === 'PERLU_REVISI').length;
  const compliancePct =
    submissions.length > 0 ? Math.round((disahkanCount / submissions.length) * 100) : 92;

  const statusTabs = [
    { key: 'ALL', label: 'Semua MK', count: submissions.length },
    { key: 'DISAHKAN', label: 'Disahkan', count: disahkanCount },
    { key: 'DIREVIEW', label: 'Direview', count: submissions.filter((s) => s.status === 'DIREVIEW').length },
    { key: 'DIAJUKAN', label: 'Diajukan', count: submissions.filter((s) => s.status === 'DIAJUKAN').length },
    { key: 'PERLU_REVISI', label: 'Perlu Revisi', count: revisiCount },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengajuan & Telaah Mutu Dokumen RPS"
        description="Siklus penjaminan mutu pembelajaran (SPMI): pengajuan RPS berversi, telaah sejawat (peer review) 5 komponen, dan pengesahan Kaprodi."
        action={
          <Link
            href="/dashboard/rps/ajukan"
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Ajukan RPS Baru</span>
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
              title="RPS Disahkan"
              value={`${disahkanCount} / ${submissions.length} MK`}
              badgeText={`${compliancePct}% Sah`}
              badgeTone="emerald"
              subtitle={`Dari ${mockCourses.length} mata kuliah kurikulum`}
            />
            <StatCard
              title="Dalam Telaah"
              value={`${reviewCount} Dokumen`}
              badgeText="Peer Review"
              badgeTone="indigo"
              subtitle="Evaluasi 5 komponen mutu"
            />
            <StatCard
              title="Perlu Revisi"
              value={`${revisiCount} Dokumen`}
              badgeText={revisiCount > 0 ? 'Tindak Lanjut' : 'Nihil'}
              badgeTone={revisiCount > 0 ? 'amber' : 'emerald'}
              subtitle="Perbaikan rubrik & referensi"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Kepatuhan 5 Komponen RPS</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Evaluasi pemenuhan daftar periksa mutu GKM per komponen instrumen RPS
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Semester Ganjil 2024/2025
                </span>
                <Link
                  href="/dashboard/rps/rekap"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Rekap Kepatuhan →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Memenuhi Standar</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Catatan Penyempurnaan</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Standar Mutu OBE</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Setiap dokumen RPS ditelaah pada aspek <strong>CPL/CPMK, Bahan Kajian, Metode Pembelajaran, Bobot Penilaian,</strong> dan <strong>Kemutakhiran Pustaka</strong>.
                  </p>
                </div>

                <Link
                  href="/dashboard/rps/review-saya"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Telaah RPS Ditugaskan</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={RPS_COMPLIANCE_CHART}
                  xKey="komponen"
                  series={RPS_SERIES}
                  domain={[0, 20]}
                  ticks={[0, 5, 10, 15, 20]}
                  tooltipFormatter={(val) => `${val} Mata Kuliah`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage RPS Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Dokumen RPS Mata Kuliah</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kode atau nama mata kuliah..."
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
                    <th className="py-3 px-3 text-left">Mata Kuliah &amp; Kode</th>
                    <th className="py-3 px-3 text-left">Dosen Pengampu</th>
                    <th className="py-3 px-3 text-left">Versi</th>
                    <th className="py-3 px-3 text-left">Status Mutu</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map((row, idx) => {
                    const code = row.course?.kode_mk || 'SI201';
                    const avatarColors = [
                      'bg-indigo-100 text-indigo-700',
                      'bg-emerald-100 text-emerald-700',
                      'bg-sky-100 text-sky-700',
                      'bg-amber-100 text-amber-700',
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
                                {code.slice(0, 4)}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                {row.course?.sks || 3}
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/rps/${row.id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1 transition-colors"
                              >
                                {row.course?.nama_mk}
                              </Link>
                              <p className="text-xs text-slate-400 mt-0.5">
                                <span className="font-mono font-bold text-indigo-700">{code}</span> &bull; Bobot {row.course?.sks || 3} SKS
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-semibold text-slate-800 text-sm">
                            {row.dosen_pengampu?.nama_lengkap || 'Tim Pengampu MK'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Semester {row.academic_period?.semester || 'GANJIL'}
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                            Versi {row.versi_terbaru}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <StatusBadge status={row.status} size="sm" />
                            {row.status === 'DISAHKAN' && (
                              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle size={11} /> Sah Berlaku
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/dashboard/rps/${row.id}`}
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
              <h3 className="text-lg font-bold text-slate-900">Antrean Telaah RPS</h3>
              <Link
                href="/dashboard/rps/review-saya"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="space-y-2">
              {submissions.slice(0, 4).map((rps, idx) => (
                <Link
                  key={rps.id}
                  href={`/dashboard/rps/${rps.id}`}
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
                        {rps.course?.nama_mk}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                    <span>{rps.course?.kode_mk}</span>
                    <span>&bull;</span>
                    <span>Versi {rps.versi_terbaru}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-600 font-semibold">{rps.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">
                    Pengampu: {rps.dosen_pengampu?.nama_lengkap || 'Dosen Prodi'}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Siklus Penjaminan Mutu Kurikulum 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali RPS
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                5 Checklist GKM
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Multi-Versi
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-41 s/d FR-44
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/rps/ajukan"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Ajukan RPS Baru
                </p>
              </Link>

              <Link
                href="/dashboard/rps/review-saya"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Tugas Review Saya
                </p>
              </Link>

              <Link
                href="/dashboard/rps/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Rekap Kepatuhan
                </p>
              </Link>

              <Link
                href={`/dashboard/rps/${submissions[0]?.id || 'rps-1'}`}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Riwayat Versi
                </p>
              </Link>
            </div>

            <Link
              href="/dashboard/rps/ajukan"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Unggah draf dokumen RPS semester...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

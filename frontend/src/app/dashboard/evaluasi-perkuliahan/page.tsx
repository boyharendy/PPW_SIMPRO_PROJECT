'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockCourseEvaluations } from '@/lib/mock-data';
import { evaluationService } from '@/lib/api/services/evaluation.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { CourseEvaluation } from '@/lib/types';
import {
  GraduationCap,
  Eye,
  FileEdit,
  CheckCircle2,
  Search,
  Sparkles,
  ChevronRight,
  Calendar,
  BarChart3,
  Star,
} from 'lucide-react';

const CPMK_CHART_DATA = [
  { cpmk: 'CPMK-01', Capaian: 88, Target: 75 },
  { cpmk: 'CPMK-02', Capaian: 84, Target: 75 },
  { cpmk: 'CPMK-03', Capaian: 79, Target: 75 },
  { cpmk: 'CPMK-04', Capaian: 91, Target: 75 },
];

const CPMK_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Capaian', fill: '#6EE7B7', name: 'Rata-rata Ketercapaian (%)' },
  { dataKey: 'Target', fill: '#818CF8', name: 'Ambang Batas Lulus (%)' },
];

export default function EvaluasiPerkuliahanListPage() {
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>(mockCourseEvaluations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('period-2024-genap');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const local = storageSync.get<CourseEvaluation[]>(
      STORAGE_KEYS.EVALUATIONS,
      mockCourseEvaluations
    );
    if (local && local.length > 0) {
      setEvaluations(local);
    }

    let active = true;
    evaluationService
      .getEvaluations()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setEvaluations(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = evaluations.filter((ev) => {
    const matchSearch =
      (ev.course_class?.course?.nama_mk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.course_class?.kode_kelas || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || ev.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const avgFeedback =
    evaluations.length > 0
      ? (
          evaluations.reduce((s, e) => s + (e.feedback_summary?.skor_rata_rata || 4.5), 0) /
          evaluations.length
        ).toFixed(2)
      : '4.58';

  const totalCpmk = evaluations.reduce((s, e) => s + e.cpmk_list.length, 0);
  const achievedCpmk = evaluations.reduce(
    (s, e) => s + e.cpmk_list.filter((c) => c.tercapai).length,
    0
  );
  const cpmkPct = totalCpmk > 0 ? Math.round((achievedCpmk / totalCpmk) * 100) : 86;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Post Evaluasi Perkuliahan Akhir Semester"
        description="Pengisian ketercapaian CPMK berbasis OBE, evaluasi kesesuaian RPS, analisis distribusi nilai, dan umpan balik mahasiswa per kelas."
        action={
          <div className="flex items-center gap-2.5">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="select-field text-xs sm:text-sm py-2 w-52"
            >
              <option value="period-2024-genap">2024/2025 Semester Genap</option>
              <option value="period-2025-ganjil">2025/2026 Semester Ganjil</option>
            </select>
          </div>
        }
      />

      {/* Main LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Ketercapaian CPMK"
              value={`${cpmkPct}%`}
              badgeText={`${achievedCpmk}/${totalCpmk} CPMK`}
              badgeTone="emerald"
              subtitle="Melampaui ambang batas OBE"
            />
            <StatCard
              title="Indeks EDOM Kelas"
              value={`${avgFeedback} / 5.0`}
              badgeText="Sangat Baik"
              badgeTone="emerald"
              subtitle="Umpan balik mahasiswa"
            />
            <StatCard
              title="Kelas Dievaluasi"
              value={`${evaluations.length} Kelas`}
              badgeText="100% Aktif"
              badgeTone="indigo"
              subtitle="Portofolio mata kuliah prodi"
            />
          </div>

          {/* 2. Middle Analytics Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Ketercapaian CPMK &amp; OBE</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Perbandingan rata-rata ketercapaian Capaian Pembelajaran Mata Kuliah terhadap ambang batas kelulusan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Evaluasi Akhir Semester
                </span>
                <Link
                  href="/dashboard/evaluasi-perkuliahan/rekap"
                  className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Rekap Mutu →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Capaian Aktual Kelas</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Batas Minimal (75%)</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Rekomendasi Perbaikan</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    CPMK-03 pada studi kasus proyek membutuhkan penambahan sesi asistensi praktikum di paruh kedua semester.
                  </p>
                </div>

                <Link
                  href="/dashboard/evaluasi-perkuliahan/rekap"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Buka Rekapitulasi CPMK</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={CPMK_CHART_DATA}
                  xKey="cpmk"
                  series={CPMK_SERIES}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  yAxisFormatter={(val) => `${val}%`}
                  tooltipFormatter={(val) => `${val}%`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage Evaluations Card */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Evaluasi Kelas Perkuliahan</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari mata kuliah atau kelas..."
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
                <span>Semua Kelas</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {evaluations.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('TERKIRIM')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  statusFilter === 'TERKIRIM'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Telah Disubmit</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'TERKIRIM' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {evaluations.filter((e) => e.status === 'TERKIRIM' || e.status === 'DITINJAU').length}
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
                <span>Draf Pengisian</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    statusFilter === 'DRAF' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {evaluations.filter((e) => e.status === 'DRAF').length}
                </span>
              </button>
            </div>

            {/* LoopAI Avatar Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs sm:text-sm font-medium text-slate-400">
                    <th className="py-3 px-3 text-left">Mata Kuliah &amp; Kelas</th>
                    <th className="py-3 px-3 text-left">Ketercapaian CPMK</th>
                    <th className="py-3 px-3 text-left">EDOM Mahasiswa</th>
                    <th className="py-3 px-3 text-left">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filtered.map((row, idx) => {
                    const total = row.cpmk_list.length;
                    const tercapai = row.cpmk_list.filter((c) => c.tercapai).length;
                    const pct = Math.round((tercapai / total) * 100);
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
                                {row.course_class?.kode_kelas || 'A'}
                              </div>
                              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                ✓
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/evaluasi-perkuliahan/${row.course_class_id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 text-sm line-clamp-1 transition-colors"
                              >
                                {row.course_class?.course?.nama_mk}
                              </Link>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Kelas <strong className="text-indigo-700">{row.course_class?.kode_kelas}</strong> &bull; {row.course_class?.jumlah_mahasiswa} Mahasiswa
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {tercapai}/{total} CPMK ({pct}%)
                            </span>
                            <div className="h-2 w-28 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 80
                                    ? 'bg-emerald-500'
                                    : pct >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 font-extrabold text-indigo-700 text-sm">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {row.feedback_summary?.skor_rata_rata.toFixed(2)} / 5.0
                          </span>
                          <p className="text-xs text-slate-400">
                            {row.feedback_summary?.jumlah_responden} Responden
                          </p>
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={row.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            href={`/dashboard/evaluasi-perkuliahan/${row.course_class_id}`}
                            className="btn-secondary text-xs sm:text-sm py-1.5 px-3.5 inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            <span>Buka Evaluasi</span>
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
              <h3 className="text-lg font-bold text-slate-900">Portofolio Kelas</h3>
              <Link
                href="/dashboard/evaluasi-perkuliahan/rekap"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat rekap
              </Link>
            </div>

            <div className="space-y-2">
              {evaluations.map((ev, idx) => {
                const total = ev.cpmk_list.length;
                const tercapai = ev.cpmk_list.filter((c) => c.tercapai).length;
                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/evaluasi-perkuliahan/${ev.course_class_id}`}
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
                          {ev.course_class?.course?.nama_mk} ({ev.course_class?.kode_kelas})
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
                      <span>{tercapai}/{total} CPMK tercapai</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-semibold">
                        EDOM {ev.feedback_summary?.skor_rata_rata.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">
                      {ev.penjelasan_kesesuaian || ev.kendala || 'Evaluasi kesesuaian materi RPS & asesmen kelas.'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Evaluasi Berbasis Outcome (OBE) 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Evaluasi Kuliah
              </h3>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Matriks CPMK
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Sebaran Nilai
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-45 s/d FR-48
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href={`/dashboard/evaluasi-perkuliahan/${evaluations[0]?.course_class_id || 'cls-1'}`}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Isi Evaluasi Kelas
                </p>
              </Link>

              <Link
                href="/dashboard/evaluasi-perkuliahan/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Rekapitulasi Mutu
                </p>
              </Link>

              <Link
                href="/dashboard/rps"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Cek Acuan RPS
                </p>
              </Link>

              <Link
                href="/dashboard/pengaturan/mutu"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Parameter Mutu
                </p>
              </Link>
            </div>

            <Link
              href={`/dashboard/evaluasi-perkuliahan/${evaluations[0]?.course_class_id || 'cls-1'}`}
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Input refleksi &amp; tindak lanjut kelas...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

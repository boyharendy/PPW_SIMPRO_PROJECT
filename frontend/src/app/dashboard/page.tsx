'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from '@/components/layout/RoleLink';
import { animate, createScope, remove, stagger, type Scope } from 'animejs';
import {
  Building2,
  BookOpen,
  Plane,
  Coins,
  BookCheck,
  MessageSquareHeart,
  PlusCircle,
  FileText,
  ExternalLink,
  Calendar,
  Award,
  Compass,
  FileBadge,
  Users,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BellOff,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import {
  mockDashboardStats,
  mockNotifications,
  mockComplaints,
  mockBusinessTrips,
  mockPublications,
  mockRpsSubmissions,
} from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { BusinessTrip, Publication, RpsSubmission, Complaint, Notification } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import DashboardChartsSection from '@/components/dashboard/DashboardChartsSection';

export default function DashboardPage() {
  const { user, currentRole } = useUser();
  const stats = mockDashboardStats;

  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [rpsList, setRpsList] = useState<RpsSubmission[]>(mockRpsSubmissions);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // 3 State Antarmuka Standar: Skeleton Loader (isLoading), Error State (loadError), & Empty State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState<number>(0);

  // Refs untuk Anime.js Scope & Count-Up KPI Tabular Figures
  const dashboardRootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const kpiMitraRef = useRef<HTMLSpanElement>(null);
  const kpiPublikasiRef = useRef<HTMLSpanElement>(null);
  const kpiDinasRef = useRef<HTMLSpanElement>(null);
  const kpiRkaRef = useRef<HTMLSpanElement>(null);
  const kpiRpsRef = useRef<HTMLSpanElement>(null);
  const kpiAduanRef = useRef<HTMLSpanElement>(null);

  const loadDashboardData = useCallback((withSkeleton = false) => {
    if (withSkeleton) {
      setIsLoading(true);
    }
    setLoadError(null);

    const timer = setTimeout(() => {
      try {
        setTrips(storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips));
        setPublications(storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications));
        setRpsList(storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions));
        setComplaints(storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints));
        setNotifications(mockNotifications);
        setIsLoading(false);
        setAnimationTrigger((prev) => prev + 1);
      } catch (err) {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat sinkronisasi data operasional dashboard.'
        );
        setIsLoading(false);
      }
    }, withSkeleton ? 320 : 180);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = loadDashboardData(false);
    return cleanup;
  }, [loadDashboardData]);

  // Urgent pending items
  const pendingTrips = trips.filter((t) => t.status === 'DIAJUKAN');
  const pendingPublications = publications.filter((p) => p.status_verifikasi === 'MENUNGGU');
  const pendingRps = rpsList.filter(
    (r) => r.status === 'DIAJUKAN' || r.status === 'DIREVIEW'
  );
  const activeComplaints = complaints.filter(
    (c) => c.status === 'DITERIMA' || c.status === 'DITINDAKLANJUTI'
  );

  // Perhitungan dinamis item tugas prioritas yang ditampilkan & total antrean
  const visiblePriorityTasksCount =
    currentRole === 'MAHASISWA'
      ? 0
      : pendingTrips.slice(0, 1).length +
        pendingPublications.slice(0, 1).length +
        pendingRps.slice(0, 1).length +
        activeComplaints.slice(0, 1).length;

  const totalPendingQueueCount =
    currentRole === 'MAHASISWA'
      ? 0
      : pendingTrips.length +
        pendingPublications.length +
        pendingRps.length +
        activeComplaints.length;

  // Orkestrasi Animasi Anime.js: Staggered Reveal, Count-Up KPI (tabular-nums), & Progress Sparkline
  useEffect(() => {
    if (isLoading || loadError || !dashboardRootRef.current) return;

    scopeRef.current = createScope({ root: dashboardRootRef }).add(() => {
      // 1. Staggered Entrance pada Kartu KPI (Zona Atas)
      remove('.anime-kpi-card');
      animate('.anime-kpi-card', {
        opacity: [0, 1],
        translateY: [14, 0],
        delay: stagger(55, { start: 40 }),
        duration: 480,
        ease: 'outCubic',
      });

      // 2. Mini Progress Bar / Sparkline di bawah masing-masing Kartu KPI
      remove('.anime-kpi-sparkbar');
      const sparkBars = dashboardRootRef.current?.querySelectorAll('.anime-kpi-sparkbar');
      sparkBars?.forEach((bar, idx) => {
        const targetW = (bar as HTMLElement).dataset.targetWidth || '0%';
        animate(bar, {
          width: ['0%', targetW],
          duration: 850,
          delay: 140 + idx * 60,
          ease: 'outExpo',
        });
      });

      // 3. Staggered Entrance pada Kolom Operasional (Zona Bawah) & Item Tugas
      remove('.anime-bottom-card');
      animate('.anime-bottom-card', {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(75, { start: 180 }),
        duration: 520,
        ease: 'outCubic',
      });

      remove('.anime-task-item');
      animate('.anime-task-item', {
        opacity: [0, 1],
        translateX: [-8, 0],
        delay: stagger(50, { start: 260 }),
        duration: 380,
        ease: 'outCubic',
      });
    });

    // 4. Animasi Count-Up Angka Utama KPI dengan Tabular Figures (tabular-nums)
    const animateCounter = (
      el: HTMLSpanElement | null,
      target: number,
      decimals = 0,
      suffix = ''
    ) => {
      if (!el) return;
      const state = { val: 0 };
      animate(state, {
        val: target,
        duration: 900,
        ease: 'outExpo',
        onUpdate: () => {
          el.textContent = `${state.val.toFixed(decimals)}${suffix}`;
        },
      });
    };

    animateCounter(kpiMitraRef.current, stats.indeksKepuasanMitra, 2);
    animateCounter(kpiPublikasiRef.current, stats.totalPublikasiTahunIni, 0);
    animateCounter(kpiDinasRef.current, stats.perjalananDinasAktif, 0);
    animateCounter(kpiRkaRef.current, stats.serapanRkaPersen, 0, '%');
    animateCounter(kpiRpsRef.current, stats.rpsTuntasPersen, 0, '%');
    animateCounter(kpiAduanRef.current, stats.aduanTerbuka, 0);

    return () => {
      scopeRef.current?.revert();
    };
  }, [isLoading, loadError, animationTrigger, currentRole, stats]);

  // Micro-interaction Hover Kartu KPI dengan Anime.js
  const handleCardMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      translateY: -3,
      duration: 220,
      ease: 'outQuad',
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      translateY: 0,
      duration: 260,
      ease: 'outQuad',
    });
  };

  return (
    <div ref={dashboardRootRef} className="space-y-4 min-w-0">
      {/* HEADER KONTEKS & AKSI CEPAT (Sistem Grid 8pt: p-4 / gap-4) */}
      <div className="rounded-[20px] border border-slate-200/85 bg-white p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/80">
                <Calendar className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                Semester Ganjil 2024/2025
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                Peran: {currentRole.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug lg:truncate">
              Selamat Datang, {user?.name || 'Civitas Akademika'}!
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed line-clamp-2 sm:line-clamp-1">
              Sistem Informasi Manajemen Program Studi (SIMPRO) mengintegrasikan layanan kemahasiswaan serta tata kelola, mutu &amp; akreditasi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto shrink-0">
            {currentRole === 'MAHASISWA' ? (
              <>
                <Link
                  href="/dashboard/aduan"
                  className="btn-primary text-sm py-2 px-4 w-full sm:w-auto"
                >
                  <MessageSquareHeart className="h-4 w-4 shrink-0" />
                  Kirim Aduan
                </Link>
                <Link
                  href="/aduan/lacak"
                  target="_blank"
                  className="btn-secondary text-sm py-2 px-3.5 w-full sm:w-auto"
                >
                  Lacak Tiket
                  <ExternalLink className="h-4 w-4 text-slate-500 shrink-0" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/publikasi/baru"
                  className="btn-primary text-sm py-2 px-4 col-span-2 sm:col-span-1 w-full sm:w-auto"
                >
                  <PlusCircle className="h-4 w-4 shrink-0" />
                  Publikasi Baru
                </Link>
                <Link
                  href="/dashboard/perjalanan-dinas/baru"
                  className="btn-secondary text-sm py-2 px-3.5 w-full sm:w-auto"
                >
                  <Plane className="h-4 w-4 text-indigo-600 shrink-0" />
                  Ajukan Dinas
                </Link>
                <Link
                  href="/dashboard/rps/ajukan"
                  className="btn-secondary text-sm py-2 px-3.5 w-full sm:w-auto"
                >
                  <BookCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Ajukan RPS
                </Link>
              </>
            )}

            {/* Tombol Segarkan Data untuk memicu sinkronisasi & animasi Anime.js */}
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={isLoading}
              title="Segarkan Data & Animasi Dashboard"
              aria-label="Segarkan Data Dashboard"
              className="btn-secondary text-xs py-2 px-3 col-span-2 sm:col-span-1 w-full sm:w-auto text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sm:hidden lg:inline">Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATE 1: ERROR STATE (Pemulihan Masalah dengan Tombol Muat Ulang) */}
      {loadError && (
        <div
          role="alert"
          className="rounded-[20px] border border-rose-200 bg-rose-50/70 p-6 text-center space-y-3 shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              Gagal Memuat Data Dashboard Utama
            </h2>
            <p className="text-xs font-medium text-slate-600">
              {loadError} Periksa penyimpanan lokal browser atau klik tombol di bawah untuk memulihkan sesi data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            className="btn-primary text-xs py-2 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang Data
          </button>
        </div>
      )}

      {/* STATE 2: SKELETON LOADER (Grid 8pt: gap-4 / 16px) */}
      {isLoading && !loadError && (
        <div aria-busy="true" aria-label="Memuat data dashboard" className="space-y-4">
          {/* Skeleton Zona Atas: 6 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-[20px] border border-slate-200/80 bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-32 rounded-md skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-full skeleton-shimmer" />
                </div>
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
                  <div className="h-3.5 w-28 rounded-md skeleton-shimmer" />
                </div>
                <div className="h-1.5 w-full rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>

          {/* Skeleton Zona Tengah: 2 Grafik Utama */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 rounded-[20px] border border-slate-200/80 bg-white p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-56 rounded-md skeleton-shimmer" />
                <div className="h-7 w-40 rounded-full skeleton-shimmer" />
              </div>
              <div className="h-48 w-full rounded-2xl skeleton-shimmer" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 rounded-[20px] border border-slate-200/80 bg-white p-5 space-y-4">
              <div className="h-5 w-48 rounded-md skeleton-shimmer" />
              <div className="h-36 w-full rounded-2xl skeleton-shimmer" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: TAMPILAN DATA PENUH (3 ZONA HIERARKI INFORMASI) */}
      {!isLoading && !loadError && (
        <>
          {/* ============================================================
              1. ZONA ATAS — Ringkasan KPI Cards (Spasi 8pt: gap-4 / 16px)
              Standar: Angka 30px bold (text-3xl), tabular-nums, warna angka
              seragam text-slate-900, warna sinyal hanya di badge, kontras
              sub-teks text-slate-500 (WCAG 2.2 AA >= 4.76:1).
             ============================================================ */}
          <section
            aria-label="Zona Atas: Ringkasan Indikator Kinerja Utama"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Metric 1: Kepuasan Mitra */}
            <Link
              href="/dashboard/kepuasan-mitra"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  Kepuasan Mitra
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  +0.16 vs sem. lalu
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiMitraRef}>{stats.indeksKepuasanMitra.toFixed(2)}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1">/ 5.0</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0">
                  Sangat Puas (KP &amp; PSI)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-emerald-500 rounded-full"
                  data-target-width={`${Math.round((stats.indeksKepuasanMitra / 5) * 100)}%`}
                  style={{ width: `${Math.round((stats.indeksKepuasanMitra / 5) * 100)}%` }}
                />
              </div>
            </Link>

            {/* Metric 2: Publikasi */}
            <Link
              href="/dashboard/publikasi"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  Publikasi 2025
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  {pendingPublications.length} Menunggu
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiPublikasiRef}>{stats.totalPublikasiTahunIni}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">Karya</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0 tabular-nums">
                  +33% vs 18 (thn lalu)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-indigo-600 rounded-full"
                  data-target-width="86%"
                  style={{ width: '86%' }}
                />
              </div>
            </Link>

            {/* Metric 3: Perjalanan Dinas */}
            <Link
              href="/dashboard/perjalanan-dinas"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  Perjalanan Dinas
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  {pendingTrips.length} Pengajuan Baru
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiDinasRef}>{stats.perjalananDinasAktif}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">Tugas</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0 tabular-nums">
                  6/8 SPJ Selesai (75%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-sky-600 rounded-full"
                  data-target-width="75%"
                  style={{ width: '75%' }}
                />
              </div>
            </Link>

            {/* Metric 4: Serapan RKA (Angka Utama Diseragamkan ke text-slate-900) */}
            <Link
              href="/dashboard/rka/2025/serapan"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  Serapan Anggaran RKA
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  +15% vs TW II
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiRkaRef}>{stats.serapanRkaPersen}%</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">Terserap</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0">
                  Target TW III On-Track
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-emerald-500 rounded-full"
                  data-target-width={`${stats.serapanRkaPersen}%`}
                  style={{ width: `${stats.serapanRkaPersen}%` }}
                />
              </div>
            </Link>

            {/* Metric 5: RPS Tuntas (Angka Utama Diseragamkan ke text-slate-900) */}
            <Link
              href="/dashboard/rps/rekap"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  RPS &amp; Kurikulum
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                  Standar SPMI
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiRpsRef}>{stats.rpsTuntasPersen}%</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">Disahkan</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0 tabular-nums">
                  18/19 MK (+5% vs sem. lalu)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-indigo-600 rounded-full"
                  data-target-width={`${stats.rpsTuntasPersen}%`}
                  style={{ width: `${stats.rpsTuntasPersen}%` }}
                />
              </div>
            </Link>

            {/* Metric 6: Aduan Terbuka */}
            <Link
              href="/dashboard/kelola/aduan"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              className="anime-kpi-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm font-semibold text-slate-800 truncate text-left">
                  Aduan Mahasiswa
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  SLA ≤ 3 Hari
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap tabular-nums">
                  <span ref={kpiAduanRef}>{stats.aduanTerbuka}</span>
                  <span className="text-sm font-semibold text-slate-500 ml-1.5">Tiket Aktif</span>
                </p>
                <span className="text-xs font-medium text-slate-500 truncate text-right min-w-0 tabular-nums">
                  -1 tiket vs bulan lalu
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="anime-kpi-sparkbar h-full bg-rose-500 rounded-full"
                  data-target-width="66%"
                  style={{ width: '66%' }}
                />
              </div>
            </Link>
          </section>

          {/* ============================================================
              2. ZONA TENGAH — Tren & Visualisasi Utama (Anime.js SVG Charts)
             ============================================================ */}
          <DashboardChartsSection
            serapanRkaPersen={stats.serapanRkaPersen}
            rpsTuntasPersen={stats.rpsTuntasPersen}
            evaluasiTerkirimPersen={stats.evaluasiTerkirimPersen}
            totalPublikasiTahunIni={stats.totalPublikasiTahunIni}
            indeksKepuasanMitra={stats.indeksKepuasanMitra}
            animationTrigger={animationTrigger}
          />

          {/* ============================================================
              3. ZONA BAWAH — Data Granular & Tindak Lanjut (Spasi 8pt: gap-4)
             ============================================================ */}
          <section
            aria-label="Zona Bawah: Antrean Tindak Lanjut, Notifikasi, dan Direktori Modul"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch"
          >
            {/* Kolom 1: Tugas Prioritas (Badge Dinamis + Empty State untuk Semua Peran) */}
            <div className="anime-bottom-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Tugas Prioritas
                  </h3>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200 tabular-nums">
                    {totalPendingQueueCount} Menunggu
                  </span>
                </div>

                {currentRole === 'MAHASISWA' || visiblePriorityTasksCount === 0 ? (
                  /* EMPTY STATE DINAMIS: Berlaku untuk Mahasiswa maupun Kaprodi/Dosen saat antrean 0 */
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center my-2 space-y-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {currentRole === 'MAHASISWA'
                        ? 'Tidak Ada Tugas Verifikasi'
                        : 'Seluruh Antrean Tuntas!'}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {currentRole === 'MAHASISWA'
                        ? 'Peran Mahasiswa tidak memiliki antrean persetujuan dokumen.'
                        : 'Tidak ada pengajuan dinas, publikasi, RPS, atau aduan yang menunggu tindak lanjut.'}
                    </p>
                    <Link
                      href={currentRole === 'MAHASISWA' ? '/dashboard/aduan' : '/dashboard/publikasi'}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      {currentRole === 'MAHASISWA'
                        ? 'Ajukan Aduan atau Pertanyaan →'
                        : 'Lihat Rekapitulasi Publikasi →'}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Trip Approval */}
                    {pendingTrips.slice(0, 1).map((trip) => (
                      <Link
                        key={trip.id}
                        href="/dashboard/perjalanan-dinas/persetujuan"
                        className="anime-task-item block rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-3 transition-all hover:border-indigo-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent inline-block shrink-0" />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              Persetujuan Dinas &bull; {trip.tujuan}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        </div>
                        <p className="text-xs font-medium text-slate-600 truncate pl-6 mt-0.5">
                          {trip.maksud_kegiatan} ({formatDate(trip.tanggal_berangkat)})
                        </p>
                      </Link>
                    ))}

                    {/* Publication Verification */}
                    {pendingPublications.slice(0, 1).map((pub) => (
                      <Link
                        key={pub.id}
                        href="/dashboard/publikasi/verifikasi"
                        className="anime-task-item block rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent inline-block shrink-0" />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              Verifikasi Publikasi Mahasiswa
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 truncate pl-6 mt-0.5">
                          {pub.judul}
                        </p>
                      </Link>
                    ))}

                    {/* RPS Review */}
                    {pendingRps.slice(0, 1).map((rps) => (
                      <Link
                        key={rps.id}
                        href="/dashboard/rps/review-saya"
                        className="anime-task-item block rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent inline-block shrink-0" />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              Review RPS: {rps.course?.nama_mk || 'Mata Kuliah'}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 truncate pl-6 mt-0.5">
                          Kode {rps.course?.kode_mk || rps.course_id} &bull; Pengampu:{' '}
                          {rps.dosen_pengampu?.nama_lengkap || 'Dosen'}
                        </p>
                      </Link>
                    ))}

                    {/* Active Complaints */}
                    {activeComplaints.slice(0, 1).map((comp) => (
                      <Link
                        key={comp.id}
                        href={`/dashboard/kelola/aduan/${comp.id}`}
                        className="anime-task-item block rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full border-2 border-rose-600 border-t-transparent inline-block shrink-0" />
                            <span className="font-bold text-slate-900 text-sm truncate">
                              Aduan: {comp.nomor_aduan}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 truncate pl-6 mt-0.5">
                          {comp.judul}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kolom 2: Notifikasi Sistem & Portal Publik */}
            <div className="anime-bottom-card min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Notifikasi &amp; Pembaruan
                  </h3>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200 tabular-nums">
                    {notifications.length} Aktivitas
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center my-2 space-y-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto">
                      <BellOff className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Belum Ada Notifikasi Baru
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Pembaruan status dokumen dan aktivitas prodi akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif, idx) => (
                      <Link
                        key={notif.id}
                        href={`/dashboard${notif.tautan}`}
                        className={`anime-task-item block rounded-2xl p-3 text-xs sm:text-sm transition-all ${
                          idx === 0
                            ? 'bg-indigo-50/50 border border-indigo-100/80 hover:border-indigo-300'
                            : 'border border-slate-200/70 bg-slate-50/60 hover:bg-indigo-50/30 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="font-bold text-slate-900 text-sm truncate min-w-0 flex-1">
                            {notif.judul}
                          </span>
                          <span className="text-xs font-medium text-slate-500 shrink-0">
                            Baru saja
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-600 text-xs font-medium line-clamp-1">
                          {notif.isi}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Bagian Bawah: Portal Publik */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">Portal Publik Terintegrasi</span>
                  <span className="text-xs text-indigo-600 font-semibold shrink-0 whitespace-nowrap">
                    Tanpa Login
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    href="/mitra/isi/tok-telkom-2025"
                    target="_blank"
                    className="min-w-0 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:text-sm hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 text-sm truncate">Kuesioner Mitra</p>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        PT Telkom Indonesia
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500 shrink-0" />
                  </Link>

                  <Link
                    href="/aduan/lacak"
                    target="_blank"
                    className="min-w-0 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:text-sm hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 text-sm truncate">Lacak Tiket Aduan</p>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        Status Anonim &amp; Utas
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500 shrink-0" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Kolom 3: LoopAI Pastel Hub (Direktori Modul 1-6 & 7-13 — Skala Huruf & WCAG AA) */}
            <div className="anime-bottom-card min-w-0 rounded-[20px] bg-gradient-to-b from-indigo-100/60 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-4">
              {/* Sub-header Kemahasiswaan (Modul 1-6) */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-1.5 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      Kemahasiswaan
                    </h3>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100 tabular-nums">
                    Modul 1–6
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/perwalian"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Perwalian
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Laporan Kelas
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/beasiswa"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Award className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Beasiswa
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Jam Karya
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/pelanggaran"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Sanksi
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Sanksi Sosial
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/ukm"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Compass className="h-4 w-4 text-sky-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        UKM
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Kegiatan
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/himpunan/proker"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Proker
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Himpunan
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/sertifikat"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <FileBadge className="h-4 w-4 text-purple-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Sertifikat
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Mahasiswa
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Sub-header Tata Kelola & Mutu (Modul 7-13) */}
              <div className="pt-3 border-t border-indigo-100/80">
                <div className="flex items-center justify-between gap-2 pb-1.5 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      Tata Kelola &amp; Mutu
                    </h3>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100 tabular-nums">
                    Modul 7–13
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/kepuasan-mitra"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Kepuasan Mitra
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        KP, PSI, PDLK
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/publikasi/rekap"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Publikasi IKU
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Karya &amp; Sitasi
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/perjalanan-dinas/rekap"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Plane className="h-4 w-4 text-sky-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        SPJ Dinas
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Estimasi &amp; Riil
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/rka"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <Coins className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        RKA &amp; Anggaran
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Pagu &amp; Serapan
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/rps"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <BookCheck className="h-4 w-4 text-rose-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Review RPS
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Standar SPMI
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/evaluasi-perkuliahan"
                    className="min-w-0 flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        Evaluasi Kuliah
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                        Ketercapaian CPMK
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

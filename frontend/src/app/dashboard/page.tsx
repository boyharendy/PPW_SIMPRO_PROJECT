'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  BookOpen,
  Plane,
  Coins,
  BookCheck,
  MessageSquareHeart,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  ShieldCheck,
  Star,
  ExternalLink,
  Calendar,
  Award,
  Compass,
  FileBadge,
  Users,
  ShieldAlert,
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
import type { BusinessTrip, Publication, RpsSubmission, Complaint } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, currentRole } = useUser();
  const stats = mockDashboardStats;

  const [trips, setTrips] = useState<BusinessTrip[]>(() =>
    storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips)
  );
  const [publications, setPublications] = useState<Publication[]>(() =>
    storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications)
  );
  const [rpsList, setRpsList] = useState<RpsSubmission[]>(() =>
    storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions)
  );
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints)
  );

  useEffect(() => {
    setTrips(storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips));
    setPublications(storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications));
    setRpsList(storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions));
    setComplaints(storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints));
  }, []);

  // Urgent pending items
  const pendingTrips = trips.filter((t) => t.status === 'DIAJUKAN');
  const pendingPublications = publications.filter((p) => p.status_verifikasi === 'MENUNGGU');
  const pendingRps = rpsList.filter(
    (r) => r.status === 'DIAJUKAN' || r.status === 'DIREVIEW'
  );
  const activeComplaints = complaints.filter(
    (c) => c.status === 'DITERIMA' || c.status === 'DITINDAKLANJUTI'
  );

  return (
    <div className="space-y-3.5">
      {/* 1. Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Semester Ganjil 2024/2025
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs sm:text-sm font-semibold text-blue-700 border border-blue-200">
                Role: {currentRole.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 truncate">
              Selamat Datang, {user?.name || 'Civitas Akademika'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
              Sistem Informasi Manajemen Program Studi (SIMPRO) mengintegrasikan layanan kemahasiswaan serta tata kelola, mutu &amp; akreditasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentRole === 'MAHASISWA' ? (
              <>
                <Link
                  href="/dashboard/aduan"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <MessageSquareHeart className="h-4 w-4" />
                  Kirim Aduan
                </Link>
                <Link
                  href="/aduan/lacak"
                  target="_blank"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  Lacak Tiket
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/publikasi/baru"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  Publikasi Baru
                </Link>
                <Link
                  href="/dashboard/perjalanan-dinas/baru"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                >
                  <Plane className="h-4 w-4 text-blue-600" />
                  Ajukan Dinas
                </Link>
                <Link
                  href="/dashboard/rps/ajukan"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                >
                  <BookCheck className="h-4 w-4 text-emerald-600" />
                  Ajukan RPS
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI Metric Cards (2 Baris x 3 Kolom - Proporsional & Mengisi Layar Secara Penuh) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Metric 1: Kepuasan Mitra */}
        <Link
          href="/dashboard/kepuasan-mitra"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Kepuasan Mitra</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {stats.indeksKepuasanMitra}
              <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700 font-medium">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
            <span>Predikat Sangat Puas (KP &amp; PSI)</span>
          </div>
        </Link>

        {/* Metric 2: Publikasi */}
        <Link
          href="/dashboard/publikasi"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Publikasi 2025</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {stats.totalPublikasiTahunIni}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Karya Terbit</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-700 font-medium">
            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>{stats.publikasiMenungguVerifikasi} Menunggu Verifikasi</span>
          </div>
        </Link>

        {/* Metric 3: Perjalanan Dinas */}
        <Link
          href="/dashboard/perjalanan-dinas"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Perjalanan Dinas</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Plane className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {stats.perjalananDinasAktif}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Penugasan</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Tugas Aktif &amp; Verifikasi SPJ</span>
          </div>
        </Link>

        {/* Metric 4: Serapan RKA */}
        <Link
          href="/dashboard/rka/2025/serapan"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Serapan Anggaran RKA</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
              {stats.serapanRkaPersen}%
              <span className="text-sm font-normal text-slate-400 ml-1.5">Terealisasi</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Target Triwulan III On-Track</span>
          </div>
        </Link>

        {/* Metric 5: RPS Tuntas */}
        <Link
          href="/dashboard/rps/rekap"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">RPS &amp; Kurikulum</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight">
              {stats.rpsTuntasPersen}%
              <span className="text-sm font-normal text-slate-400 ml-1.5">Disahkan</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Memenuhi Standar Mutu SPMI</span>
          </div>
        </Link>

        {/* Metric 6: Aduan Terbuka */}
        <Link
          href="/dashboard/kelola/aduan"
          className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Aduan Mahasiswa</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <MessageSquareHeart className="h-4 w-4" />
            </div>
          </div>
          <div className="my-1.5">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {stats.aduanTerbuka}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Tiket Aktif</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-700 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Dalam Penanganan SLA Terkendali</span>
          </div>
        </Link>
      </div>

      {/* 3. Operational 3-Column Balanced Grid (Semua konten tampil utuh & padat tanpa harus scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
        {/* Kolom 1: Antrean Tindak Lanjut & Verifikasi */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Antrean Tindak Lanjut</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                4 Menunggu
              </span>
            </div>

            <div className="space-y-2">
              {/* Trip Approval */}
              {pendingTrips.slice(0, 1).map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm flex items-center justify-between gap-2.5 hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Persetujuan Dinas
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate mt-0.5">{trip.maksud_kegiatan}</p>
                    <p className="text-slate-500 text-xs truncate">
                      {trip.tujuan} &bull; {formatDate(trip.tanggal_berangkat)}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/perjalanan-dinas/persetujuan"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Proses
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}

              {/* Publication Verification */}
              {pendingPublications.slice(0, 1).map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm flex items-center justify-between gap-2.5 hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                      Verifikasi Publikasi
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate mt-0.5">{pub.judul}</p>
                    <p className="text-slate-500 text-xs truncate">
                      Penulis: {pub.authors[0]?.nama_penulis} &bull; {pub.nama_target}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/publikasi/verifikasi"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Verifikasi
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}

              {/* RPS Review */}
              {pendingRps.slice(0, 1).map((rps) => (
                <div
                  key={rps.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm flex items-center justify-between gap-2.5 hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Review RPS &amp; Kurikulum
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate mt-0.5">
                      {rps.course?.nama_mk || 'Mata Kuliah'} ({rps.course?.kode_mk || rps.course_id})
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      Pengampu: {rps.dosen_pengampu?.nama_lengkap || 'Dosen'} &bull; Periode: Ganjil
                    </p>
                  </div>
                  <Link
                    href="/dashboard/rps/review-saya"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}

              {/* Active Complaints */}
              {activeComplaints.slice(0, 1).map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm flex items-center justify-between gap-2.5 hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                      Aduan Mahasiswa
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate mt-0.5">{comp.judul}</p>
                    <p className="text-slate-500 font-mono text-xs truncate">
                      {comp.nomor_aduan} &bull; Masuk: {formatDate(comp.tanggal_diterima)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/kelola/aduan/${comp.id}`}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Tindak
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom 2: Notifikasi Sistem & Portal Publik */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
          {/* Bagian Atas: Notifikasi */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Notifikasi &amp; Pembaruan</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                {mockNotifications.length} Aktivitas
              </span>
            </div>

            <div className="space-y-2">
              {mockNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={`/dashboard${notif.tautan}`}
                  className="block rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs sm:text-sm hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm truncate max-w-[210px]">{notif.judul}</span>
                    <span className="text-xs text-slate-400 shrink-0">Baru saja</span>
                  </div>
                  <p className="mt-0.5 text-slate-600 text-xs sm:text-sm line-clamp-1">{notif.isi}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Bagian Bawah: Portal Publik */}
          <div className="pt-2.5 border-t border-slate-100">
            <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Portal Publik Terintegrasi</span>
              <span className="text-xs text-slate-400 font-normal">Akses Bebas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/mitra/isi/tok-telkom-2025"
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm hover:border-blue-300 hover:bg-blue-50/40 transition-all"
              >
                <div className="min-w-0 pr-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">Kuesioner Mitra</p>
                  <p className="text-xs text-slate-500 truncate">PT Telkom Indonesia</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>

              <Link
                href="/aduan/lacak"
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-xs sm:text-sm hover:border-blue-300 hover:bg-blue-50/40 transition-all"
              >
                <div className="min-w-0 pr-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">Lacak Tiket Aduan</p>
                  <p className="text-xs text-slate-500 truncate">Status Anonim &amp; Utas</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom 3: Direktori Modul SIMPRO (Modul 1-6 & Modul 7-13) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-2.5">
          {/* Sub-header Kemahasiswaan (Modul 1-6) */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Kemahasiswaan</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Modul 1–6</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/perwalian"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Users className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Perwalian</p>
                  <p className="text-xs text-slate-400 truncate">Laporan Kelas</p>
                </div>
              </Link>

              <Link
                href="/dashboard/beasiswa"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Award className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Beasiswa</p>
                  <p className="text-xs text-slate-400 truncate">Jam Karya</p>
                </div>
              </Link>

              <Link
                href="/dashboard/pelanggaran"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Sanksi</p>
                  <p className="text-xs text-slate-400 truncate">Sanksi Sosial</p>
                </div>
              </Link>

              <Link
                href="/dashboard/ukm"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">UKM</p>
                  <p className="text-xs text-slate-400 truncate">Kegiatan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/himpunan/proker"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Proker</p>
                  <p className="text-xs text-slate-400 truncate">Himpunan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/sertifikat"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FileBadge className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Sertifikat</p>
                  <p className="text-xs text-slate-400 truncate">Mahasiswa</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Sub-header Tata Kelola & Mutu (Modul 7-13) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <BookCheck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Tata Kelola &amp; Mutu</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Modul 7–13</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/kepuasan-mitra"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Kepuasan Mitra</p>
                  <p className="text-xs text-slate-400 truncate">KP, PSI, PDLK</p>
                </div>
              </Link>

              <Link
                href="/dashboard/publikasi/rekap"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Publikasi IKU</p>
                  <p className="text-xs text-slate-400 truncate">Karya &amp; Sitasi</p>
                </div>
              </Link>

              <Link
                href="/dashboard/perjalanan-dinas/rekap"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Plane className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">SPJ Dinas</p>
                  <p className="text-xs text-slate-400 truncate">Estimasi &amp; Riil</p>
                </div>
              </Link>

              <Link
                href="/dashboard/rka"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Coins className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">RKA &amp; Anggaran</p>
                  <p className="text-xs text-slate-400 truncate">Pagu &amp; Serapan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/rps"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <BookCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Review RPS</p>
                  <p className="text-xs text-slate-400 truncate">Standar SPMI</p>
                </div>
              </Link>

              <Link
                href="/dashboard/evaluasi-perkuliahan"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Evaluasi Kuliah</p>
                  <p className="text-xs text-slate-400 truncate">Ketercapaian CPMK</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

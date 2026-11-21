'use client';

import React, { useState, useEffect } from 'react';
import Link from '@/components/layout/RoleLink';
import {
  Building2,
  BookOpen,
  Plane,
  Coins,
  BookCheck,
  MessageSquareHeart,
  PlusCircle,
  FileText,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Award,
  Compass,
  FileBadge,
  Users,
  ShieldAlert,
  ChevronRight,
  Sparkles,
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

  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [publications, setPublications] = useState<Publication[]>(mockPublications);
  const [rpsList, setRpsList] = useState<RpsSubmission[]>(mockRpsSubmissions);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

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
    <div className="space-y-4 lg:space-y-3.5 min-w-0">
      {/* 1. LoopAI Top Welcome & Context Bar */}
      <div className="rounded-[20px] border border-slate-200/80 bg-white p-4 sm:p-4.5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 lg:gap-3">
          <div className="space-y-1.5 sm:space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs sm:text-sm font-medium text-slate-700 border border-slate-200/80">
                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                Semester Ganjil 2024/2025
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs sm:text-sm font-bold text-indigo-700 border border-indigo-200">
                Peran: {currentRole.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug lg:truncate">
              Selamat Datang, {user?.name || 'Civitas Akademika'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 sm:line-clamp-1">
              Sistem Informasi Manajemen Program Studi (SIMPRO) mengintegrasikan layanan kemahasiswaan serta tata kelola, mutu &amp; akreditasi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto sm:gap-2 shrink-0">
            {currentRole === 'MAHASISWA' ? (
              <>
                <Link
                  href="/dashboard/aduan"
                  className="btn-primary text-sm py-2.5 sm:py-2 px-3.5 sm:px-4 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  <MessageSquareHeart className="h-4 w-4 shrink-0" />
                  Kirim Aduan
                </Link>
                <Link
                  href="/aduan/lacak"
                  target="_blank"
                  className="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-3.5 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  Lacak Tiket
                  <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/publikasi/baru"
                  className="btn-primary text-sm py-2.5 sm:py-2 px-4 col-span-2 sm:col-span-1 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  <PlusCircle className="h-4 w-4 shrink-0" />
                  Publikasi Baru
                </Link>
                <Link
                  href="/dashboard/perjalanan-dinas/baru"
                  className="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-3.5 w-full sm:w-auto min-h-[42px] sm:min-h-0"
                >
                  <Plane className="h-4 w-4 text-indigo-600 shrink-0" />
                  Ajukan Dinas
                </Link>
                <Link
                  href="/dashboard/rps/ajukan"
                  className="btn-secondary text-sm py-2.5 sm:py-2 px-3 sm:px-3.5 w-full sm:w-auto min-h-[42px] sm:min-h-0"
                >
                  <BookCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Ajukan RPS
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI Metric Cards (1 Kolom Mobile, 2 Kolom Tablet md:, 3 Kolom Desktop lg:) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Metric 1: Kepuasan Mitra */}
        <Link
          href="/dashboard/kepuasan-mitra"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Kepuasan Mitra</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              +0.16
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap">
              {stats.indeksKepuasanMitra}
              <span className="text-sm font-normal text-slate-400"> / 5.0</span>
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              Sangat Puas (KP &amp; PSI)
            </span>
          </div>
        </Link>

        {/* Metric 2: Publikasi */}
        <Link
          href="/dashboard/publikasi"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Publikasi 2025</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              {stats.publikasiMenungguVerifikasi} Menunggu
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap">
              {stats.totalPublikasiTahunIni}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Karya</span>
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              Bandingkan 18 (tahun lalu)
            </span>
          </div>
        </Link>

        {/* Metric 3: Perjalanan Dinas */}
        <Link
          href="/dashboard/perjalanan-dinas"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Perjalanan Dinas</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              Aktif &amp; SPJ
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap">
              {stats.perjalananDinasAktif}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Tugas</span>
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              Surat Tugas &amp; Laporan
            </span>
          </div>
        </Link>

        {/* Metric 4: Serapan RKA */}
        <Link
          href="/dashboard/rka/2025/serapan"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Serapan Anggaran RKA</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              +15% TW III
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight shrink-0 whitespace-nowrap">
              {stats.serapanRkaPersen}%
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              Target Triwulan III On-Track
            </span>
          </div>
        </Link>

        {/* Metric 5: RPS Tuntas */}
        <Link
          href="/dashboard/rps/rekap"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">RPS &amp; Kurikulum</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              Standar SPMI
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight shrink-0 whitespace-nowrap">
              {stats.rpsTuntasPersen}%
              <span className="text-sm font-normal text-slate-400 ml-1.5">Disahkan</span>
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              18/19 MK Siap Kuliah
            </span>
          </div>
        </Link>

        {/* Metric 6: Aduan Terbuka */}
        <Link
          href="/dashboard/kelola/aduan"
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Aduan Mahasiswa</span>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 text-xs sm:text-sm font-semibold">
              SLA ≤ 3 Hari
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight shrink-0 whitespace-nowrap">
              {stats.aduanTerbuka}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Tiket Aktif</span>
            </p>
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate text-right min-w-0">
              Dalam Penanganan Petugas
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Operational 3-Column LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
        {/* Kolom 1: Priority Tasks Style (Antrean Tindak Lanjut) */}
        <div className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Tugas Prioritas</h3>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                {currentRole === 'MAHASISWA' ? '0 Tugas' : '4 Menunggu'}
              </span>
            </div>

            {currentRole === 'MAHASISWA' ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center my-3">
                <p className="text-xs font-medium text-slate-500">
                  Tidak ada antrean tugas verifikasi untuk peran Mahasiswa.
                </p>
                <Link
                  href="/dashboard/aduan"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Ajukan Aduan atau Pertanyaan &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
              {/* Trip Approval (Highlighted First Card in Lavender Tint) */}
              {pendingTrips.slice(0, 1).map((trip) => (
                <Link
                  key={trip.id}
                  href="/dashboard/perjalanan-dinas/persetujuan"
                  className="block rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-3 sm:p-2.5 transition-all hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        Persetujuan Dinas &bull; {trip.tujuan}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 truncate pl-6 mt-0.5">
                    {trip.maksud_kegiatan} ({formatDate(trip.tanggal_berangkat)})
                  </p>
                </Link>
              ))}

              {/* Publication Verification */}
              {pendingPublications.slice(0, 1).map((pub) => (
                <Link
                  key={pub.id}
                  href="/dashboard/publikasi/verifikasi"
                  className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:p-2.5 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        Verifikasi Publikasi Mahasiswa
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate pl-6 mt-0.5">
                    {pub.judul}
                  </p>
                </Link>
              ))}

              {/* RPS Review */}
              {pendingRps.slice(0, 1).map((rps) => (
                <Link
                  key={rps.id}
                  href="/dashboard/rps/review-saya"
                  className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:p-2.5 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        Review RPS: {rps.course?.nama_mk || 'Mata Kuliah'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate pl-6 mt-0.5">
                    Kode {rps.course?.kode_mk || rps.course_id} &bull; Pengampu: {rps.dosen_pengampu?.nama_lengkap || 'Dosen'}
                  </p>
                </Link>
              ))}

              {/* Active Complaints */}
              {activeComplaints.slice(0, 1).map((comp) => (
                <Link
                  key={comp.id}
                  href={`/dashboard/kelola/aduan/${comp.id}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:p-2.5 transition-all hover:bg-indigo-50/30 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-rose-500 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        Aduan: {comp.nomor_aduan}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate pl-6 mt-0.5">
                    {comp.judul}
                  </p>
                </Link>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Kolom 2: Notifikasi Sistem & Portal Publik */}
        <div className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Notifikasi &amp; Pembaruan</h3>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                {mockNotifications.length} Aktivitas
              </span>
            </div>

            <div className="space-y-2">
              {mockNotifications.map((notif, idx) => (
                <Link
                  key={notif.id}
                  href={`/dashboard${notif.tautan}`}
                  className={`block rounded-2xl p-3 sm:p-2.5 text-xs sm:text-sm transition-all ${
                    idx === 0
                      ? 'bg-indigo-50/50 border border-indigo-100/80'
                      : 'border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-bold text-slate-900 text-sm truncate min-w-0 flex-1 lg:max-w-[210px]">{notif.judul}</span>
                    <span className="text-xs text-slate-400 shrink-0">Baru saja</span>
                  </div>
                  <p className="mt-0.5 text-slate-500 text-xs sm:text-sm line-clamp-1">{notif.isi}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Bagian Bawah: Portal Publik */}
          <div className="pt-2.5 border-t border-slate-100">
            <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">Portal Publik Terintegrasi</span>
              <span className="text-xs text-indigo-600 font-semibold shrink-0 whitespace-nowrap">Tanpa Login</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
              <Link
                href="/mitra/isi/tok-telkom-2025"
                target="_blank"
                className="min-w-0 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-2.5 text-xs sm:text-sm hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 text-sm truncate">Kuesioner Mitra</p>
                  <p className="text-xs text-slate-500 truncate">PT Telkom Indonesia</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>

              <Link
                href="/aduan/lacak"
                target="_blank"
                className="min-w-0 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-2.5 text-xs sm:text-sm hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 text-sm truncate">Lacak Tiket Aduan</p>
                  <p className="text-xs text-slate-500 truncate">Status Anonim &amp; Utas</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom 3: LoopAI Pastel Hub (Direktori Modul 1-6 & 7-13) */}
        <div className="min-w-0 rounded-[20px] bg-gradient-to-b from-indigo-100/60 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-4 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between space-y-3 lg:space-y-2.5">
          {/* Sub-header Kemahasiswaan (Modul 1-6) */}
          <div>
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 lg:mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Kemahasiswaan</h3>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                Modul 1–6
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
              <Link
                href="/dashboard/perwalian"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Perwalian</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Laporan Kelas</p>
                </div>
              </Link>

              <Link
                href="/dashboard/beasiswa"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Award className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Beasiswa</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Jam Karya</p>
                </div>
              </Link>

              <Link
                href="/dashboard/pelanggaran"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Sanksi</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Sanksi Sosial</p>
                </div>
              </Link>

              <Link
                href="/dashboard/ukm"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Compass className="h-4 w-4 text-sky-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">UKM</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Kegiatan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/himpunan/proker"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Proker</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Himpunan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/sertifikat"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <FileBadge className="h-4 w-4 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Sertifikat</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Mahasiswa</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Sub-header Tata Kelola & Mutu (Modul 7-13) */}
          <div className="pt-2.5 lg:pt-2 border-t border-indigo-100/80">
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 lg:mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Tata Kelola &amp; Mutu</h3>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                Modul 7–13
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
              <Link
                href="/dashboard/kepuasan-mitra"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Kepuasan Mitra</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">KP, PSI, PDLK</p>
                </div>
              </Link>

              <Link
                href="/dashboard/publikasi/rekap"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Publikasi IKU</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Karya &amp; Sitasi</p>
                </div>
              </Link>

              <Link
                href="/dashboard/perjalanan-dinas/rekap"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Plane className="h-4 w-4 text-sky-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">SPJ Dinas</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Estimasi &amp; Riil</p>
                </div>
              </Link>

              <Link
                href="/dashboard/rka"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <Coins className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">RKA &amp; Anggaran</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Pagu &amp; Serapan</p>
                </div>
              </Link>

              <Link
                href="/dashboard/rps"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <BookCheck className="h-4 w-4 text-rose-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Review RPS</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Standar SPMI</p>
                </div>
              </Link>

              <Link
                href="/dashboard/evaluasi-perkuliahan"
                className="min-w-0 flex items-center gap-2 p-2.5 lg:p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-300 transition-all shadow-2xs"
              >
                <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] sm:text-sm font-bold text-slate-800 leading-tight truncate">Evaluasi Kuliah</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">Ketercapaian CPMK</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

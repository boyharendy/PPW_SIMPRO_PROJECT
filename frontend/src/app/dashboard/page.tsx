'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  BookOpen,
  Plane,
  Coins,
  BookCheck,
  MessageSquareHeart,
  TrendingUp,
  AlertTriangle,
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
  mockTrips,
  mockPublications,
  mockRpsSubmissions,
} from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function DashboardPage() {
  const { user, currentRole } = useUser();
  const stats = mockDashboardStats;

  // Urgent pending items
  const pendingTrips = mockTrips.filter((t) => t.status === 'DIAJUKAN');
  const pendingPublications = mockPublications.filter((p) => p.status_verifikasi === 'MENUNGGU');
  const pendingRps = mockRpsSubmissions.filter(
    (r) => r.status === 'DIAJUKAN' || r.status === 'DIREVIEW'
  );
  const activeComplaints = mockComplaints.filter(
    (c) => c.status === 'DITERIMA' || c.status === 'DITINDAKLANJUTI'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Semester Ganjil 2024/2025
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                Role: {currentRole.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Selamat Datang, {user?.name || 'Civitas Akademika'}!
            </h1>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Sistem Informasi Manajemen Program Studi (SIMPRO) mengintegrasikan layanan kemahasiswaan (perwalian, beasiswa, sanksi, UKM, himpunan, sertifikat) serta tata kelola, mutu &amp; akreditasi program studi.

            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentRole === 'MAHASISWA' ? (
              <>
                <Link
                  href="/dashboard/aduan"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquareHeart className="h-4 w-4" />
                  Kirim Aduan Anonim
                </Link>
                <Link
                  href="/aduan/lacak"
                  target="_blank"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                >
                  Lacak Tiket Aduan
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/publikasi/baru"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  Publikasi Baru
                </Link>
                <Link
                  href="/dashboard/perjalanan-dinas/baru"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plane className="h-4 w-4 text-blue-600" />
                  Ajukan Dinas
                </Link>
                <Link
                  href="/dashboard/rps/ajukan"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <BookCheck className="h-4 w-4 text-emerald-600" />
                  Ajukan RPS
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards (Symmetrical 3x2 Grid for spacious, modern enterprise typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1: Kepuasan Mitra */}
        <Link
          href="/dashboard/kepuasan-mitra"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kepuasan Mitra</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {stats.indeksKepuasanMitra}
              <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            <span>Predikat Sangat Puas (KP &amp; PSI)</span>
          </div>
        </Link>

        {/* Metric 2: Publikasi */}
        <Link
          href="/dashboard/publikasi"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Publikasi 2025</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.totalPublikasiTahunIni}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Karya Terbit</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>{stats.publikasiMenungguVerifikasi} Menunggu Verifikasi</span>
          </div>
        </Link>

        {/* Metric 3: Perjalanan Dinas */}
        <Link
          href="/dashboard/perjalanan-dinas"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perjalanan Dinas</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Plane className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.perjalananDinasAktif}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Penugasan</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Tugas Aktif &amp; Verifikasi SPJ</span>
          </div>
        </Link>

        {/* Metric 4: Serapan RKA */}
        <Link
          href="/dashboard/rka/2025/serapan"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Serapan Anggaran RKA</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-emerald-700 tracking-tight">
              {stats.serapanRkaPersen}%
              <span className="text-sm font-normal text-slate-400 ml-1.5">Terealisasi</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Target Triwulan III On-Track</span>
          </div>
        </Link>

        {/* Metric 5: RPS Tuntas */}
        <Link
          href="/dashboard/rps/rekap"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">RPS &amp; Kurikulum</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-blue-700 tracking-tight">
              {stats.rpsTuntasPersen}%
              <span className="text-sm font-normal text-slate-400 ml-1.5">Disahkan</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Memenuhi Standar Mutu SPMI</span>
          </div>
        </Link>

        {/* Metric 6: Aduan Terbuka */}
        <Link
          href="/dashboard/kelola/aduan"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aduan Mahasiswa</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <MessageSquareHeart className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.aduanTerbuka}
              <span className="text-sm font-normal text-slate-400 ml-1.5">Tiket Aktif</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Dalam Penanganan SLA Terkendali</span>
          </div>
        </Link>
      </div>

      {/* Main Two Columns (Symmetrical 50/50 Balanced Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Operational Queues & Module Shortcuts */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Antrean Tindak Lanjut &amp; Verifikasi</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                4 Menunggu
              </span>
            </div>

            <div className="space-y-3">
              {/* Trip Approval */}
              {pendingTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Persetujuan Dinas
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{trip.maksud_kegiatan}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {trip.tujuan} &bull; Tgl: {formatDate(trip.tanggal_berangkat)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/perjalanan-dinas/persetujuan`}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Proses
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}

              {/* Publication Verification */}
              {pendingPublications.map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                      Verifikasi Publikasi
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{pub.judul}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      Penulis: {pub.authors[0]?.nama_penulis} &bull; Target: {pub.nama_target} ({pub.peringkat})
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/publikasi/verifikasi`}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Verifikasi
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}

              {/* RPS Review */}
              {pendingRps.map((rps) => (
                <div
                  key={rps.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Review RPS &amp; Kurikulum
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {rps.course?.nama_mk || 'Mata Kuliah'} ({rps.course?.kode_mk || rps.course_id})
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">
                      Pengampu: {rps.dosen_pengampu?.nama_lengkap || 'Dosen'} &bull; Periode: {rps.academic_period?.tahun_ajaran || '2024/2025'} ({rps.academic_period?.semester || 'GANJIL'})
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/rps/review-saya`}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Review
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}

              {/* Active Complaints */}
              {activeComplaints.slice(0, 2).map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                      Aduan Mahasiswa
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{comp.judul}</p>
                    <p className="text-slate-500 font-mono text-[11px] truncate">
                      {comp.nomor_aduan} &bull; Masuk: {formatDate(comp.tanggal_diterima)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/kelola/aduan/${comp.id}`}
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Tindak Lanjut
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts to Modules 1-6 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Akses Modul Kemahasiswaan</h3>
              <span className="text-xs text-slate-400 font-medium">Modul 1–6</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/perwalian"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Users className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Laporan Perwalian</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ketua Kelas &amp; Dosen</p>
              </Link>

              <Link
                href="/dashboard/beasiswa"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Award className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Beasiswa &amp; Jam Karya</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Log Jam &amp; Verifikasi</p>
              </Link>

              <Link
                href="/dashboard/pelanggaran"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 mb-2" />
                <p className="font-semibold text-slate-800">Pelanggaran &amp; Sanksi</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Jam Sanksi Sosial</p>
              </Link>

              <Link
                href="/dashboard/ukm"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Compass className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Kegiatan UKM</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Direktori &amp; Anggota</p>
              </Link>

              <Link
                href="/dashboard/himpunan/proker"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Calendar className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Proker Himpunan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Proposal &amp; LPJ</p>
              </Link>

              <Link
                href="/dashboard/sertifikat"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FileBadge className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Sertifikat Mahasiswa</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Bahasa &amp; Profesi</p>
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts to Modules 7-13 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Akses Modul Tata Kelola &amp; Mutu Prodi</h3>
              <span className="text-xs text-slate-400 font-medium">Modul 7–13</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/kepuasan-mitra"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Building2 className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Kepuasan Mitra</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Instrumen &amp; Rekap</p>
              </Link>

              <Link
                href="/dashboard/publikasi/rekap"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Rekap Publikasi</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Akreditasi &amp; IKU</p>
              </Link>

              <Link
                href="/dashboard/perjalanan-dinas/rekap"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Plane className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">SPJ Dinas</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Estimasi vs Realisasi</p>
              </Link>

              <Link
                href="/dashboard/rka"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Coins className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">RKA &amp; Anggaran</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Versi Kerja &amp; Serapan</p>
              </Link>

              <Link
                href="/dashboard/rps"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <BookCheck className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Review RPS</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Checklist 5 Komponen</p>
              </Link>

              <Link
                href="/dashboard/evaluasi-perkuliahan"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FileText className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Evaluasi Kuliah</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Analisis CPMK Kelas</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Public Portals */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Notifikasi &amp; Pembaruan Sistem</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                {mockNotifications.length} Aktivitas
              </span>
            </div>

            <div className="space-y-3">
              {mockNotifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={`/dashboard${notif.tautan}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3.5 text-xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{notif.judul}</span>
                    <span className="text-[10px] text-slate-400">Baru saja</span>
                  </div>
                  <p className="mt-1 text-slate-600 leading-relaxed text-xs">{notif.isi}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links to Public Portals */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Portal Publik Terintegrasi (Akses Tanpa Login)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Alur pengisian kuesioner mitra mandiri dan pelacakan tiket aduan responsif:
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/mitra/isi/tok-telkom-2025"
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/40 p-3.5 text-xs hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Kuesioner Mitra Publik</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PT Telkom Indonesia (Akses Token Langsung)</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                href="/aduan/lacak"
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/40 p-3.5 text-xs hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Pelacak Tiket Aduan Mahasiswa</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pemeriksaan Status Anonim &amp; Utas Chat Balasan</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

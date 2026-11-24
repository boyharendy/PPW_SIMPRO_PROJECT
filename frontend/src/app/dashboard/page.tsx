'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  ShieldAlert,
  Compass,
  Calendar,
  FileBadge,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  FileCheck,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import {
  mockClassPerwalianReports,
  mockScholarshipRecipients,
  mockScholarshipWorkLogs,
  mockStudentViolations,
  mockSanctionActivityLogs,
  mockUkmDirectories,
  mockUkmMemberships,
  mockHimpunanProkers,
  mockHimpunanProposals,
  mockStudentCertificates,
  mockNotifications,
} from '@/lib/mock-data';
import { ROLE_LABELS } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, currentRole } = useUser();

  // Dynamic Metrics for Modules 1-6
  const totalPerwalianReports = mockClassPerwalianReports.length;
  const verifiedPerwalianReports = mockClassPerwalianReports.filter((r) => r.status === 'TERVERIFIKASI').length;

  const totalScholarshipStudents = mockScholarshipRecipients.length;
  const pendingWorkLogs = mockScholarshipWorkLogs.filter((l) => l.status === 'MENUNGGU');

  const activeViolations = mockStudentViolations.filter((v) => v.status_sanksi !== 'SELESAI');
  const pendingSanctions = mockSanctionActivityLogs.filter((l) => l.status === 'MENUNGGU');

  const totalUkm = mockUkmDirectories.length;
  const pendingUkmMemberships = mockUkmMemberships.filter((m) => m.status === 'MENUNGGU');

  const totalProkers = mockHimpunanProkers.length;
  const pendingHimpunanApprovals = mockHimpunanProposals.filter((p) => p.status === 'DIAJUKAN' || p.status === 'DISETUJUI_PEMBINA');

  const totalCertificates = mockStudentCertificates.length;
  const pendingCertificates = mockStudentCertificates.filter((c) => c.status === 'MENUNGGU');

  const totalPendingVerifications =
    pendingWorkLogs.length +
    pendingSanctions.length +
    pendingUkmMemberships.length +
    pendingHimpunanApprovals.length +
    pendingCertificates.length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Semester Ganjil 2024/2025
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                Peran Aktif: {ROLE_LABELS[currentRole] || currentRole}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Selamat Datang, {user?.name || user?.nama_lengkap || 'Civitas Akademika'}!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              SIMPRO Kemahasiswaan &amp; Tata Kelola mengintegrasikan siklus perwalian kelas, beasiswa &amp; jam karya,
              pelanggaran &amp; sanksi sosial (UU PDP), direktori UKM, proker &amp; LPJ himpunan, serta sertifikat kompetensi mahasiswa.
            </p>
          </div>

          {/* Quick Actions (Filtered by Active Role) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentRole === 'MAHASISWA' && (
              <>
                <Link
                  href="/dashboard/beasiswa/jam-karya"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="h-4 w-4" />
                  Catat Jam Karya
                </Link>
                <Link
                  href="/dashboard/sertifikat"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileBadge className="h-4 w-4 text-blue-600" />
                  Unggah Sertifikat
                </Link>
                <Link
                  href="/dashboard/pelanggaran/sanksi-saya"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Sanksi Sosial Saya
                </Link>
              </>
            )}

            {currentRole === 'KETUA_KELAS' && (
              <>
                <Link
                  href="/dashboard/perwalian"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Users className="h-4 w-4" />
                  Lapor Perwalian Kelas
                </Link>
                <Link
                  href="/dashboard/sertifikat"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileBadge className="h-4 w-4 text-blue-600" />
                  Unggah Sertifikat
                </Link>
              </>
            )}

            {(currentRole === 'PENGURUS_HIMPUNAN' || currentRole === 'HIMPUNAN') && (
              <>
                <Link
                  href="/dashboard/himpunan/proposal"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  Ajukan Proposal Proker
                </Link>
                <Link
                  href="/dashboard/himpunan/lpj"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Layers className="h-4 w-4 text-blue-600" />
                  Unggah LPJ Kegiatan
                </Link>
              </>
            )}

            {currentRole === 'ADMIN_PRODI' && (
              <>
                <Link
                  href="/dashboard/beasiswa"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="h-4 w-4" />
                  Penerima Beasiswa
                </Link>
                <Link
                  href="/dashboard/ukm"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Compass className="h-4 w-4 text-blue-600" />
                  Direktori UKM
                </Link>
                <Link
                  href="/dashboard/pengaturan/peran"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Users className="h-4 w-4 text-indigo-600" />
                  Penetapan Peran
                </Link>
              </>
            )}

            {currentRole === 'KAPRODI' && (
              <>
                <Link
                  href="/dashboard/perwalian/rekap"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Users className="h-4 w-4" />
                  Rekap Isu Perwalian
                </Link>
                <Link
                  href="/dashboard/himpunan/verifikasi"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Persetujuan Himpunan
                </Link>
                <Link
                  href="/dashboard/pelanggaran"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Data Pelanggaran
                </Link>
              </>
            )}

            {(currentRole === 'DOSEN' ||
              currentRole === 'DOSEN_WALI' ||
              currentRole === 'DOSEN_VERIFIKATOR' ||
              currentRole === 'DOSEN_PEMBINA') && (
              <>
                <Link
                  href="/dashboard/beasiswa/verifikasi"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verifikasi Jam Karya
                </Link>
                <Link
                  href="/dashboard/sertifikat/verifikasi"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileBadge className="h-4 w-4 text-blue-600" />
                  Verifikasi Sertifikat
                </Link>
                <Link
                  href="/dashboard/perwalian"
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <Users className="h-4 w-4 text-emerald-600" />
                  Laporan Perwalian
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards — Modul 1 sampai 6 (Symmetrical 3x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1: Modul 1 — Laporan Perwalian */}
        <Link
          href="/dashboard/perwalian"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Laporan Perwalian</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {verifiedPerwalianReports} / {totalPerwalianReports}
              <span className="text-sm font-normal text-slate-400">Kelas</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Terverifikasi Lengkap Dosen Wali</span>
          </div>
        </Link>

        {/* Metric 2: Modul 2 — Beasiswa & Jam Karya */}
        <Link
          href="/dashboard/beasiswa"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Beasiswa &amp; Jam Karya</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {totalScholarshipStudents}
              <span className="text-sm font-normal text-slate-400">Penerima</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>{pendingWorkLogs.length} Entri Menunggu Verifikasi</span>
          </div>
        </Link>

        {/* Metric 3: Modul 3 — Pelanggaran & Sanksi */}
        <Link
          href="/dashboard/pelanggaran"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pelanggaran &amp; Sanksi</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {activeViolations.length}
              <span className="text-sm font-normal text-slate-400">Kasus Aktif</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Proteksi Privasi &amp; Retensi UU PDP</span>
          </div>
        </Link>

        {/* Metric 4: Modul 4 — UKM Mahasiswa */}
        <Link
          href="/dashboard/ukm"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit Kegiatan Mahasiswa</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {totalUkm}
              <span className="text-sm font-normal text-slate-400">UKM Aktif</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>{mockUkmMemberships.length} Mahasiswa Terdaftar</span>
          </div>
        </Link>

        {/* Metric 5: Modul 5 — Program Kerja Himpunan */}
        <Link
          href="/dashboard/himpunan"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Program Kerja Himpunan</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {totalProkers}
              <span className="text-sm font-normal text-slate-400">Proker Terencana</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Persetujuan &amp; Pengesahan Kaprodi</span>
          </div>
        </Link>

        {/* Metric 6: Modul 6 — Sertifikat Mahasiswa */}
        <Link
          href="/dashboard/sertifikat"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sertifikat Mahasiswa</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <FileBadge className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1.5">
              {totalCertificates}
              <span className="text-sm font-normal text-slate-400">Dokumen</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <FileCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>{pendingCertificates.length} Menunggu Validasi Dosen</span>
          </div>
        </Link>
      </div>

      {/* Main Two Columns (50/50 Balanced Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Operational Queues for Modules 1-6 */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Antrean Verifikasi Kemahasiswaan (Modul 1–6)</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                {totalPendingVerifications} Butuh Tindakan
              </span>
            </div>

            <div className="space-y-3">
              {/* Beasiswa Work Logs Queue */}
              {pendingWorkLogs.slice(0, 2).map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Jam Karya Beasiswa
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{log.mahasiswa_nama} ({log.durasi_jam} Jam)</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {log.uraian_kegiatan} &bull; Tgl: {formatDate(log.tanggal)}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/beasiswa/verifikasi"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Verifikasi
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}

              {/* Himpunan Proker / Proposal Approval Queue */}
              {pendingHimpunanApprovals.slice(0, 2).map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Proposal Proker Himpunan
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{prop.proker_nama}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      Nomor: {prop.nomor_surat} &bull; Status: {prop.status}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/himpunan/verifikasi"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Tinjau
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}

              {/* Certificates Queue */}
              {pendingCertificates.slice(0, 2).map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                      Sertifikat Mahasiswa
                    </span>
                    <p className="font-semibold text-slate-900 text-sm truncate">{cert.jenis_sertifikasi}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {cert.mahasiswa_nama} &bull; Lembaga: {cert.lembaga_penerbit}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/sertifikat/verifikasi"
                    className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    Validasi
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Module Direct Access Cards (Modul 1-6) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Akses Cepat Modul 1–6</h3>
              <span className="text-xs text-blue-600 font-semibold">SIMPRO Kemahasiswaan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/perwalian"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Users className="h-4 w-4 text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 1: Perwalian</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ketua Kelas &amp; Dosen</p>
              </Link>

              <Link
                href="/dashboard/beasiswa"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Award className="h-4 w-4 text-amber-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 2: Beasiswa</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Jam Karya Mahasiswa</p>
              </Link>

              <Link
                href="/dashboard/pelanggaran"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 3: Pelanggaran</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Jam Sanksi Sosial</p>
              </Link>

              <Link
                href="/dashboard/ukm"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Compass className="h-4 w-4 text-indigo-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 4: UKM</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Direktori &amp; Anggota</p>
              </Link>

              <Link
                href="/dashboard/himpunan"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Calendar className="h-4 w-4 text-emerald-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 5: Himpunan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Proker, Proposal, LPJ</p>
              </Link>

              <Link
                href="/dashboard/sertifikat"
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <FileBadge className="h-4 w-4 text-sky-600 mb-2" />
                <p className="font-semibold text-slate-800">Modul 6: Sertifikat</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Bahasa &amp; Profesi</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Audit Integrity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Aktivitas &amp; Log Perubahan (Modul 1–6)</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                {mockNotifications.length} Terkini
              </span>
            </div>

            <div className="space-y-3">
              {mockNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{notif.judul}</span>
                    <span className="text-[10px] text-slate-400">Baru saja</span>
                  </div>
                  <p className="mt-1 text-slate-600 leading-relaxed text-xs">{notif.isi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Guardrails Card */}
          <div className="rounded-xl border border-slate-200 bg-blue-50/50 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-blue-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Kepatuhan Guardrails Keamanan &amp; Tata Kelola
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              SIMPRO mengimplementasikan proteksi ketat tingkat baris: Admin Prodi diblokir dari Modul 3 Pelanggaran (FR-12, NF-03),
              penghapusan data sanksi secara permanen saat status mahasiswa tidak aktif (UU PDP, NF-05), dan validasi serta pengesahan proker himpunan terpadu oleh Kaprodi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

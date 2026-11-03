'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  FileSpreadsheet,
  FileCheck,
  PieChart,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Layers,
  Coins,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  mockHimpunanProkers,
  mockHimpunanProposals,
  mockHimpunanLpjs,
  mockHimpunanDeviationReports,
} from '@/lib/mock-data';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function HimpunanDashboardPage() {
  const { currentRole } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState('2024/2025');

  const prokers = mockHimpunanProkers.filter((p) => p.periode_kepengurusan === selectedPeriod);
  const totalRencana = prokers.reduce((acc, p) => acc + p.total_anggaran_rencana, 0);
  const totalRealisasi = mockHimpunanLpjs.reduce((acc, l) => acc + l.total_biaya_realisasi, 0);
  const pendingPembina = mockHimpunanProposals.filter((p) => p.status === 'DIAJUKAN').length +
    mockHimpunanLpjs.filter((l) => l.status === 'DIAJUKAN').length;
  const pendingKaprodi = mockHimpunanProposals.filter((p) => p.status === 'DISETUJUI_PEMBINA').length +
    mockHimpunanLpjs.filter((l) => l.status === 'DISETUJUI_PEMBINA').length;

  const isPengurus = currentRole === 'PENGURUS_HIMPUNAN' || currentRole === 'HIMPUNAN' || currentRole === 'MAHASISWA';
  const isApprover = currentRole === 'DOSEN_PEMBINA' || currentRole === 'KAPRODI' || currentRole === 'DOSEN';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modul 5: Program Kerja Himpunan"
        description="Pengelolaan terpadu siklus program kerja: penginputan rencana anggaran, pengajuan proposal terstruktur, pelaporan LPJ & kuitansi sah, verifikasi bertingkat Pembina–Kaprodi, serta analisis deviasi otomatis dan laporan evaluasi."
        badge={
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            Himpunan Mahasiswa Sistem Informasi (HMSI)
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="2024/2025">Periode 2024/2025</option>
              <option value="2023/2024">Periode 2023/2024</option>
            </select>
            {isPengurus && (
              <Link
                href="/dashboard/himpunan/proker"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Input Proker Baru
              </Link>
            )}
            {isApprover && (
              <Link
                href="/dashboard/himpunan/verifikasi"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck className="h-4 w-4" />
                Antrean Verifikasi
              </Link>
            )}
          </div>
        }
      />

      {/* KPI Stats Symmetrical Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Program Kerja"
          value={prokers.length}
          subtitle={`Periode ${selectedPeriod}`}
          icon={<Calendar size={18} />}
        />
        <StatCard
          title="Total Pagu Rencana"
          value={formatRupiah(totalRencana)}
          subtitle="Akumulasi Seluruh Proker"
          icon={<Coins size={18} />}
        />
        <StatCard
          title="Realisasi Biaya LPJ"
          value={formatRupiah(totalRealisasi)}
          subtitle={`${((totalRealisasi / (totalRencana || 1)) * 100).toFixed(1)}% Penyerapan Anggaran`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          title="Antrean Verifikasi"
          value={pendingPembina + pendingKaprodi}
          subtitle={`${pendingPembina} di Pembina, ${pendingKaprodi} di Kaprodi`}
          icon={<Clock size={18} />}
        />
      </div>

      {/* Five Functional Navigation Pillars */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Alur Pengelolaan Program Kerja Himpunan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Navigasi terintegrasi sesuai Spesifikasi Kebutuhan Perangkat Lunak (SKPL) Modul 5:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/dashboard/himpunan/proker"
            className="group rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Perencanaan</span>
              <h3 className="font-semibold text-slate-900 text-sm mt-1">Input Proker</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Rencana kegiatan, indikator capaian, dan rincian pos anggaran wajib.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Kelola Proker</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/dashboard/himpunan/proposal"
            className="group rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Pengajuan</span>
              <h3 className="font-semibold text-slate-900 text-sm mt-1">Proposal Kegiatan</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Unggah proposal terstruktur dengan rincian anggaran & sumber dana otomatis.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Ajukan Proposal</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/dashboard/himpunan/lpj"
            className="group rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pelaporan</span>
              <h3 className="font-semibold text-slate-900 text-sm mt-1">Pengunggahan LPJ</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pelaporan realisasi biaya, kuitansi sah, peserta, dan hari keterlambatan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>Unggah LPJ</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/dashboard/himpunan/verifikasi"
            className="group rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Persetujuan</span>
              <h3 className="font-semibold text-slate-900 text-sm mt-1">Verifikasi Bertingkat</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Persetujuan dua tahap: Tahap 1 Dosen Pembina → Tahap 2 Kaprodi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Proses Review</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/dashboard/himpunan/analisis"
            className="group rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Evaluasi Mutu</span>
              <h3 className="font-semibold text-slate-900 text-sm mt-1">Analisis Deviasi</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Komparasi Proker vs Proposal vs LPJ, batas toleransi deviasi 15%, &amp; evaluasi naratif.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>Buka Analisis</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Active Prokers Overview & Recent Statuses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Summary Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Program Kerja Periode Ini</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ringkasan status siklus pengajuan proker hingga LPJ</p>
            </div>
            <Link
              href="/dashboard/himpunan/proker"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Lihat Detail Proker
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Nama Kegiatan</th>
                  <th className="px-3.5 py-3">Jadwal Rencana</th>
                  <th className="px-3.5 py-3 text-right">Pagu Rencana</th>
                  <th className="px-3.5 py-3 text-center">Status</th>
                  <th className="px-3.5 py-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {prokers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-900 max-w-xs truncate">
                      {p.nama_kegiatan}
                      <span className="block font-normal text-[11px] text-slate-500 truncate mt-0.5">
                        Indikator: {p.indikator_keberhasilan}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                      {formatDateShort(p.tanggal_rencana_mulai)} s.d. {formatDateShort(p.tanggal_rencana_selesai)}
                    </td>
                    <td className="px-3.5 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                      {formatRupiah(p.total_anggaran_rencana)}
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      {p.status === 'TERDAFTAR' ? (
                        <Link
                          href={`/dashboard/himpunan/proposal?proker_id=${p.id}`}
                          className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          Ajukan Proposal
                        </Link>
                      ) : p.status === 'PROPOSAL_DISETUJUI' ? (
                        <Link
                          href={`/dashboard/himpunan/lpj?proker_id=${p.id}`}
                          className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200"
                        >
                          Unggah LPJ
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/himpunan/analisis`}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200"
                        >
                          Lihat Deviasi
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 col): Approvals & Deviations Alert */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Alur Verifikasi Bertingkat</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                2 Tahap
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Tahap 1: Dosen Pembina</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                    {pendingPembina} Menunggu
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Memeriksa kesesuaian anggaran, substansi kegiatan, dan kesiapan berkas proposal/LPJ.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Tahap 2: Ketua Program Studi</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    {pendingKaprodi} Menunggu
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pengesahan persetujuan akhir prodi dan rekomendasi pencairan dana anggaran.
                </p>
              </div>

              <Link
                href="/dashboard/himpunan/verifikasi"
                className="w-full rounded-lg bg-blue-600 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700 transition-colors block"
              >
                Buka Meja Verifikasi
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Pemantauan Deviasi Kegiatan</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Ambang: 15%</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {mockHimpunanDeviationReports.map((d, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    d.is_over_threshold
                      ? 'border-rose-200 bg-rose-50/50 text-rose-900'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <p className="font-semibold text-xs">{d.nama_kegiatan}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span>Deviasi Anggaran:</span>
                    <span className="font-bold">
                      {d.deviasi_anggaran_persen > 0 ? '+' : ''}
                      {d.deviasi_anggaran_persen}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px]">
                    <span>Keterlambatan LPJ:</span>
                    <span className="font-bold">{d.hari_keterlambatan_lpj} Hari</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Edit3,
  Save,
  Check,
  ShieldCheck,
  Building,
  Users,
  ArrowRight,
  Filter,
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
import { HimpunanDeviationReport } from '@/lib/types';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function HimpunanAnalisisPage() {
  const { currentRole } = useUser();
  const [viewTab, setViewTab] = useState<'KEGIATAN' | 'PERIODE'>('KEGIATAN');

  // Activity-Level State
  const [selectedProkerId, setSelectedProkerId] = useState<string>('proker-1');
  const [thresholdPercent, setThresholdPercent] = useState<number>(15);
  const [reports, setReports] = useState<HimpunanDeviationReport[]>(mockHimpunanDeviationReports);

  // Active Single-Activity Report
  const activeReport = reports.find((r) => r.proker_id === selectedProkerId) || reports[0];
  const activeProker = mockHimpunanProkers.find((p) => p.id === selectedProkerId);
  const activeProposal = mockHimpunanProposals.find((p) => p.proker_id === selectedProkerId);
  const activeLpj = mockHimpunanLpjs.find((l) => l.proker_id === selectedProkerId);

  // Editable Narrative for Single Activity
  const [editableNarrative, setEditableNarrative] = useState(
    activeReport?.ringkasan_evaluasi_disunting || activeReport?.ringkasan_evaluasi_draf || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isPublished, setIsPublished] = useState(activeReport?.is_diterbitkan || false);

  // Editable Narrative for Tenure Period
  const [tenureNarrative, setTenureNarrative] = useState(
    `Evaluasi Menyeluruh Periode Kepengurusan HIMASIFO 2026/2027:\n` +
    `1. Sebanyak 67% program kerja utama berhasil direalisasikan tuntas dengan akuntabilitas laporan yang memadai.\n` +
    `2. Penyerapan anggaran mandiri mencapai 77% dari pagu yang direncanakan. Terdapat deviasi biaya pada pos operasional dan logistik karena eskalasi peserta.\n` +
    `3. Satu kegiatan (Studi Banding Industri) mengalami pergeseran jadwal dan deviasi anggaran di atas ambang batas 15%, namun telah diverifikasi dan disahkan oleh Kaprodi.\n` +
    `4. Rekomendasi kepengurusan berikutnya: Memperketat disiplin tenggat LPJ 14 hari kerja dan digitalisasi kuitansi sejak hari pertama pelaksanaan.`
  );
  const [isEditingTenure, setIsEditingTenure] = useState(false);
  const [isTenurePublished, setIsTenurePublished] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role detection
  const isKaprodi = currentRole === 'KAPRODI';
  const isPembina = currentRole === 'DOSEN_PEMBINA';

  // When selected proker changes, update single activity narrative
  const handleSelectProker = (id: string) => {
    setSelectedProkerId(id);
    const r = reports.find((rep) => rep.proker_id === id);
    if (r) {
      setEditableNarrative(r.ringkasan_evaluasi_disunting || r.ringkasan_evaluasi_draf || '');
      setIsPublished(r.is_diterbitkan);
      setIsEditing(false);
    }
  };

  // Save single activity narrative
  const handleSaveNarrative = () => {
    const updated = reports.map((r) => {
      if (r.proker_id === selectedProkerId) {
        return {
          ...r,
          ringkasan_evaluasi_disunting: editableNarrative,
          is_diterbitkan: true,
        };
      }
      return r;
    });
    setReports(updated);
    setIsEditing(false);
    setIsPublished(true);
    setToastMessage('Ringkasan evaluasi kegiatan resmi berhasil disimpan dan diterbitkan oleh Dosen Pembina.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Save tenure period narrative
  const handleSaveTenureNarrative = () => {
    setIsEditingTenure(false);
    setIsTenurePublished(true);
    setToastMessage('Laporan Evaluasi Periode Kepengurusan resmi disahkan & diterbitkan oleh Dosen Pembina.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Export handlers
  const handleExportPDF = () => {
    const title = viewTab === 'KEGIATAN' ? 'Laporan per Kegiatan' : 'Laporan Periode Kepengurusan';
    setToastMessage(`${title} (PDF) sedang di-generate sesuai format standar universitas...`);
    setTimeout(() => setToastMessage(`Unduhan PDF ${title} berhasil dibuat.`), 2000);
  };

  const handleExportExcel = () => {
    setToastMessage('Data Analisis Deviasi & Realisasi (Excel) berhasil diunduh.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stats calculation
  const totalProker = mockHimpunanProkers.length;
  const prokerTerlaksana = mockHimpunanProkers.filter((p) => p.status === 'SELESAI' || p.status === 'LPJ_DIAJUKAN').length;
  const persentaseTerlaksana = Math.round((prokerTerlaksana / (totalProker || 1)) * 100);

  const totalPagu = mockHimpunanProkers.reduce((acc, p) => acc + p.total_anggaran_rencana, 0);
  const totalSerapan = mockHimpunanLpjs.reduce((acc, l) => acc + l.total_biaya_realisasi, 0);
  const persentaseSerapan = Math.round((totalSerapan / (totalPagu || 1)) * 100);

  const criticalDeviationsCount = reports.filter((r) => r.is_over_threshold).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Analisis Deviasi &amp; Pelaporan Mutu Himpunan"
        description="Sistem secara otomatis mengolah Laporan per Kegiatan setelah LPJ disahkan Kaprodi, dan Laporan Periode pada akhir masa kepengurusan. Dosen Pembina dapat menyunting serta menerbitkan ringkasan naratif resmi, sementara Kaprodi memantau kepatuhan deviasi."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Ekspor Laporan (PDF)
            </button>
            <button
              onClick={handleExportExcel}
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor Data (Excel)
            </button>
          </div>
        }
      />

      {toastMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* KPI Stats Symmetrical Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Proker Terlaksana"
          value={`${persentaseTerlaksana}%`}
          subtitle={`${prokerTerlaksana} dari ${totalProker} Program Kerja`}
          icon={<Calendar size={18} />}
        />
        <StatCard
          title="Tingkat Penyerapan"
          value={`${persentaseSerapan}%`}
          subtitle={`${formatRupiah(totalSerapan)} dari pagu ${formatRupiah(totalPagu)}`}
          icon={<Coins size={18} />}
        />
        <StatCard
          title="Deviasi Melebihi Ambang"
          value={criticalDeviationsCount}
          subtitle={`Ambang Batas Toleransi: ${thresholdPercent}%`}
          icon={<AlertTriangle size={18} />}
        />
        <StatCard
          title="Status Laporan Resmi"
          value={viewTab === 'KEGIATAN' ? (isPublished ? 'Terbit' : 'Draf Sistem') : (isTenurePublished ? 'Terbit Sah' : 'Draf Periode')}
          subtitle="Tinjauan Dosen Pembina"
          icon={<ShieldCheck size={18} />}
        />
      </div>

      {/* Tab Navigation: Laporan per Kegiatan vs Laporan Periode Kepengurusan */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs">
        <button
          onClick={() => setViewTab('KEGIATAN')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            viewTab === 'KEGIATAN'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Laporan per Kegiatan</span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700 border border-blue-200">
            Hasil Sah Kaprodi
          </span>
        </button>
        <button
          onClick={() => setViewTab('PERIODE')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            viewTab === 'PERIODE'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Laporan Periode Kepengurusan</span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700 border border-indigo-200">
            Siklus Akhir &amp; Narasi
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LAPORAN PER KEGIATAN                                    */}
      {/* ============================================================== */}
      {viewTab === 'KEGIATAN' && (
        <div className="space-y-6">
          {/* Activity Selector & Threshold Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Kegiatan:</span>
              <select
                value={selectedProkerId}
                onChange={(e) => handleSelectProker(e.target.value)}
                className="w-full sm:max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {mockHimpunanProkers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama_kegiatan} ({p.periode_kepengurusan})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs text-slate-500 font-medium">Batas Toleransi Deviasi:</span>
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800">
                <span>{thresholdPercent}%</span>
              </div>
            </div>
          </div>

          {/* 3-Way Triangulation Summary Cards */}
          {activeReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Anggaran Rencana (Proker) */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Rencana Program Kerja
                </span>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatRupiah(activeReport.anggaran_rencana)}
                </p>
                <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Linimasa Rencana:</span>
                  <span className="font-medium text-slate-800">{activeReport.jadwal_rencana}</span>
                </div>
              </div>

              {/* Card 2: Pengajuan Proposal */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">
                  2. Pengajuan Proposal
                </span>
                <p className="text-2xl font-bold text-indigo-700 tracking-tight">
                  {formatRupiah(activeProposal?.total_anggaran_proposal || activeReport.anggaran_rencana)}
                </p>
                <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Nomor Surat:</span>
                  <span className="font-mono text-slate-800">{activeProposal?.nomor_surat || '014/HMSI/PROP'}</span>
                </div>
              </div>

              {/* Card 3: Realisasi LPJ & Deviasi */}
              <div
                className={`rounded-xl border p-5 shadow-xs space-y-2 ${
                  activeReport.is_over_threshold
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    3. Realisasi LPJ
                  </span>
                  {activeReport.is_over_threshold ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                      Deviasi Kritis &gt; {thresholdPercent}%
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      Dalam Batas Toleransi
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatRupiah(activeReport.realisasi_biaya)}
                </p>
                <div className="text-xs pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Selisih Anggaran:</span>
                  <span
                    className={`font-bold ${
                      activeReport.deviasi_anggaran_persen > 0
                        ? 'text-amber-700'
                        : activeReport.deviasi_anggaran_persen < 0
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {activeReport.deviasi_anggaran_persen > 0 ? '+' : ''}
                    {formatRupiah(activeReport.deviasi_anggaran_nominal)} ({activeReport.deviasi_anggaran_persen}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Triangulation Table: Comparison per Pos Anggaran */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Perbandingan Selisih Anggaran per Pos (Nominal &amp; Persentase)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komparasi otomatis pos biaya antara Rencana Proker, Proposal Disahkan, dan Realisasi LPJ
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Pos Anggaran</th>
                    <th className="px-3.5 py-3">Kategori</th>
                    <th className="px-3.5 py-3 text-right">Rencana Proker</th>
                    <th className="px-3.5 py-3 text-right">Proposal Disetujui</th>
                    <th className="px-3.5 py-3 text-right">Realisasi LPJ</th>
                    <th className="px-3.5 py-3 text-right">Deviasi (Rp)</th>
                    <th className="px-3.5 py-3 text-right">Deviasi (%)</th>
                    <th className="px-3.5 py-3 text-center">Evaluasi Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeProker?.anggaran_per_pos.map((b) => {
                    const plan = b.anggaran_rencana;
                    const prop = b.anggaran_proposal || plan;
                    const real = b.realisasi_lpj || prop;
                    const diffNominal = real - plan;
                    const diffPercent = plan > 0 ? Number(((diffNominal / plan) * 100).toFixed(2)) : 0;
                    const isOver = Math.abs(diffPercent) > thresholdPercent;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-slate-900">{b.pos_anggaran}</td>
                        <td className="px-3.5 py-3 text-slate-500 text-[11px]">{b.kategori}</td>
                        <td className="px-3.5 py-3 text-right font-medium">{formatRupiah(plan)}</td>
                        <td className="px-3.5 py-3 text-right text-slate-600">{formatRupiah(prop)}</td>
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900">{formatRupiah(real)}</td>
                        <td className="px-3.5 py-3 text-right font-semibold">
                          <span className={diffNominal > 0 ? 'text-amber-700' : diffNominal < 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {diffNominal > 0 ? `+${formatRupiah(diffNominal)}` : diffNominal < 0 ? formatRupiah(diffNominal) : 'Rp 0'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold">
                          <span className={diffPercent > 0 ? 'text-amber-700' : diffPercent < 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {isOver ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              Deviasi Kritis
                            </span>
                          ) : diffNominal === 0 ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                              Sesuai Baseline
                            </span>
                          ) : diffNominal < 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Efisiensi
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Toleransi Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan={2} className="px-3.5 py-3 text-slate-800">
                      Total Akumulasi Kegiatan:
                    </td>
                    <td className="px-3.5 py-3 text-right">{formatRupiah(activeReport?.anggaran_rencana)}</td>
                    <td className="px-3.5 py-3 text-right text-slate-600">
                      {formatRupiah(activeProposal?.total_anggaran_proposal || activeReport?.anggaran_rencana)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-900">
                      {formatRupiah(activeReport?.realisasi_biaya)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-900">
                      {activeReport?.deviasi_anggaran_nominal ? `+${formatRupiah(activeReport.deviasi_anggaran_nominal)}` : 'Rp 0'}
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-900">
                      +{activeReport?.deviasi_anggaran_persen}%
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="text-[11px] font-semibold text-emerald-700">Tuntas</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Linimasa & Capaian Indikator Triangulation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linimasa & Keterlambatan */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Selisih Linimasa &amp; Kepatuhan LPJ</h3>
                <p className="text-xs text-slate-500 mt-0.5">Evaluasi pergeseran tanggal kegiatan dan batas 14 hari</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[11px]">Jadwal Rencana Awal:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{activeReport?.jadwal_rencana}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px]">Jadwal Pelaksanaan Riil:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{activeReport?.jadwal_realisasi}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[11px]">Pergeseran Hari Jadwal:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{activeReport?.deviasi_jadwal_hari} Hari</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px]">Kepatuhan Batas Waktu LPJ:</span>
                    <p
                      className={`font-bold mt-0.5 ${
                        activeReport?.hari_keterlambatan_lpj > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {activeReport?.hari_keterlambatan_lpj > 0
                        ? `Terlambat ${activeReport.hari_keterlambatan_lpj} Hari (Batas 14 Hari Lewat)`
                        : 'Tepat Waktu (< 14 Hari Kalender)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capaian Indikator */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Evaluasi Capaian Indikator Keberhasilan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Perbandingan target kuantitatif dan realisasi riil</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <span className="text-slate-500 text-[11px]">Target Indikator Program Kerja:</span>
                  <p className="font-medium text-slate-800 mt-1 leading-relaxed">
                    {activeProker?.indikator_keberhasilan}
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-200 p-3 bg-emerald-50/40">
                  <span className="text-emerald-800 font-semibold text-[11px]">Realisasi Capaian Terverifikasi:</span>
                  <p className="font-medium text-emerald-950 mt-1 leading-relaxed">
                    {activeReport?.capaian_indikator}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan Evaluasi Naratif Kegiatan */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Ringkasan Evaluasi Naratif Kegiatan
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dihasilkan otomatis oleh sistem sebagai draf, mencantumkan sumber data, dan dapat disunting oleh dosen pembina sebelum diterbitkan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPublished ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Diterbitkan Resmi
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Draf Otomatis Sistem
                  </span>
                )}
              </div>
            </div>

            {/* Source provenance alert */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-center justify-between">
              <span>
                <strong>Sumber Data:</strong> Proker: <code className="font-mono text-slate-800">{activeProker?.nama_kegiatan}</code> &bull; Proposal: <code className="font-mono text-slate-800">{activeProposal?.nomor_surat || '-'}</code> &bull; Realisasi LPJ: <code className="font-mono text-slate-800">{formatRupiah(activeReport?.realisasi_biaya)}</code>
              </span>
              <span className="text-slate-400">Algoritma Triangulasi Mutu SIMPRO</span>
            </div>

            {/* Narrative Box */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editableNarrative}
                  onChange={(e) => setEditableNarrative(e.target.value)}
                  className="w-full rounded-lg border border-blue-300 p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveNarrative}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 inline-flex items-center gap-1 shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Simpan &amp; Terbitkan Ringkasan Resmi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50/70 p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {editableNarrative}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 italic">
                    {isPublished
                      ? 'Ringkasan naratif telah disahkan dan disunting oleh Dosen Pembina Himpunan.'
                      : 'Draf otomatis sistem. Dosen Pembina dapat menyunting teks sebelum penerbitan resmi.'}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Sunting Ringkasan Evaluasi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LAPORAN PERIODE KEPENGURUSAN                            */}
      {/* ============================================================== */}
      {viewTab === 'PERIODE' && (
        <div className="space-y-6">
          {/* Tenure Period Header Banner */}
          <div className="rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 border border-indigo-200 mb-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Laporan Akuntabilitas Akhir Masa Jabatan
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Himpunan Mahasiswa Sistem Informasi (HIMASIFO) — Periode 2026/2027
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Laporan ini otomatis dibangkitkan sistem pada akhir periode kepengurusan, mengonsolidasikan seluruh realisasi program kerja, serapan anggaran mandiri, dan tingkat kepatuhan regulasi.
                </p>
              </div>

              {/* Threshold Controller for Kaprodi */}
              <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-2xs flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-indigo-600" />
                  Ambang Deviasi Kaprodi:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={thresholdPercent}
                    onChange={(e) => setThresholdPercent(Number(e.target.value))}
                    className="w-24 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    &gt; {thresholdPercent}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {criticalDeviationsCount} kegiatan di atas toleransi
                </span>
              </div>
            </div>
          </div>

          {/* Aggregated Program Kerja Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Kinerja &amp; Deviasi Seluruh Program Kerja
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemantauan komprehensif realisasi biaya, jadwal, dan kepatuhan pengumpulan LPJ
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3">Nama Program Kerja</th>
                    <th className="px-3.5 py-3">Status Pelaksanaan</th>
                    <th className="px-3.5 py-3 text-right">Pagu Rencana</th>
                    <th className="px-3.5 py-3 text-right">Realisasi LPJ</th>
                    <th className="px-3.5 py-3 text-right">Deviasi (Rp)</th>
                    <th className="px-3.5 py-3 text-right">Deviasi (%)</th>
                    <th className="px-3.5 py-3 text-center">Kepatuhan LPJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reports.map((r) => {
                    const isExceeding = Math.abs(r.deviasi_anggaran_persen) > thresholdPercent;
                    return (
                      <tr key={r.proker_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-slate-900">
                          {r.nama_kegiatan}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            SELESAI
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-medium">{formatRupiah(r.anggaran_rencana)}</td>
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900">{formatRupiah(r.realisasi_biaya)}</td>
                        <td className="px-3.5 py-3 text-right font-semibold">
                          <span className={r.deviasi_anggaran_nominal > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                            {r.deviasi_anggaran_nominal > 0 ? `+${formatRupiah(r.deviasi_anggaran_nominal)}` : formatRupiah(r.deviasi_anggaran_nominal)}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold">
                          <span className={isExceeding ? 'text-rose-700 font-extrabold' : 'text-slate-700'}>
                            {r.deviasi_anggaran_persen > 0 ? `+${r.deviasi_anggaran_persen}%` : `${r.deviasi_anggaran_persen}%`}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {r.hari_keterlambatan_lpj > 0 ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              Terlambat {r.hari_keterlambatan_lpj} Hari
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Tepat Waktu
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan={2} className="px-3.5 py-3 text-slate-800">
                      Total Periode Kepengurusan (HIMASIFO 2026/2027):
                    </td>
                    <td className="px-3.5 py-3 text-right">{formatRupiah(totalPagu)}</td>
                    <td className="px-3.5 py-3 text-right text-slate-900">{formatRupiah(totalSerapan)}</td>
                    <td className="px-3.5 py-3 text-right text-slate-900">
                      +{formatRupiah(totalSerapan - totalPagu)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-900">
                      {persentaseSerapan}% Serapan
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="text-[11px] font-semibold text-emerald-700">Akuntabel</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Ringkasan Evaluasi Naratif Periode Kepengurusan */}
          <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Ringkasan Evaluasi Naratif Periode Kepengurusan
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem SIMPRO menyusun draf ringkasan naratif secara otomatis. Dosen Pembina menyunting dan menerbitkan laporan resmi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isTenurePublished ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Laporan Periode Terbit Sah
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Draf Otomatis Sistem
                  </span>
                )}
              </div>
            </div>

            {/* Metadata provenance */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-center justify-between">
              <span>
                <strong>Metadata Laporan:</strong> Periode Kepengurusan: <code className="font-mono text-slate-800">2026/2027</code> &bull; Total Proker: <code className="font-mono text-slate-800">{totalProker}</code> &bull; Realisasi LPJ Sah: <code className="font-mono text-slate-800">{mockHimpunanLpjs.length} Berkas</code>
              </span>
              <span className="text-slate-400">Algoritma Evaluasi Tahunan SIMPRO</span>
            </div>

            {/* Narrative Box */}
            {isEditingTenure ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={tenureNarrative}
                  onChange={(e) => setTenureNarrative(e.target.value)}
                  className="w-full rounded-lg border border-indigo-300 p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditingTenure(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveTenureNarrative}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 inline-flex items-center gap-1 shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Sahkan &amp; Terbitkan Laporan Periode Resmi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50/70 p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {tenureNarrative}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 italic">
                    {isTenurePublished
                      ? 'Laporan evaluasi periode resmi telah disahkan oleh Dosen Pembina Himpunan dan diarsipkan untuk akreditasi prodi.'
                      : 'Draf otomatis disusun oleh sistem. Dosen Pembina dapat menyunting teks sebelum penerbitan resmi.'}
                  </span>
                  <button
                    onClick={() => setIsEditingTenure(true)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Sunting &amp; Terbitkan Laporan Periode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

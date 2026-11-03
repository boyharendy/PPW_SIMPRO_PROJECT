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
  const [selectedProkerId, setSelectedProkerId] = useState<string>('proker-1');
  const [thresholdPercent, setThresholdPercent] = useState<number>(15); // Ambang batas deviasi prodi
  const [reports, setReports] = useState<HimpunanDeviationReport[]>(mockHimpunanDeviationReports);

  // Active Report
  const activeReport = reports.find((r) => r.proker_id === selectedProkerId) || reports[0];
  const activeProker = mockHimpunanProkers.find((p) => p.id === selectedProkerId);
  const activeProposal = mockHimpunanProposals.find((p) => p.proker_id === selectedProkerId);
  const activeLpj = mockHimpunanLpjs.find((l) => l.proker_id === selectedProkerId);

  // Editable Narrative State (FR-22 & NF-14)
  const [editableNarrative, setEditableNarrative] = useState(
    activeReport?.ringkasan_evaluasi_disunting || activeReport?.ringkasan_evaluasi_draf || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isPublished, setIsPublished] = useState(activeReport?.is_diterbitkan || false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When selected proker changes, update narrative
  const handleSelectProker = (id: string) => {
    setSelectedProkerId(id);
    const r = reports.find((rep) => rep.proker_id === id);
    if (r) {
      setEditableNarrative(r.ringkasan_evaluasi_disunting || r.ringkasan_evaluasi_draf || '');
      setIsPublished(r.is_diterbitkan);
      setIsEditing(false);
    }
  };

  // Save edited narrative
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
    setToastMessage('Ringkasan evaluasi resmi berhasil disimpan dan diterbitkan oleh Dosen Pembina.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Export handlers
  const handleExportPDF = () => {
    setToastMessage('Laporan Evaluasi Program Kerja (PDF) sedang di-generate...');
    setTimeout(() => setToastMessage('Unduhan PDF Laporan Evaluasi Proker berhasil dibuat.'), 2000);
  };

  const handleExportExcel = () => {
    setToastMessage('Data Analisis Deviasi (Excel) berhasil diunduh.');
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
        title="Analisis Kesesuaian &amp; Ringkasan Evaluasi Proker (FR-21 &amp; FR-22)"
        description="Sistem membandingkan otomatis data Program Kerja, Proposal, dan LPJ untuk setiap kegiatan: selisih anggaran per pos, selisih sumber dana, pergeseran linimasa jadwal, capaian indikator, dan keterlambatan pengumpulan LPJ. Ringkasan naratif otomatis dihasilkan sebagai draf dan dapat disunting dosen pembina sebelum diterbitkan (NF-14)."
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
          icon="Calendar"
        />
        <StatCard
          title="Tingkat Penyerapan"
          value={`${persentaseSerapan}%`}
          subtitle={`${formatRupiah(totalSerapan)} dari pagu ${formatRupiah(totalPagu)}`}
          icon="Coins"
        />
        <StatCard
          title="Deviasi Melebihi Ambang"
          value={criticalDeviationsCount}
          subtitle={`Ambang Batas Toleransi: ${thresholdPercent}%`}
          icon="AlertTriangle"
        />
        <StatCard
          title="Status Ringkasan Evaluasi"
          value={isPublished ? 'Diterbitkan Resmi' : 'Draf Otomatis'}
          subtitle="Tinjauan Dosen Pembina (NF-14)"
          icon="ShieldCheck"
        />
      </div>

      {/* Control Strip: Activity Selector & Threshold Configuration */}
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

      {/* 3-Way Triangulation Comparison Summary Cards */}
      {activeReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Anggaran Rencana (Proker) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Rencana Program Kerja (FR-17)
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
              2. Pengajuan Proposal (FR-18)
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
                3. Realisasi LPJ (FR-19)
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

      {/* Triangulation Table: Comparison per Pos Anggaran (FR-21) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Perbandingan Selisih Anggaran per Pos (Nominal &amp; Persentase - FR-21)
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
            <p className="text-xs text-slate-500 mt-0.5">Evaluasi pergeseran tanggal kegiatan dan tenggat LPJ</p>
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
                <span className="text-slate-500 text-[11px]">Keterlambatan Pengumpulan LPJ:</span>
                <p
                  className={`font-bold mt-0.5 ${
                    activeReport?.hari_keterlambatan_lpj > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {activeReport?.hari_keterlambatan_lpj > 0
                    ? `Terlambat ${activeReport.hari_keterlambatan_lpj} Hari`
                    : 'Tepat Waktu'}
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

      {/* Ringkasan Evaluasi Naratif (FR-22 & NF-14) */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Ringkasan Evaluasi Naratif Program Kerja (FR-22 &amp; NF-14)
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
                Draf Otomatis Sistem (NF-14)
              </span>
            )}
          </div>
        </div>

        {/* Source provenance alert (NF-14 compliance) */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-center justify-between">
          <span>
            <strong>Sumber Data Otomasi:</strong> Proker ID: <code className="font-mono text-slate-800">{selectedProkerId}</code> &bull; Proposal ID: <code className="font-mono text-slate-800">{activeProposal?.id || '-'}</code> &bull; LPJ ID: <code className="font-mono text-slate-800">{activeLpj?.id || '-'}</code>
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
            <div className="rounded-lg bg-slate-50/70 p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
              {editableNarrative}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 italic">
                {isPublished
                  ? 'Ringkasan naratif telah disahkan dan disunting oleh Dosen Pembina Himpunan.'
                  : 'Klik tombol sunting di samping untuk menyempurnakan narasi evaluasi sebelum diterbitkan.'}
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
  );
}

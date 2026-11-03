'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  PlusCircle,
  FileText,
  Search,
  Filter,
  DollarSign,
  Layers,
  Trash2,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Building,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import {
  mockHimpunanProkers,
} from '@/lib/mock-data';
import {
  HimpunanProker,
  HimpunanBudgetLine,
  HimpunanFundingSource,
  HimpunanBudgetCategory,
  HimpunanFundingType,
} from '@/lib/types';
import { formatRupiah, formatDateShort } from '@/lib/utils';

const BUDGET_CATEGORIES: { value: HimpunanBudgetCategory; label: string }[] = [
  { value: 'OPERASIONAL', label: 'Operasional & Kesekretariatan' },
  { value: 'KONSUMSI', label: 'Konsumsi' },
  { value: 'PERLENGKAPAN', label: 'Perlengkapan & Sewa Alat' },
  { value: 'PUBLIKASI_DOKUMENTASI', label: 'Publikasi & Dokumentasi' },
  { value: 'HADIAH_HONOR', label: 'Hadiah, Plakat & Honor Pemateri' },
  { value: 'LAINNYA', label: 'Lain-lain' },
];

const FUNDING_SOURCES: { value: HimpunanFundingType; label: string }[] = [
  { value: 'DANA_PRODI', label: 'Anggaran Dana Prodi' },
  { value: 'IURAN_PESERTA', label: 'Iuran Pendaftaran Peserta' },
  { value: 'SPONSOR', label: 'Sponsorship / Kemitraan' },
  { value: 'USAHA_DANA', label: 'Usaha Dana (Danus)' },
  { value: 'KAS_HIMPUNAN', label: 'Kas Internal Himpunan' },
];

export default function HimpunanProkerPage() {
  const { currentRole } = useUser();
  const [prokers, setProkers] = useState<HimpunanProker[]>(mockHimpunanProkers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProkerDetail, setSelectedProkerDetail] = useState<HimpunanProker | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    tujuan: '',
    indikator_keberhasilan: '',
    periode_kepengurusan: '2024/2025',
    tanggal_rencana_mulai: '',
    tanggal_rencana_selesai: '',
  });

  const [budgetLines, setBudgetLines] = useState<Array<{ pos: string; kategori: HimpunanBudgetCategory; nominal: number }>>([
    { pos: '', kategori: 'OPERASIONAL', nominal: 0 },
  ]);

  const [fundingSources, setFundingSources] = useState<Array<{ sumber: HimpunanFundingType; nominal: number }>>([
    { sumber: 'DANA_PRODI', nominal: 0 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // Calculations
  const totalAnggaran = budgetLines.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalSumberDana = fundingSources.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const selisihDana = totalSumberDana - totalAnggaran;

  // Add & Remove rows
  const handleAddBudgetLine = () => {
    setBudgetLines([...budgetLines, { pos: '', kategori: 'OPERASIONAL', nominal: 0 }]);
  };

  const handleRemoveBudgetLine = (index: number) => {
    if (budgetLines.length <= 1) return;
    setBudgetLines(budgetLines.filter((_, i) => i !== index));
  };

  const handleAddFundingSource = () => {
    setFundingSources([...fundingSources, { sumber: 'SPONSOR', nominal: 0 }]);
  };

  const handleRemoveFundingSource = (index: number) => {
    if (fundingSources.length <= 1) return;
    setFundingSources(fundingSources.filter((_, i) => i !== index));
  };

  // Submit Handler with NF-07 Validation
  const handleSubmitProker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nama_kegiatan.trim()) {
      setFormError('Nama kegiatan wajib diisi.');
      return;
    }
    if (!formData.tujuan.trim()) {
      setFormError('Tujuan program kerja wajib diisi.');
      return;
    }
    if (!formData.indikator_keberhasilan.trim()) {
      setFormError('Indikator keberhasilan wajib diisi.');
      return;
    }
    if (!formData.tanggal_rencana_mulai || !formData.tanggal_rencana_selesai) {
      setFormError('Jadwal rencana tanggal mulai dan selesai wajib diisi.');
      return;
    }

    // NF-07: Rincian anggaran wajib diisi; program kerja tidak dapat dikirim tanpa anggaran
    const validBudgetLines = budgetLines.filter((b) => b.pos.trim() !== '' && b.nominal > 0);
    if (validBudgetLines.length === 0 || totalAnggaran <= 0) {
      setFormError('Sesuai aturan SKPL (NF-07), rincian anggaran wajib diisi dan total anggaran harus lebih besar dari 0.');
      return;
    }

    const validFunding = fundingSources.filter((f) => f.nominal > 0);
    if (validFunding.length === 0 || totalSumberDana <= 0) {
      setFormError('Rencana sumber dana wajib diisi minimal 1 pos sumber dana dengan nominal > 0.');
      return;
    }

    const newProker: HimpunanProker = {
      id: `proker-${Date.now()}`,
      nama_kegiatan: formData.nama_kegiatan,
      tujuan: formData.tujuan,
      indikator_keberhasilan: formData.indikator_keberhasilan,
      periode_kepengurusan: formData.periode_kepengurusan,
      tanggal_rencana_mulai: formData.tanggal_rencana_mulai,
      tanggal_rencana_selesai: formData.tanggal_rencana_selesai,
      total_anggaran_rencana: totalAnggaran,
      anggaran_per_pos: validBudgetLines.map((b, idx) => ({
        id: `pos-${idx + 1}`,
        pos_anggaran: b.pos,
        kategori: b.kategori,
        anggaran_rencana: b.nominal,
      })),
      sumber_dana: validFunding.map((f, idx) => ({
        id: `src-${idx + 1}`,
        sumber: f.sumber,
        rencana_nominal: f.nominal,
      })),
      status: 'TERDAFTAR',
      created_at: new Date().toISOString(),
    };

    setProkers([newProker, ...prokers]);
    setIsCreateModalOpen(false);
    setIsSuccessAlert(true);
    setTimeout(() => setIsSuccessAlert(false), 5000);

    // Reset Form
    setFormData({
      nama_kegiatan: '',
      tujuan: '',
      indikator_keberhasilan: '',
      periode_kepengurusan: '2024/2025',
      tanggal_rencana_mulai: '',
      tanggal_rencana_selesai: '',
    });
    setBudgetLines([{ pos: '', kategori: 'OPERASIONAL', nominal: 0 }]);
    setFundingSources([{ sumber: 'DANA_PRODI', nominal: 0 }]);
  };

  // Filter Data
  const filteredProkers = prokers.filter((p) => {
    const matchSearch =
      p.nama_kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.indikator_keberhasilan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPeriod = selectedPeriod === 'ALL' || p.periode_kepengurusan === selectedPeriod;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchPeriod && matchStatus;
  });

  const columns: DataTableColumn<HimpunanProker>[] = [
    {
      key: 'nama_kegiatan',
      header: 'Program Kerja & Tujuan',
      render: (row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{row.nama_kegiatan}</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{row.tujuan}</p>
          <span className="inline-block mt-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Target: {row.indikator_keberhasilan}
          </span>
        </div>
      ),
    },
    {
      key: 'periode_kepengurusan',
      header: 'Periode & Jadwal',
      render: (row) => (
        <div className="whitespace-nowrap text-xs">
          <span className="font-semibold text-slate-800">{row.periode_kepengurusan}</span>
          <p className="text-slate-500 text-[11px] mt-0.5">
            {formatDateShort(row.tanggal_rencana_mulai)} s.d. {formatDateShort(row.tanggal_rencana_selesai)}
          </p>
        </div>
      ),
    },
    {
      key: 'total_anggaran_rencana',
      header: 'Pagu Rencana & Pos',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_anggaran_rencana)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.anggaran_per_pos.length} Pos Terinci</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Siklus',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedProkerDetail(row)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            title="Lihat Rincian Pos Anggaran & Sumber Dana"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'TERDAFTAR' && (
            <Link
              href={`/dashboard/himpunan/proposal?proker_id=${row.id}`}
              className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1"
            >
              Ajukan Proposal
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {row.status === 'PROPOSAL_DISETUJUI' && (
            <Link
              href={`/dashboard/himpunan/lpj?proker_id=${row.id}`}
              className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center gap-1"
            >
              Unggah LPJ
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input & Manajemen Program Kerja (FR-17)"
        description="Sistem memungkinkan pengurus himpunan mencantumkan program kerja per periode kepengurusan lengkap dengan nama kegiatan, tujuan, indikator capaian, jadwal linimasa, serta rincian pos anggaran dan sumber dana wajib (NF-07)."
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Input Program Kerja Baru
          </button>
        }
      />

      {isSuccessAlert && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Berhasil!</strong> Program kerja baru telah dicatat ke sistem dan siap untuk diajukan proposalnya.
            </span>
          </div>
          <button onClick={() => setIsSuccessAlert(false)} className="text-emerald-700 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama kegiatan atau target capaian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Periode Kepengurusan</option>
              <option value="2024/2025">Periode 2024/2025</option>
              <option value="2023/2024">Periode 2023/2024</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Status Siklus</option>
              <option value="TERDAFTAR">Terdaftar (Menunggu Proposal)</option>
              <option value="PROPOSAL_DIAJUKAN">Proposal Diajukan</option>
              <option value="PROPOSAL_DISETUJUI">Proposal Disetujui</option>
              <option value="LPJ_DIAJUKAN">LPJ Diajukan</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredProkers}
        emptyMessage="Tidak ada program kerja yang sesuai filter"
      />

      {/* Modal 1: Create Proker (FR-17 & NF-07 Compliance) */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Formulir Input Program Kerja Himpunan (FR-17)"
        size="lg"
      >
        <form onSubmit={handleSubmitProker} className="space-y-5 text-xs">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Program Kerja Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SI-Fest 2025: National IT Competition & Expo"
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Periode Kepengurusan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.periode_kepengurusan}
                onChange={(e) => setFormData({ ...formData, periode_kepengurusan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_rencana_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_rencana_mulai: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rencana Selesai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal_rencana_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_rencana_selesai: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Tujuan Kegiatan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Jelaskan tujuan strategis dan manfaat kegiatan bagi mahasiswa prodi..."
                value={formData.tujuan}
                onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Indikator Keberhasilan (Target Capaian) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Diikuti minimal 150 tim dari 15 PT, 300 pengunjung, publikasi media..."
                value={formData.indikator_keberhasilan}
                onChange={(e) => setFormData({ ...formData, indikator_keberhasilan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Rincian Anggaran Per Pos (Mandatory NF-07) */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Rincian Anggaran per Pos Biaya <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Wajib diisi; sistem tidak memperbolehkan pengiriman proker tanpa rincian anggaran (NF-07).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBudgetLine}
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pos
              </button>
            </div>

            <div className="space-y-2">
              {budgetLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama Pos (mis. Sewa Sound, Hadiah, Konsumsi)"
                    value={line.pos}
                    onChange={(e) => {
                      const updated = [...budgetLines];
                      updated[idx].pos = e.target.value;
                      setBudgetLines(updated);
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={line.kategori}
                    onChange={(e) => {
                      const updated = [...budgetLines];
                      updated[idx].kategori = e.target.value as HimpunanBudgetCategory;
                      setBudgetLines(updated);
                    }}
                    className="w-48 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {BUDGET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="Nominal (Rp)"
                    value={line.nominal || ''}
                    onChange={(e) => {
                      const updated = [...budgetLines];
                      updated[idx].nominal = Number(e.target.value) || 0;
                      setBudgetLines(updated);
                    }}
                    className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-right font-medium focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBudgetLine(idx)}
                    disabled={budgetLines.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Total Pagu Rencana Anggaran:</span>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(totalAnggaran)}</span>
            </div>
          </div>

          {/* Section: Rencana Sumber Dana */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-blue-600" />
                  Rencana Sumber Dana <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tentukan rencana asal pembiayaan untuk menutupi kebutuhan anggaran kegiatan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFundingSource}
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Sumber
              </button>
            </div>

            <div className="space-y-2">
              {fundingSources.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={f.sumber}
                    onChange={(e) => {
                      const updated = [...fundingSources];
                      updated[idx].sumber = e.target.value as HimpunanFundingType;
                      setFundingSources(updated);
                    }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {FUNDING_SOURCES.map((src) => (
                      <option key={src.value} value={src.value}>
                        {src.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="Nominal (Rp)"
                    value={f.nominal || ''}
                    onChange={(e) => {
                      const updated = [...fundingSources];
                      updated[idx].nominal = Number(e.target.value) || 0;
                      setFundingSources(updated);
                    }}
                    className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-right font-medium focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFundingSource(idx)}
                    disabled={fundingSources.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Total Rencana Sumber Dana:</span>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(totalSumberDana)}</span>
            </div>

            {/* Balance check notification */}
            <div
              className={`rounded-lg p-2.5 text-[11px] flex items-center justify-between border ${
                selisihDana === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : selisihDana > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span>
                Status Keseimbangan Anggaran:{' '}
                <strong>
                  {selisihDana === 0
                    ? 'Seimbang (Kebutuhan & Sumber Sesuai)'
                    : selisihDana > 0
                    ? `Surplus Pendanaan (${formatRupiah(selisihDana)})`
                    : `Defisit Pendanaan (${formatRupiah(Math.abs(selisihDana))})`}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Simpan &amp; Terbitkan Program Kerja
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Detail Proker */}
      {selectedProkerDetail && (
        <Modal
          open={Boolean(selectedProkerDetail)}
          onClose={() => setSelectedProkerDetail(null)}
          title={`Rincian Lengkap: ${selectedProkerDetail.nama_kegiatan}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Periode</span>
                <span className="font-bold text-slate-800">{selectedProkerDetail.periode_kepengurusan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Jadwal Rencana</span>
                <span className="font-semibold text-slate-800">
                  {formatDateShort(selectedProkerDetail.tanggal_rencana_mulai)} -{' '}
                  {formatDateShort(selectedProkerDetail.tanggal_rencana_selesai)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Anggaran</span>
                <span className="font-bold text-blue-700">
                  {formatRupiah(selectedProkerDetail.total_anggaran_rencana)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status Siklus</span>
                <StatusBadge status={selectedProkerDetail.status} size="sm" />
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">Tujuan Program Kerja:</h5>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedProkerDetail.tujuan}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 mb-1">Indikator Keberhasilan:</h5>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedProkerDetail.indikator_keberhasilan}
              </p>
            </div>

            {/* Pos Anggaran Table */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Rincian Pos Anggaran (FR-17):</h5>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Rencana Proker</th>
                      <th className="px-3 py-2 text-right">Proposal Disahkan</th>
                      <th className="px-3 py-2 text-right">Realisasi LPJ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProkerDetail.anggaran_per_pos.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{b.pos_anggaran}</td>
                        <td className="px-3 py-2 text-slate-600 text-[11px]">{b.kategori}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatRupiah(b.anggaran_rencana)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {b.anggaran_proposal ? formatRupiah(b.anggaran_proposal) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900 font-semibold">
                          {b.realisasi_lpj ? formatRupiah(b.realisasi_lpj) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sumber Dana Table */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Rencana Sumber Dana:</h5>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sumber Pendanaan</th>
                      <th className="px-3 py-2 text-right">Rencana Nominal</th>
                      <th className="px-3 py-2 text-right">Realisasi Diterima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProkerDetail.sumber_dana.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{s.sumber.replace('_', ' ')}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatRupiah(s.rencana_nominal)}</td>
                        <td className="px-3 py-2 text-right text-slate-900 font-semibold">
                          {s.realisasi_nominal ? formatRupiah(s.realisasi_nominal) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProkerDetail(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

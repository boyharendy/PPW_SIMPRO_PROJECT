'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Upload,
  Calendar,
  Receipt,
  Users,
  FileCheck,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import {
  mockHimpunanProposals,
  mockHimpunanLpjs,
} from '@/lib/mock-data';
import {
  HimpunanLpj,
  HimpunanBudgetLine,
  HimpunanFundingSource,
} from '@/lib/types';
import { formatRupiah, formatDateShort, formatDateTime } from '@/lib/utils';

export default function HimpunanLpjPage() {
  const { currentRole } = useUser();
  const [lpjs, setLpjs] = useState<HimpunanLpj[]>(mockHimpunanLpjs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedLpjDetail, setSelectedLpjDetail] = useState<HimpunanLpj | null>(null);

  // Form State
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [jumlahPeserta, setJumlahPeserta] = useState<number>(0);
  const [capaianIndikator, setCapaianIndikator] = useState('');
  const [kuitansiCount, setKuitansiCount] = useState<number>(1);
  const [berkasFileName, setBerkasFileName] = useState('');
  const [formBudgetLines, setFormBudgetLines] = useState<HimpunanBudgetLine[]>([]);
  const [formFundingSources, setFormFundingSources] = useState<HimpunanFundingSource[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // When Proposal is selected, populate budget lines
  const handleSelectProposal = (propId: string) => {
    setSelectedProposalId(propId);
    const found = mockHimpunanProposals.find((p) => p.id === propId);
    if (found) {
      setFormBudgetLines(
        found.anggaran_per_pos.map((b) => ({
          ...b,
          realisasi_lpj: b.anggaran_proposal || b.anggaran_rencana,
        }))
      );
      setFormFundingSources(
        found.sumber_dana.map((s) => ({
          ...s,
          realisasi_nominal: s.rencana_nominal,
        }))
      );
    }
  };

  const totalBiayaRealisasi = formBudgetLines.reduce(
    (acc, b) => acc + (b.realisasi_lpj || 0),
    0
  );
  const totalDanaDiterima = formFundingSources.reduce(
    (acc, s) => acc + (s.realisasi_nominal || 0),
    0
  );

  const handleSubmitLpj = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProposalId) {
      setFormError('Pilih proposal kegiatan yang telah disetujui terlebih dahulu.');
      return;
    }
    if (!tglMulai || !tglSelesai) {
      setFormError('Tanggal pelaksanaan mulai dan selesai wajib diisi.');
      return;
    }
    if (jumlahPeserta <= 0) {
      setFormError('Jumlah peserta realisasi harus lebih dari 0.');
      return;
    }
    if (!capaianIndikator.trim()) {
      setFormError('Capaian indikator keberhasilan wajib dilaporkan.');
      return;
    }
    if (totalBiayaRealisasi <= 0) {
      setFormError('Total realisasi biaya per pos wajib diisi dan lebih dari Rp 0 (NF-07).');
      return;
    }

    const propObj = mockHimpunanProposals.find((p) => p.id === selectedProposalId);

    // Calculate Tenggat: 14 hari pasca selesai kegiatan
    const endDate = new Date(tglSelesai);
    const deadlineDate = new Date(endDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const deadlineStr = deadlineDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const todayDate = new Date(todayStr);
    const diffTime = todayDate.getTime() - deadlineDate.getTime();
    const lateDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

    const newLpj: HimpunanLpj = {
      id: `lpj-${Date.now()}`,
      proker_id: propObj?.proker_id || 'proker-1',
      proposal_id: selectedProposalId,
      proker_nama: propObj?.proker_nama || 'Program Kerja',
      tanggal_pelaksanaan_mulai: tglMulai,
      tanggal_pelaksanaan_selesai: tglSelesai,
      jumlah_peserta_realisasi: jumlahPeserta,
      capaian_indikator: capaianIndikator,
      total_biaya_realisasi: totalBiayaRealisasi,
      total_dana_diterima: totalDanaDiterima,
      anggaran_per_pos: formBudgetLines,
      sumber_dana: formFundingSources,
      berkas_lpj_url: berkasFileName ? `/uploads/${berkasFileName}` : '/docs/lpj-kegiatan-final.pdf',
      bukti_kuitansi_count: kuitansiCount,
      tanggal_pengumpulan: todayStr,
      tenggat_pengumpulan: deadlineStr,
      hari_keterlambatan: lateDays,
      status: 'DIAJUKAN',
      created_at: new Date().toISOString(),
    };

    setLpjs([newLpj, ...lpjs]);
    setIsSubmitModalOpen(false);
    setIsSuccessAlert(true);
    setTimeout(() => setIsSuccessAlert(false), 5000);

    // Reset Form
    setSelectedProposalId('');
    setTglMulai('');
    setTglSelesai('');
    setJumlahPeserta(0);
    setCapaianIndikator('');
    setKuitansiCount(1);
    setBerkasFileName('');
    setFormBudgetLines([]);
    setFormFundingSources([]);
  };

  // Filter
  const filteredLpjs = lpjs.filter((l) => {
    const matchSearch =
      l.proker_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.capaian_indikator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const columns: DataTableColumn<HimpunanLpj>[] = [
    {
      key: 'proker_nama',
      header: 'Program Kerja & Pelaksanaan',
      render: (row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{row.proker_nama}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>
              Tgl: {formatDateShort(row.tanggal_pelaksanaan_mulai)} - {formatDateShort(row.tanggal_pelaksanaan_selesai)}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
              <Users className="h-3 w-3 text-blue-600" />
              {row.jumlah_peserta_realisasi} Peserta
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
            &quot;{row.capaian_indikator}&quot;
          </p>
        </div>
      ),
    },
    {
      key: 'total_biaya_realisasi',
      header: 'Realisasi Biaya & Kuitansi',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_biaya_realisasi)}</p>
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] text-slate-500">
            <Receipt className="h-3 w-3 text-emerald-600" />
            <span>{row.bukti_kuitansi_count} Bukti Sah</span>
          </div>
        </div>
      ),
    },
    {
      key: 'tanggal_pengumpulan',
      header: 'Tenggat & Kepatuhan',
      render: (row) => (
        <div className="whitespace-nowrap text-xs">
          <span className="font-semibold text-slate-800">
            Kumpul: {formatDateShort(row.tanggal_pengumpulan)}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Tenggat: {formatDateShort(row.tenggat_pengumpulan)}</p>
          {row.hari_keterlambatan > 0 ? (
            <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              Terlambat {row.hari_keterlambatan} Hari
            </span>
          ) : (
            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Tepat Waktu
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status LPJ',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
          <span className="block text-[10px] text-slate-400 mt-1">
            {row.status === 'DIAJUKAN'
              ? 'Tahap 1: Dosen Pembina'
              : row.status === 'DISETUJUI_PEMBINA'
              ? 'Tahap 2: Kaprodi'
              : row.status === 'DISETUJUI'
              ? 'LPJ Disahkan'
              : 'Revisi/Ditolak'}
          </span>
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
            onClick={() => setSelectedLpjDetail(row)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            title="Lihat Detail Realisasi LPJ & Deviasi"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Link
            href={`/dashboard/himpunan/analisis`}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1"
          >
            Analisis
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengunggahan LPJ &amp; Realisasi Biaya (FR-19)"
        description="Sistem memungkinkan pengunggahan Laporan Pertanggungjawaban (LPJ) yang terhubung ke proposal. Realisasi biaya per pos dan dana yang diterima per sumber wajib diisi terstruktur, beserta tanggal pelaksanaan, jumlah peserta, capaian indikator, bukti kuitansi bernomor, dan penghitungan keterlambatan otomatis."
        actions={
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Unggah LPJ Baru
          </button>
        }
      />

      {isSuccessAlert && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>LPJ Berhasil Diunggah!</strong> Realisasi biaya dan berkas bukti telah masuk ke antrean verifikasi Dosen Pembina (Tahap 1).
            </span>
          </div>
          <button onClick={() => setIsSuccessAlert(false)} className="text-emerald-700 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama proker atau indikator capaian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Status LPJ</option>
              <option value="DIAJUKAN">Diajukan (Menunggu Dosen Pembina)</option>
              <option value="DISETUJUI_PEMBINA">Disetujui Pembina (Menunggu Kaprodi)</option>
              <option value="DISETUJUI">Disetujui Kaprodi (Sah)</option>
              <option value="PERLU_REVISI">Perlu Revisi</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLpjs}
        emptyMessage="Tidak ada LPJ yang sesuai filter"
      />

      {/* Modal 1: Submit LPJ Form (FR-19 & NF-07 Compliance) */}
      <Modal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Formulir Pengunggahan LPJ Realisasi Kegiatan (FR-19)"
        size="lg"
      >
        <form onSubmit={handleSubmitLpj} className="space-y-5 text-xs">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Proposal Terkait yang Telah Disetujui <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedProposalId}
                onChange={(e) => handleSelectProposal(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Proposal Kegiatan --</option>
                {mockHimpunanProposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.proker_nama} ({p.nomor_surat}) - Pagu Proposal: {formatRupiah(p.total_anggaran_proposal)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pelaksanaan Aktual Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pelaksanaan Aktual Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tglSelesai}
                onChange={(e) => setTglSelesai(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Peserta Realisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                placeholder="Jumlah mahasiswa/peserta hadir"
                value={jumlahPeserta || ''}
                onChange={(e) => setJumlahPeserta(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Bukti Kuitansi Sah Dilampirkan <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={kuitansiCount || ''}
                onChange={(e) => setKuitansiCount(Number(e.target.value) || 1)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Capaian Indikator Keberhasilan Kegiatan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Uraikan perbandingan target proposal vs hasil riil lapangan..."
                value={capaianIndikator}
                onChange={(e) => setCapaianIndikator(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Unggah Berkas Bundel LPJ &amp; Dokumentasi (PDF/ZIP - NF-08) <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.zip,.docx"
                onChange={(e) => setBerkasFileName(e.target.files?.[0]?.name || '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Structured Realization Budget Table */}
          {formBudgetLines.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Rincian Realisasi Biaya per Pos (Wajib Diisi Terstruktur - NF-07)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Masukkan biaya aktual yang dikeluarkan berdasarkan bukti kuitansi sah bernomor.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Proposal Disetujui</th>
                      <th className="px-3 py-2 text-right w-44">Realisasi LPJ (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formBudgetLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{line.pos_anggaran}</td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{line.kategori}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {formatRupiah(line.anggaran_proposal || line.anggaran_rencana)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={line.realisasi_lpj || 0}
                            onChange={(e) => {
                              const updated = [...formBudgetLines];
                              updated[idx].realisasi_lpj = Number(e.target.value) || 0;
                              setFormBudgetLines(updated);
                            }}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-right font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-slate-700">
                        Total Biaya Realisasi:
                      </td>
                      <td className="px-3 py-2 text-right text-blue-700 font-bold">
                        {formatRupiah(totalBiayaRealisasi)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Structured Funding Received Table */}
          {formFundingSources.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dana yang Diterima per Sumber</h4>
                <p className="text-[11px] text-slate-500">
                  Laporkan dana riil yang berhasil dikumpulkan untuk menutup pengeluaran.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sumber Pendanaan</th>
                      <th className="px-3 py-2 text-right w-48">Nominal Diterima (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formFundingSources.map((src, idx) => (
                      <tr key={src.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{src.sumber.replace('_', ' ')}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={src.realisasi_nominal || 0}
                            onChange={(e) => {
                              const updated = [...formFundingSources];
                              updated[idx].realisasi_nominal = Number(e.target.value) || 0;
                              setFormFundingSources(updated);
                            }}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-right font-medium focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="px-3 py-2 text-right text-slate-700">Total Dana Diterima:</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-bold">
                        {formatRupiah(totalDanaDiterima)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Kirim LPJ ke Dosen Pembina
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: LPJ Detail View */}
      {selectedLpjDetail && (
        <Modal
          open={Boolean(selectedLpjDetail)}
          onClose={() => setSelectedLpjDetail(null)}
          title={`Detail LPJ: ${selectedLpjDetail.proker_nama}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Pelaksanaan</span>
                <span className="font-semibold text-slate-800">
                  {formatDateShort(selectedLpjDetail.tanggal_pelaksanaan_mulai)} -{' '}
                  {formatDateShort(selectedLpjDetail.tanggal_pelaksanaan_selesai)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Peserta Hadir</span>
                <span className="font-bold text-slate-900">{selectedLpjDetail.jumlah_peserta_realisasi} Orang</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Biaya Riil</span>
                <span className="font-bold text-emerald-700">
                  {formatRupiah(selectedLpjDetail.total_biaya_realisasi)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status LPJ</span>
                <StatusBadge status={selectedLpjDetail.status} size="sm" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 space-y-2 bg-white">
              <h5 className="font-bold text-slate-900">Capaian Indikator Keberhasilan:</h5>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                {selectedLpjDetail.capaian_indikator}
              </p>
            </div>

            {/* Kepatuhan & Keterlambatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="text-slate-500 block text-[11px]">Bukti Kuitansi Terlampir:</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedLpjDetail.bukti_kuitansi_count} Berkas Bukti Sah
                </p>
                <span className="text-[10px] text-slate-400">Tersimpan di: {selectedLpjDetail.berkas_lpj_url}</span>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <span className="text-slate-500 block text-[11px]">Kepatuhan Tenggat Pelaporan:</span>
                <div className="mt-1 flex items-center gap-2">
                  {selectedLpjDetail.hari_keterlambatan > 0 ? (
                    <span className="font-bold text-rose-700">
                      Terlambat {selectedLpjDetail.hari_keterlambatan} Hari dari Tenggat
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700">Tepat Waktu (Sebelum Tenggat)</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  Tenggat: {formatDateShort(selectedLpjDetail.tenggat_pengumpulan)}
                </span>
              </div>
            </div>

            {/* Stepper Approval Info */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
              <h5 className="font-bold text-slate-900">Jejak Verifikasi Bertingkat LPJ:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Tahap 1: Dosen Pembina</span>
                    {selectedLpjDetail.diverifikasi_pembina_at ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Disetujui
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  {selectedLpjDetail.catatan_pembina && (
                    <p className="mt-1.5 text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200 italic">
                      &quot;{selectedLpjDetail.catatan_pembina}&quot;
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Tahap 2: Ketua Program Studi</span>
                    {selectedLpjDetail.disetujui_kaprodi_at ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Disahkan
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        Belum Disahkan
                      </span>
                    )}
                  </div>
                  {selectedLpjDetail.catatan_kaprodi && (
                    <p className="mt-1.5 text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200 italic">
                      &quot;{selectedLpjDetail.catatan_kaprodi}&quot;
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLpjDetail(null)}
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

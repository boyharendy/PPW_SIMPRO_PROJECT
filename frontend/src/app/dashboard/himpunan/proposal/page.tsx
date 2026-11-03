'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Upload,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useUser } from '@/lib/context';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import {
  mockHimpunanProkers,
  mockHimpunanProposals,
} from '@/lib/mock-data';
import {
  HimpunanProposal,
  HimpunanProker,
  HimpunanBudgetLine,
  HimpunanFundingSource,
} from '@/lib/types';
import { formatRupiah, formatDateShort, formatDateTime } from '@/lib/utils';

export default function HimpunanProposalPage() {
  const { currentRole } = useUser();
  const [proposals, setProposals] = useState<HimpunanProposal[]>(mockHimpunanProposals);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<HimpunanProposal | null>(null);

  // Form State
  const [selectedProkerId, setSelectedProkerId] = useState<string>('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [berkasFileName, setBerkasFileName] = useState('');
  const [formBudgetLines, setFormBudgetLines] = useState<HimpunanBudgetLine[]>([]);
  const [formFundingSources, setFormFundingSources] = useState<HimpunanFundingSource[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // Handle Proker Selection in Form
  const handleSelectProker = (prokerId: string) => {
    setSelectedProkerId(prokerId);
    const found = mockHimpunanProkers.find((p) => p.id === prokerId);
    if (found) {
      setFormBudgetLines(
        found.anggaran_per_pos.map((b) => ({
          ...b,
          anggaran_proposal: b.anggaran_proposal || b.anggaran_rencana,
        }))
      );
      setFormFundingSources(
        found.sumber_dana.map((s) => ({
          ...s,
        }))
      );
    }
  };

  const totalAnggaranProposal = formBudgetLines.reduce(
    (acc, b) => acc + (b.anggaran_proposal || 0),
    0
  );
  const totalSumberProposal = formFundingSources.reduce(
    (acc, s) => acc + (s.rencana_nominal || 0),
    0
  );

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProkerId) {
      setFormError('Pilih program kerja yang terhubung terlebih dahulu.');
      return;
    }
    if (!nomorSurat.trim()) {
      setFormError('Nomor surat pengajuan proposal wajib diisi.');
      return;
    }
    if (totalAnggaranProposal <= 0) {
      setFormError('Rincian anggaran proposal terstruktur harus lebih besar dari Rp 0 (NF-07).');
      return;
    }

    const prokerObj = mockHimpunanProkers.find((p) => p.id === selectedProkerId);

    const newProposal: HimpunanProposal = {
      id: `prop-${Date.now()}`,
      proker_id: selectedProkerId,
      proker_nama: prokerObj?.nama_kegiatan || 'Program Kerja',
      nomor_surat: nomorSurat,
      tanggal_pengajuan: new Date().toISOString().split('T')[0],
      total_anggaran_proposal: totalAnggaranProposal,
      anggaran_per_pos: formBudgetLines,
      sumber_dana: formFundingSources,
      berkas_proposal_url: berkasFileName ? `/uploads/${berkasFileName}` : '/docs/proposal-kegiatan.pdf',
      status: 'DIAJUKAN',
      created_at: new Date().toISOString(),
    };

    setProposals([newProposal, ...proposals]);
    setIsSubmitModalOpen(false);
    setIsSuccessAlert(true);
    setTimeout(() => setIsSuccessAlert(false), 5000);

    // Reset Form
    setSelectedProkerId('');
    setNomorSurat('');
    setBerkasFileName('');
    setFormBudgetLines([]);
    setFormFundingSources([]);
  };

  // Filter
  const filteredProposals = proposals.filter((p) => {
    const matchSearch =
      p.proker_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomor_surat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const columns: DataTableColumn<HimpunanProposal>[] = [
    {
      key: 'proker_nama',
      header: 'Program Kerja & Nomor Surat',
      render: (row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{row.proker_nama}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {row.nomor_surat}
            </span>
            <span>&bull; Diajukan: {formatDateShort(row.tanggal_pengajuan)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'total_anggaran_proposal',
      header: 'Total Anggaran Proposal',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_anggaran_proposal)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.anggaran_per_pos.length} Pos Terstruktur</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Verifikasi Bertingkat',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
          <span className="block text-[10px] text-slate-400 mt-1">
            {row.status === 'DIAJUKAN'
              ? 'Tahap 1: Dosen Pembina'
              : row.status === 'DISETUJUI_PEMBINA'
              ? 'Tahap 2: Kaprodi'
              : row.status === 'DISETUJUI'
              ? 'Sah oleh Kaprodi'
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
            onClick={() => setSelectedProposalDetail(row)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            title="Lihat Rincian Isian Terstruktur & Catatan Verifikator"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'DISETUJUI' && (
            <Link
              href={`/dashboard/himpunan/lpj?proposal_id=${row.id}`}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1"
            >
              Lanjut LPJ
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
        title="Pengajuan Proposal Kegiatan (FR-18)"
        description="Sistem memungkinkan pengunggahan proposal yang terhubung langsung ke program kerja. Rincian anggaran per pos dan sumber dana wajib diisi dalam bentuk isian terstruktur (bukan hanya berkas PDF) agar dapat dibandingkan dan diverifikasi secara otomatis (NF-07)."
        actions={
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Ajukan Proposal Baru
          </button>
        }
      />

      {isSuccessAlert && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Proposal Berhasil Diajukan!</strong> Berkas dan rincian anggaran telah diteruskan ke meja verifikasi Dosen Pembina (Tahap 1).
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
              placeholder="Cari nama proker atau nomor surat proposal..."
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
              <option value="ALL">Semua Status Verifikasi</option>
              <option value="DIAJUKAN">Diajukan (Menunggu Dosen Pembina)</option>
              <option value="DISETUJUI_PEMBINA">Disetujui Pembina (Menunggu Kaprodi)</option>
              <option value="DISETUJUI">Disetujui Kaprodi (Final)</option>
              <option value="PERLU_REVISI">Perlu Revisi</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProposals}
        emptyMessage="Tidak ada proposal kegiatan yang sesuai filter"
      />

      {/* Modal 1: Submit Proposal with Structured Budget Form (FR-18) */}
      <Modal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Formulir Pengajuan Proposal Kegiatan Terstruktur (FR-18)"
        size="lg"
      >
        <form onSubmit={handleSubmitProposal} className="space-y-5 text-xs">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Program Kerja Terhubung <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedProkerId}
                onChange={(e) => handleSelectProker(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Program Kerja yang Terdaftar --</option>
                {mockHimpunanProkers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama_kegiatan} (Pagu Rencana: {formatRupiah(p.total_anggaran_rencana)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Surat Pengajuan Proposal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 025/HMSI/PROP/X/2024"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unggah Berkas Naskah Proposal (PDF/DOCX - NF-08) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setBerkasFileName(e.target.files?.[0]?.name || '')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Structured Budget Lines Section */}
          {formBudgetLines.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Rincian Anggaran Proposal Terstruktur (Bukan Hanya Berkas PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan nominal per pos anggaran proposal terhadap baseline program kerja awal.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Rencana Proker</th>
                      <th className="px-3 py-2 text-right w-44">Nominal Proposal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formBudgetLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{line.pos_anggaran}</td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{line.kategori}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{formatRupiah(line.anggaran_rencana)}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={line.anggaran_proposal || 0}
                            onChange={(e) => {
                              const updated = [...formBudgetLines];
                              updated[idx].anggaran_proposal = Number(e.target.value) || 0;
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
                        Total Anggaran Proposal:
                      </td>
                      <td className="px-3 py-2 text-right text-blue-700 font-bold">
                        {formatRupiah(totalAnggaranProposal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Structured Funding Sources Section */}
          {formFundingSources.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Rencana Sumber Dana Proposal Terstruktur</h4>
                <p className="text-[11px] text-slate-500">
                  Pastikan sumber dana mencukupi alokasi biaya pengajuan kegiatan.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sumber Pendanaan</th>
                      <th className="px-3 py-2 text-right w-48">Nominal Target Proposal (Rp)</th>
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
                            value={src.rencana_nominal || 0}
                            onChange={(e) => {
                              const updated = [...formFundingSources];
                              updated[idx].rencana_nominal = Number(e.target.value) || 0;
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
                      <td className="px-3 py-2 text-right text-slate-700">Total Sumber Dana:</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-bold">
                        {formatRupiah(totalSumberProposal)}
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
              Kirim Proposal ke Pembina
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Proposal Detail View */}
      {selectedProposalDetail && (
        <Modal
          open={Boolean(selectedProposalDetail)}
          onClose={() => setSelectedProposalDetail(null)}
          title={`Detail Proposal: ${selectedProposalDetail.proker_nama}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nomor Surat</span>
                <span className="font-mono font-bold text-slate-800">{selectedProposalDetail.nomor_surat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tgl Pengajuan</span>
                <span className="font-semibold text-slate-800">
                  {formatDateShort(selectedProposalDetail.tanggal_pengajuan)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Anggaran</span>
                <span className="font-bold text-blue-700">
                  {formatRupiah(selectedProposalDetail.total_anggaran_proposal)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status Persetujuan</span>
                <StatusBadge status={selectedProposalDetail.status} size="sm" />
              </div>
            </div>

            {/* Stepper Approval Info */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
              <h5 className="font-bold text-slate-900">Jejak Verifikasi Bertingkat (FR-20):</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Tahap 1: Dosen Pembina</span>
                    {selectedProposalDetail.diverifikasi_pembina_at ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Disetujui
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Menunggu
                      </span>
                    )}
                  </div>
                  {selectedProposalDetail.catatan_pembina && (
                    <p className="mt-1.5 text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200 italic">
                      &quot;{selectedProposalDetail.catatan_pembina}&quot;
                    </p>
                  )}
                  {selectedProposalDetail.diverifikasi_pembina_at && (
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Waktu: {formatDateTime(selectedProposalDetail.diverifikasi_pembina_at)}
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Tahap 2: Ketua Program Studi</span>
                    {selectedProposalDetail.disetujui_kaprodi_at ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Disahkan
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        Belum Disahkan
                      </span>
                    )}
                  </div>
                  {selectedProposalDetail.catatan_kaprodi && (
                    <p className="mt-1.5 text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200 italic">
                      &quot;{selectedProposalDetail.catatan_kaprodi}&quot;
                    </p>
                  )}
                  {selectedProposalDetail.disetujui_kaprodi_at && (
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Waktu: {formatDateTime(selectedProposalDetail.disetujui_kaprodi_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Structured Table */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Rincian Pos Anggaran Terstruktur:</h5>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Rencana Baseline</th>
                      <th className="px-3 py-2 text-right">Nominal Proposal</th>
                      <th className="px-3 py-2 text-right">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProposalDetail.anggaran_per_pos.map((b) => {
                      const prop = b.anggaran_proposal || b.anggaran_rencana;
                      const diff = prop - b.anggaran_rencana;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{b.pos_anggaran}</td>
                          <td className="px-3 py-2 text-slate-500 text-[11px]">{b.kategori}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{formatRupiah(b.anggaran_rencana)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatRupiah(prop)}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            <span className={diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-400'}>
                              {diff > 0 ? `+${formatRupiah(diff)}` : diff < 0 ? formatRupiah(diff) : '0'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Berkas: {selectedProposalDetail.berkas_proposal_url}</span>
              <button
                onClick={() => setSelectedProposalDetail(null)}
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

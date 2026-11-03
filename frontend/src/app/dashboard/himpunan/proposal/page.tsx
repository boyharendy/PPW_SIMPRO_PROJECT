'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
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
  Edit,
  History,
  ShieldCheck,
  RotateCcw,
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
  HimpunanBudgetLine,
  HimpunanFundingSource,
  HimpunanAuditLog,
} from '@/lib/types';
import { formatRupiah, formatDateShort, formatDateTime } from '@/lib/utils';

export default function HimpunanProposalPage() {
  const { currentRole, user } = useUser();
  const [proposals, setProposals] = useState<HimpunanProposal[]>(mockHimpunanProposals);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<HimpunanProposal | null>(null);
  const [revisingProposal, setRevisingProposal] = useState<HimpunanProposal | null>(null);

  // Form State (New Submission)
  const [selectedProkerId, setSelectedProkerId] = useState<string>('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [berkasFileName, setBerkasFileName] = useState('');
  const [formBudgetLines, setFormBudgetLines] = useState<HimpunanBudgetLine[]>([]);
  const [formFundingSources, setFormFundingSources] = useState<HimpunanFundingSource[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessAlert, setIsSuccessAlert] = useState<string | null>(null);

  // Form State (Revision Submission)
  const [revisionNotePengurus, setRevisionNotePengurus] = useState('');

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

  // Submit Handler: Pengajuan Awal (BPMN: Mengunggah proposal terstruktur)
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // BPMN & UC-12: Memvalidasi kelengkapan isian dan anggaran
    if (!selectedProkerId) {
      setFormError('Pilih program kerja yang terhubung terlebih dahulu.');
      return;
    }
    if (!nomorSurat.trim()) {
      setFormError('Nomor surat pengajuan proposal wajib diisi.');
      return;
    }
    if (totalAnggaranProposal <= 0) {
      setFormError('Rincian anggaran proposal terstruktur harus lebih besar dari Rp 0.');
      return;
    }

    const prokerObj = mockHimpunanProkers.find((p) => p.id === selectedProkerId);
    const nowIso = new Date().toISOString();

    const newAuditLog: HimpunanAuditLog = {
      id: `aud-${Date.now()}`,
      waktu: nowIso,
      aktor: user.nama_lengkap || 'Pengurus Himpunan',
      peran: currentRole,
      aksi: 'PENGAJUAN',
      status_sebelum: 'DRAF',
      status_sesudah: 'DIAJUKAN',
      catatan: 'Pengajuan proposal baru terstruktur oleh Pengurus Himpunan.',
    };

    const newProposal: HimpunanProposal = {
      id: `prop-${Date.now()}`,
      proker_id: selectedProkerId,
      proker_nama: prokerObj?.nama_kegiatan || 'Program Kerja',
      nomor_surat: nomorSurat,
      tanggal_pengajuan: nowIso.split('T')[0],
      total_anggaran_proposal: totalAnggaranProposal,
      anggaran_per_pos: formBudgetLines,
      sumber_dana: formFundingSources,
      berkas_proposal_url: berkasFileName ? `/uploads/${berkasFileName}` : '/docs/proposal-kegiatan.pdf',
      status: 'DIAJUKAN',
      nomor_revisi: 0,
      audit_trail: [newAuditLog],
      created_at: nowIso,
    };

    setProposals([newProposal, ...proposals]);
    setIsSubmitModalOpen(false);
    setIsSuccessAlert('Proposal berhasil diajukan dan diteruskan ke Dosen Pembina (Tahap 1).');
    setTimeout(() => setIsSuccessAlert(null), 5000);

    // Reset Form
    setSelectedProkerId('');
    setNomorSurat('');
    setBerkasFileName('');
    setFormBudgetLines([]);
    setFormFundingSources([]);
  };

  // Submit Handler: Pengajuan Revisi Proposal (BPMN: Mengunggah/merevisi proposal setelah Perlu Revisi)
  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingProposal) return;
    setFormError(null);

    if (totalAnggaranProposal <= 0) {
      setFormError('Rincian anggaran proposal terstruktur harus lebih besar dari Rp 0.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nextRevNum = (revisingProposal.nomor_revisi || 0) + 1;

    const revisionAuditLog: HimpunanAuditLog = {
      id: `aud-${Date.now()}`,
      waktu: nowIso,
      aktor: user.nama_lengkap || 'Pengurus Himpunan',
      peran: currentRole,
      aksi: 'REVISI_PENGAJUAN',
      status_sebelum: 'PERLU_REVISI',
      status_sesudah: 'DIAJUKAN',
      catatan: revisionNotePengurus || `Pengajuan perbaikan/revisi proposal ke-${nextRevNum}.`,
    };

    const updated = proposals.map((p) => {
      if (p.id === revisingProposal.id) {
        return {
          ...p,
          total_anggaran_proposal: totalAnggaranProposal,
          anggaran_per_pos: formBudgetLines,
          sumber_dana: formFundingSources,
          berkas_proposal_url: berkasFileName ? `/uploads/${berkasFileName}` : p.berkas_proposal_url,
          status: 'DIAJUKAN' as const,
          nomor_revisi: nextRevNum,
          audit_trail: [...(p.audit_trail || []), revisionAuditLog],
        };
      }
      return p;
    });

    setProposals(updated);
    setRevisingProposal(null);
    setIsSuccessAlert(`Perbaikan proposal (Revisi ke-${nextRevNum}) berhasil dikirim ulang ke Dosen Pembina.`);
    setTimeout(() => setIsSuccessAlert(null), 5000);
  };

  // Open Revision Modal
  const handleOpenRevisionModal = (proposal: HimpunanProposal) => {
    setRevisingProposal(proposal);
    setFormBudgetLines(proposal.anggaran_per_pos);
    setFormFundingSources(proposal.sumber_dana);
    setBerkasFileName('');
    setRevisionNotePengurus('');
    setFormError(null);
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
      header: 'Program Kerja & Surat',
      render: (row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{row.proker_nama}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {row.nomor_surat}
            </span>
            <span>&bull; Diajukan: {formatDateShort(row.tanggal_pengajuan)}</span>
            {row.nomor_revisi && row.nomor_revisi > 0 ? (
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                Revisi ke-{row.nomor_revisi}
              </span>
            ) : null}
          </div>
          {row.status === 'PERLU_REVISI' && (
            <div className="mt-1.5 rounded border border-amber-200 bg-amber-50/70 p-2 text-[11px] text-amber-900">
              <span className="font-bold block">Catatan Perlu Revisi:</span>
              <span>{row.catatan_pembina || row.catatan_kaprodi || 'Harap lakukan perbaikan sesuai arahan.'}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'total_anggaran_proposal',
      header: 'Pagu Proposal',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_anggaran_proposal)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.anggaran_per_pos.length} Pos Terinci</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Alur BPMN',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
          <span className="block text-[10px] text-slate-400 mt-1">
            {row.status === 'DIAJUKAN'
              ? 'Menunggu Review Pembina'
              : row.status === 'DISETUJUI_PEMBINA'
              ? 'Menunggu Pengesahan Kaprodi'
              : row.status === 'DISETUJUI'
              ? 'Sah oleh Kaprodi'
              : row.status === 'PERLU_REVISI'
              ? 'Menunggu Tindakan Pengurus'
              : 'Ditolak'}
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
            title="Lihat Detail & Riwayat Audit"
          >
            <Eye className="h-4 w-4" />
          </button>
          {/* Mengunggah/merevisi proposal saat Perlu Revisi */}
          {row.status === 'PERLU_REVISI' && (
            <button
              onClick={() => handleOpenRevisionModal(row)}
              className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600 transition-colors inline-flex items-center gap-1 shadow-xs"
              title="Perbaiki Proposal Sesuai Catatan"
            >
              <RotateCcw className="h-3 w-3" />
              Revisi Proposal
            </button>
          )}
          {row.status === 'DISETUJUI' && (
            <Link
              href={`/dashboard/himpunan/lpj?proposal_id=${row.id}`}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors inline-flex items-center gap-1"
            >
              Susun LPJ
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
        title="Pengajuan &amp; Revisi Proposal Kegiatan"
        description="Pengurus himpunan mengajukan proposal terstruktur, menerima catatan verifikasi, dan melakukan perbaikan revisi bila diminta oleh Dosen Pembina atau Kaprodi sebelum kegiatan disahkan."
        actions={
          <button
            onClick={() => {
              setIsSubmitModalOpen(true);
              setFormError(null);
            }}
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
            <span>{isSuccessAlert}</span>
          </div>
          <button onClick={() => setIsSuccessAlert(null)} className="text-emerald-700 font-bold hover:underline">
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
              <option value="PERLU_REVISI">Perlu Revisi (Loopback Pengurus)</option>
              <option value="DISETUJUI">Disetujui Kaprodi (Sah)</option>
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

      {/* Modal 1: Submit New Proposal Form */}
      <Modal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Formulir Pengajuan Proposal Terstruktur"
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
                    {p.nama_kegiatan} (Pagu Baseline: {formatRupiah(p.total_anggaran_rencana)})
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
                Unggah Berkas Naskah Proposal (PDF/DOCX) <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setBerkasFileName(e.target.files?.[0]?.name || '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Structured Budget Lines Section */}
          {formBudgetLines.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Rincian Anggaran Proposal Terstruktur (BPMN: Service Task Validasi)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sesuaikan nominal pengajuan per pos anggaran terhadap baseline awal.
                </p>
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
                <h4 className="font-bold text-slate-900 text-sm">Rencana Sumber Dana Proposal</h4>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Sumber Pendanaan</th>
                      <th className="px-3 py-2 text-right w-48">Target Nominal (Rp)</th>
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
              Validasi &amp; Kirim Proposal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Revision Modal (BPMN: Mengunggah/merevisi proposal setelah Perlu Revisi) */}
      {revisingProposal && (
        <Modal
          open={Boolean(revisingProposal)}
          onClose={() => setRevisingProposal(null)}
          title={`Formulir Revisi Proposal (Revisi ke-${(revisingProposal.nomor_revisi || 0) + 1})`}
          size="lg"
        >
          <form onSubmit={handleSubmitRevision} className="space-y-5 text-xs">
            {/* Reviewer Note Warning */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                Catatan Evaluasi Verifikator yang Harus Diperbaiki:
              </span>
              <p className="text-xs italic pl-5.5">
                &quot;{revisingProposal.catatan_pembina || revisingProposal.catatan_kaprodi}&quot;
              </p>
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Proposal</label>
                <input
                  type="text"
                  disabled
                  value={revisingProposal.nomor_surat}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unggah Berkas Naskah Revisi (PDF/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setBerkasFileName(e.target.files?.[0]?.name || '')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan Perbaikan dari Pengurus Himpunan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan butir revisi yang telah diperbaiki sesuai catatan verifikator..."
                  value={revisionNotePengurus}
                  onChange={(e) => setRevisionNotePengurus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Editable Structured Budget */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Sesuaikan Rincian Anggaran Proposal (Terstruktur):</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2 text-right">Rencana Baseline</th>
                      <th className="px-3 py-2 text-right w-44">Nominal Proposal Revisi (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formBudgetLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-900">{line.pos_anggaran}</td>
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
                      <td colSpan={2} className="px-3 py-2 text-right text-slate-700">
                        Total Anggaran Setelah Revisi:
                      </td>
                      <td className="px-3 py-2 text-right text-blue-700 font-bold">
                        {formatRupiah(totalAnggaranProposal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRevisingProposal(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-700 transition-colors shadow-xs"
              >
                Kirim Ulang Revisi Proposal ke Pembina
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Proposal Detail & Audit Trail View (UC-04 & NF-09) */}
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

            {/* Audit Trail Log History (NF-09) */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                <h5 className="font-bold text-slate-900">
                  Log Jejak Audit &amp; Riwayat Verifikasi:
                </h5>
              </div>
              <div className="space-y-2.5">
                {selectedProposalDetail.audit_trail?.map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.aksi.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(log.waktu)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span>Oleh: <strong>{log.aktor}</strong> ({log.peran})</span>
                      <span>&bull;</span>
                      <span>Status: <code className="text-slate-700">{log.status_sebelum}</code> &rarr; <code className="font-bold text-blue-700">{log.status_sesudah}</code></span>
                    </div>
                    {log.catatan && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200 mt-1">
                        &quot;{log.catatan}&quot;
                      </p>
                    )}
                  </div>
                ))}
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

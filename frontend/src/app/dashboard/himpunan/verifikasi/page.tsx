'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  DollarSign,
  Search,
  Filter,
  ShieldCheck,
  Building,
  UserCheck,
  ArrowRight,
  FileText,
  FileSpreadsheet,
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
  HimpunanProposal,
  HimpunanLpj,
} from '@/lib/types';
import { formatRupiah, formatDateShort, formatDateTime } from '@/lib/utils';

export default function HimpunanVerifikasiPage() {
  const { currentRole } = useUser();
  const [activeTab, setActiveTab] = useState<'PROPOSAL' | 'LPJ'>('PROPOSAL');

  const [proposals, setProposals] = useState<HimpunanProposal[]>(mockHimpunanProposals);
  const [lpjs, setLpjs] = useState<HimpunanLpj[]>(mockHimpunanLpjs);

  // Modal State for Review
  const [selectedProposalForReview, setSelectedProposalForReview] = useState<HimpunanProposal | null>(null);
  const [selectedLpjForReview, setSelectedLpjForReview] = useState<HimpunanLpj | null>(null);

  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSuccessToast, setIsSuccessToast] = useState<string | null>(null);

  // Role detection
  const isKaprodi = currentRole === 'KAPRODI';
  const isPembina = currentRole === 'DOSEN_PEMBINA' || currentRole === 'DOSEN';

  // Handle Proposal Review Action
  const handleReviewProposal = (action: 'APPROVE' | 'REVISE' | 'REJECT') => {
    if (!selectedProposalForReview) return;
    setReviewError(null);

    if ((action === 'REVISE' || action === 'REJECT') && !reviewNote.trim()) {
      setReviewError('Catatan wajib diisi bila meminta revisi atau menolak pengajuan (NF-09).');
      return;
    }

    const currentStatus = selectedProposalForReview.status;
    let newStatus: HimpunanProposal['status'] = currentStatus;

    if (action === 'APPROVE') {
      if (currentStatus === 'DIAJUKAN') {
        newStatus = 'DISETUJUI_PEMBINA';
      } else if (currentStatus === 'DISETUJUI_PEMBINA') {
        newStatus = 'DISETUJUI';
      }
    } else if (action === 'REVISE') {
      newStatus = 'PERLU_REVISI';
    } else if (action === 'REJECT') {
      newStatus = 'DITOLAK';
    }

    const nowIso = new Date().toISOString();
    const updated = proposals.map((p) => {
      if (p.id === selectedProposalForReview.id) {
        return {
          ...p,
          status: newStatus,
          ...(currentStatus === 'DIAJUKAN'
            ? { catatan_pembina: reviewNote || p.catatan_pembina, diverifikasi_pembina_at: nowIso }
            : { catatan_kaprodi: reviewNote || p.catatan_kaprodi, disetujui_kaprodi_at: nowIso }),
        };
      }
      return p;
    });

    setProposals(updated);
    setSelectedProposalForReview(null);
    setReviewNote('');
    setIsSuccessToast(`Proposal "${selectedProposalForReview.proker_nama}" berhasil diperbarui ke status: ${newStatus}`);
    setTimeout(() => setIsSuccessToast(null), 5000);
  };

  // Handle LPJ Review Action
  const handleReviewLpj = (action: 'APPROVE' | 'REVISE' | 'REJECT') => {
    if (!selectedLpjForReview) return;
    setReviewError(null);

    if ((action === 'REVISE' || action === 'REJECT') && !reviewNote.trim()) {
      setReviewError('Catatan wajib diisi bila meminta revisi atau menolak pengajuan (NF-09).');
      return;
    }

    const currentStatus = selectedLpjForReview.status;
    let newStatus: HimpunanLpj['status'] = currentStatus;

    if (action === 'APPROVE') {
      if (currentStatus === 'DIAJUKAN') {
        newStatus = 'DISETUJUI_PEMBINA';
      } else if (currentStatus === 'DISETUJUI_PEMBINA') {
        newStatus = 'DISETUJUI';
      }
    } else if (action === 'REVISE') {
      newStatus = 'PERLU_REVISI';
    } else if (action === 'REJECT') {
      newStatus = 'DITOLAK';
    }

    const nowIso = new Date().toISOString();
    const updated = lpjs.map((l) => {
      if (l.id === selectedLpjForReview.id) {
        return {
          ...l,
          status: newStatus,
          ...(currentStatus === 'DIAJUKAN'
            ? { catatan_pembina: reviewNote || l.catatan_pembina, diverifikasi_pembina_at: nowIso }
            : { catatan_kaprodi: reviewNote || l.catatan_kaprodi, disetujui_kaprodi_at: nowIso }),
        };
      }
      return l;
    });

    setLpjs(updated);
    setSelectedLpjForReview(null);
    setReviewNote('');
    setIsSuccessToast(`LPJ "${selectedLpjForReview.proker_nama}" berhasil diperbarui ke status: ${newStatus}`);
    setTimeout(() => setIsSuccessToast(null), 5000);
  };

  // Columns for Proposals Table
  const proposalColumns: DataTableColumn<HimpunanProposal>[] = [
    {
      key: 'proker_nama',
      header: 'Program Kerja & Pengajuan',
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
      header: 'Pagu Proposal',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_anggaran_proposal)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.anggaran_per_pos.length} Pos Anggaran</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tahap & Status',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
          <span className="block text-[10px] text-slate-400 mt-1">
            {row.status === 'DIAJUKAN'
              ? 'Menunggu Tahap 1 (Pembina)'
              : row.status === 'DISETUJUI_PEMBINA'
              ? 'Menunggu Tahap 2 (Kaprodi)'
              : row.status === 'DISETUJUI'
              ? 'Sah oleh Kaprodi'
              : 'Perlu Revisi / Ditolak'}
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
            onClick={() => {
              setSelectedProposalForReview(row);
              setReviewNote(row.status === 'DIAJUKAN' ? row.catatan_pembina || '' : row.catatan_kaprodi || '');
            }}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="h-4 w-4" />
            Tinjau &amp; Verifikasi
          </button>
        </div>
      ),
    },
  ];

  // Columns for LPJ Table
  const lpjColumns: DataTableColumn<HimpunanLpj>[] = [
    {
      key: 'proker_nama',
      header: 'Program Kerja & Pelaksanaan',
      render: (row) => (
        <div className="max-w-md py-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{row.proker_nama}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>
              {formatDateShort(row.tanggal_pelaksanaan_mulai)} - {formatDateShort(row.tanggal_pelaksanaan_selesai)}
            </span>
            <span>&bull;</span>
            <span>{row.jumlah_peserta_realisasi} Peserta</span>
          </div>
        </div>
      ),
    },
    {
      key: 'total_biaya_realisasi',
      header: 'Realisasi Biaya Riil',
      render: (row) => (
        <div className="text-right whitespace-nowrap text-xs">
          <p className="font-bold text-slate-900">{formatRupiah(row.total_biaya_realisasi)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.bukti_kuitansi_count} Kuitansi Sah</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tahap & Status',
      render: (row) => (
        <div className="text-center whitespace-nowrap">
          <StatusBadge status={row.status} size="sm" />
          <span className="block text-[10px] text-slate-400 mt-1">
            {row.status === 'DIAJUKAN'
              ? 'Menunggu Tahap 1 (Pembina)'
              : row.status === 'DISETUJUI_PEMBINA'
              ? 'Menunggu Tahap 2 (Kaprodi)'
              : row.status === 'DISETUJUI'
              ? 'LPJ Disahkan'
              : 'Perlu Revisi / Ditolak'}
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
            onClick={() => {
              setSelectedLpjForReview(row);
              setReviewNote(row.status === 'DIAJUKAN' ? row.catatan_pembina || '' : row.catatan_kaprodi || '');
            }}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="h-4 w-4" />
            Tinjau LPJ
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Bertingkat Proposal &amp; LPJ (FR-20)"
        description="Sistem menyediakan alur verifikasi dua tahap: Tahap 1 oleh Dosen Pembina Himpunan, dilanjutkan Tahap 2 persetujuan akhir oleh Ketua Program Studi (Kaprodi). Status verifikasi mencakup Diajukan, Disetujui Pembina, Perlu Revisi, Disetujui, dan Ditolak dengan catatan tersimpan pada log audit (NF-09)."
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            Peran Aktif: {currentRole.replace('_', ' ')}
          </span>
        }
      />

      {isSuccessToast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{isSuccessToast}</span>
          </div>
          <button onClick={() => setIsSuccessToast(null)} className="text-emerald-700 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Two-Stage Workflow Explanation Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Siklus Otorisasi Bertingkat Program Kerja Himpunan:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <span className="font-bold text-slate-800 block text-xs">1. Pengurus Himpunan</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Mengisi proposal terstruktur atau mengunggah LPJ &amp; kuitansi sah.
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <span className="font-bold text-blue-900 block text-xs">2. Dosen Pembina (Tahap 1)</span>
            <p className="text-[11px] text-blue-700 mt-1">
              Memvalidasi substansi, keselarasan rincian anggaran, dan kelayakan kegiatan.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <span className="font-bold text-emerald-900 block text-xs">3. Kaprodi (Tahap 2)</span>
            <p className="text-[11px] text-emerald-700 mt-1">
              Persetujuan final, alokasi pagu dana prodi, dan pengesahan LPJ resmi.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <span className="font-bold text-slate-800 block text-xs">4. Rekap &amp; Analisis</span>
            <p className="text-[11px] text-slate-500 mt-1">
              Otomatis terhitung ke dalam IKU dan analisis deviasi (FR-21/FR-22).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('PROPOSAL')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 inline-flex items-center gap-2 ${
              activeTab === 'PROPOSAL'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Verifikasi Proposal Kegiatan ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('LPJ')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 inline-flex items-center gap-2 ${
              activeTab === 'LPJ'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Verifikasi LPJ &amp; Kuitansi ({lpjs.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Proposals Table */}
      {activeTab === 'PROPOSAL' && (
        <DataTable
          columns={proposalColumns}
          data={proposals}
          emptyMessage="Tidak ada antrean proposal kegiatan"
        />
      )}

      {/* Tab 2: LPJ Table */}
      {activeTab === 'LPJ' && (
        <DataTable
          columns={lpjColumns}
          data={lpjs}
          emptyMessage="Tidak ada antrean LPJ kegiatan"
        />
      )}

      {/* Modal: Review Proposal */}
      {selectedProposalForReview && (
        <Modal
          open={Boolean(selectedProposalForReview)}
          onClose={() => setSelectedProposalForReview(null)}
          title={`Tinjauan Verifikasi Proposal: ${selectedProposalForReview.proker_nama}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {reviewError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nomor Surat</span>
                <span className="font-mono font-bold text-slate-800">{selectedProposalForReview.nomor_surat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tgl Diajukan</span>
                <span className="font-semibold text-slate-800">
                  {formatDateShort(selectedProposalForReview.tanggal_pengajuan)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Anggaran</span>
                <span className="font-bold text-blue-700">
                  {formatRupiah(selectedProposalForReview.total_anggaran_proposal)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tahap Review</span>
                <StatusBadge status={selectedProposalForReview.status} size="sm" />
              </div>
            </div>

            {/* Structured Table */}
            <div>
              <h5 className="font-bold text-slate-900 mb-2">Pemeriksaan Rincian Pos Anggaran (FR-18):</h5>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Pos Anggaran</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2 text-right">Rencana Proker</th>
                      <th className="px-3 py-2 text-right">Nominal Proposal</th>
                      <th className="px-3 py-2 text-right">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProposalForReview.anggaran_per_pos.map((b) => {
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

            {/* Previous Notes */}
            {selectedProposalForReview.catatan_pembina && (
              <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-200 text-xs">
                <span className="font-semibold text-blue-900">Catatan Dosen Pembina:</span>
                <p className="mt-1 text-blue-800 italic">&quot;{selectedProposalForReview.catatan_pembina}&quot;</p>
              </div>
            )}

            {/* Review Decision Form */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <label className="block font-semibold text-slate-800">
                Catatan Verifikasi {selectedProposalForReview.status === 'DIAJUKAN' ? 'Dosen Pembina' : 'Kaprodi'}:
              </label>
              <textarea
                rows={3}
                placeholder="Berikan arahan, koreksi mata anggaran, atau rekomendasi..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProposalForReview(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewProposal('REJECT')}
                  className="rounded-lg bg-rose-50 px-3.5 py-2 font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Tolak Pengajuan
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewProposal('REVISE')}
                  className="rounded-lg bg-amber-50 px-3.5 py-2 font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  Minta Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewProposal('APPROVE')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {selectedProposalForReview.status === 'DIAJUKAN'
                    ? 'Setujui Tahap 1 (Lanjut ke Kaprodi)'
                    : 'Sahkan Proposal (Kaprodi Final)'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Review LPJ */}
      {selectedLpjForReview && (
        <Modal
          open={Boolean(selectedLpjForReview)}
          onClose={() => setSelectedLpjForReview(null)}
          title={`Tinjauan Verifikasi LPJ: ${selectedLpjForReview.proker_nama}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {reviewError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Realisasi Biaya</span>
                <span className="font-bold text-slate-800">
                  {formatRupiah(selectedLpjForReview.total_biaya_realisasi)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Bukti Kuitansi</span>
                <span className="font-bold text-emerald-700">
                  {selectedLpjForReview.bukti_kuitansi_count} Berkas Sah
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Keterlambatan</span>
                <span
                  className={`font-bold ${
                    selectedLpjForReview.hari_keterlambatan > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {selectedLpjForReview.hari_keterlambatan > 0
                    ? `+${selectedLpjForReview.hari_keterlambatan} Hari`
                    : 'Tepat Waktu'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status LPJ</span>
                <StatusBadge status={selectedLpjForReview.status} size="sm" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3.5 bg-white">
              <span className="font-bold text-slate-900 block mb-1">Capaian Indikator Riil:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                {selectedLpjForReview.capaian_indikator}
              </p>
            </div>

            {/* Review Decision Form */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <label className="block font-semibold text-slate-800">
                Catatan Verifikasi {selectedLpjForReview.status === 'DIAJUKAN' ? 'Dosen Pembina' : 'Kaprodi'}:
              </label>
              <textarea
                rows={3}
                placeholder="Berikan evaluasi terhadap kesesuaian kuitansi, bukti pelaksanaan, atau pengesahan LPJ..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLpjForReview(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLpj('REJECT')}
                  className="rounded-lg bg-rose-50 px-3.5 py-2 font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Tolak LPJ
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLpj('REVISE')}
                  className="rounded-lg bg-amber-50 px-3.5 py-2 font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  Minta Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLpj('APPROVE')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {selectedLpjForReview.status === 'DIAJUKAN'
                    ? 'Setujui Tahap 1 (Lanjut ke Kaprodi)'
                    : 'Sahkan LPJ Resmi (Kaprodi Final)'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

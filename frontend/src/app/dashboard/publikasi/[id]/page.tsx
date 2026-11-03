'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusStepper from '@/components/ui/StatusStepper';
import Modal from '@/components/ui/Modal';
import FileUploader from '@/components/ui/FileUploader';
import { mockPublications, mockProfiles } from '@/lib/mock-data';
import type {
  Publication,
  PublicationStatus,
  ProofType,
  PublicationStageLog,
} from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Upload,
  UserCheck,
  CheckCircle2,
  FileText,
  Clock,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

const PUBLICATION_STEPS = [
  { id: 'DRAF', label: 'Draf' },
  { id: 'REVIEW_INTERNAL', label: 'Review Internal' },
  { id: 'DIAJUKAN', label: 'Diajukan' },
  { id: 'DALAM_REVIEW', label: 'Dalam Review' },
  { id: 'REVISI', label: 'Revisi' },
  { id: 'DITERIMA', label: 'Diterima (LoA)' },
  { id: 'TERBIT', label: 'Terbit' },
];

export default function DetailPublikasiPage() {
  const params = useParams();
  const pubId = params.id as string;

  const initialPub =
    mockPublications.find((p) => p.id === pubId) || mockPublications[0];

  const [pub, setPub] = useState<Publication>(initialPub);
  const [modalStageOpen, setModalStageOpen] = useState(false);
  const [modalReviewerOpen, setModalReviewerOpen] = useState(false);

  // Stage form
  const [nextStage, setNextStage] = useState<PublicationStatus>('DALAM_REVIEW');
  const [stageDate, setStageDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofType, setProofType] = useState<ProofType>('BUKTI_SUBMIT');
  const [proofUrl, setProofUrl] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  // Reviewer form
  const [selectedReviewerId, setSelectedReviewerId] = useState('u-dosen2');
  const [reviewerDeadline, setReviewerDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleAdvanceStage = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: PublicationStageLog = {
      id: `psl-${Date.now()}`,
      publication_id: pub.id,
      tahap: nextStage,
      tanggal_tahap: stageDate,
      jenis_bukti: proofType,
      tautan_bukti: proofUrl || undefined,
      nama_berkas_bukti: proofUrl ? undefined : 'berkas_bukti_upload.pdf',
      catatan: stageNotes,
      dicatat_oleh: pub.dicatat_oleh,
      status_verifikasi: pub.verifikator_id ? 'MENUNGGU' : 'TERVERIFIKASI',
      created_at: new Date().toISOString(),
    };

    setPub({
      ...pub,
      status: nextStage,
      stage_logs: [...(pub.stage_logs || []), newLog],
    });

    setModalStageOpen(false);
    setStageNotes('');
    setProofUrl('');
  };

  const handleAssignReviewer = (e: React.FormEvent) => {
    e.preventDefault();
    const reviewerProfile = mockProfiles.find((p) => p.id === selectedReviewerId);

    const newReview = {
      id: `rev-${Date.now()}`,
      publication_id: pub.id,
      reviewer_id: selectedReviewerId,
      ditetapkan_oleh: 'u-kaprodi',
      status: 'DITUGASKAN' as const,
      tenggat_review: reviewerDeadline,
      ditugaskan_at: new Date().toISOString(),
      reviewer: reviewerProfile,
    };

    setPub({
      ...pub,
      status: 'REVIEW_INTERNAL',
      reviews: [...(pub.reviews || []), newReview],
    });

    setModalReviewerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/publikasi"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Publikasi</span>
        </Link>
      </div>

      <PageHeader
        title={pub.judul}
        description={`Target: ${pub.nama_target} • ${pub.jenis} (${pub.peringkat.replace('_', ' ')}) • Tahun: ${pub.tahun}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalReviewerOpen(true)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <UserCheck size={14} className="text-slate-500" />
              <span>Tetapkan Reviewer</span>
            </button>
            <button
              type="button"
              onClick={() => setModalStageOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Upload size={14} />
              <span>Perbarui Tahapan</span>
            </button>
          </div>
        }
      />

      {/* Stepper Card */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Alur Tahapan Publikasi
          </span>
          <StatusBadge status={pub.status} size="sm" />
        </div>
        <StatusStepper steps={PUBLICATION_STEPS} currentStepId={pub.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stage Logs & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Riwayat Tahapan Log */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Riwayat Bukti & Tahapan
            </h3>

            <div className="space-y-4">
              {pub.stage_logs?.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex gap-3 text-xs p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.tahap.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">{formatDateShort(log.tanggal_tahap)}</span>
                    </div>

                    {log.catatan && <p className="text-slate-600 text-[11px]">{log.catatan}</p>}

                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      {log.jenis_bukti && (
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          <FileText size={12} />
                          {log.jenis_bukti.replace('_', ' ')}
                        </span>
                      )}
                      {log.tautan_bukti && (
                        <a
                          href={log.tautan_bukti}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={12} />
                          Buka Tautan
                        </a>
                      )}
                      {log.status_verifikasi && (
                        <span className="ml-auto">
                          <StatusBadge status={log.status_verifikasi} size="sm" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Internal Panel */}
          {pub.reviews && pub.reviews.length > 0 && (
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Hasil Review Internal Dosen
              </h3>
              {pub.reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Reviewer: {rev.reviewer?.nama_lengkap}
                    </span>
                    <StatusBadge status={rev.status} size="sm" />
                  </div>
                  {rev.rekomendasi && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Rekomendasi:</span>
                      <StatusBadge status={rev.rekomendasi} size="sm" />
                    </div>
                  )}
                  {rev.catatan_review && (
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                      &ldquo;{rev.catatan_review}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Metadata & Authors */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Daftar Penulis
            </h3>
            <div className="space-y-2.5 divide-y divide-slate-100 text-xs">
              {pub.authors.map((auth, idx) => (
                <div key={auth.id || idx} className="pt-2 first:pt-0 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{auth.nama_penulis}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {auth.tipe_penulis}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-medium">
                    {auth.peran.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Tautan & DOI
            </h3>
            {pub.doi ? (
              <div>
                <p className="text-[11px] text-slate-400">Digital Object Identifier (DOI):</p>
                <a
                  href={`https://doi.org/${pub.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink size={12} />
                  {pub.doi}
                </a>
              </div>
            ) : (
              <p className="text-slate-400 italic">Belum ada DOI resmi terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Perbarui Tahapan */}
      <Modal open={modalStageOpen} onClose={() => setModalStageOpen(false)} title="Perbarui Tahapan Publikasi" size="md">
        <form onSubmit={handleAdvanceStage} className="space-y-4 text-xs">
          <div>
            <label className="label">Pilih Tahap Berikutnya</label>
            <select
              value={nextStage}
              onChange={(e) => setNextStage(e.target.value as PublicationStatus)}
              className="select-field text-xs"
            >
              <option value="REVIEW_INTERNAL">Review Internal</option>
              <option value="DIAJUKAN">Diajukan ke Penerbit / Konferensi</option>
              <option value="DALAM_REVIEW">Dalam Proses Review (Under Review)</option>
              <option value="REVISI">Perlu Revisi (Revision Requested)</option>
              <option value="DITERIMA">Diterima (Accepted / LoA)</option>
              <option value="TERBIT">Terbit (Published)</option>
              <option value="DITOLAK">Ditolak (Rejected)</option>
            </select>
          </div>

          <div>
            <label className="label">Tanggal Kejadian Tahap</label>
            <input
              type="date"
              required
              value={stageDate}
              onChange={(e) => setStageDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="label">Jenis Bukti</label>
            <select
              value={proofType}
              onChange={(e) => setProofType(e.target.value as ProofType)}
              className="select-field text-xs"
            >
              <option value="BUKTI_SUBMIT">Bukti Submit (Tanda Terima)</option>
              <option value="LOA">Letter of Acceptance (LoA)</option>
              <option value="DOI_URL">Tautan DOI / URL Terbit</option>
              <option value="LAINNYA">Bukti Lainnya</option>
            </select>
          </div>

          {proofType === 'DOI_URL' ? (
            <div>
              <label className="label">Tautan DOI / URL Publikasi</label>
              <input
                type="url"
                required
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://doi.org/10.xxxx/..."
                className="input-field text-xs"
              />
            </div>
          ) : (
            <FileUploader label="Unggah Berkas Bukti (PDF / JPG)" />
          )}

          <div>
            <label className="label">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              placeholder="Catatan tahapan, nomor surat, atau keterangan penting..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalStageOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Simpan Tahapan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tetapkan Reviewer Internal */}
      <Modal open={modalReviewerOpen} onClose={() => setModalReviewerOpen(false)} title="Tetapkan Reviewer Internal" size="md">
        <form onSubmit={handleAssignReviewer} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Pilih dosen reviewer internal prodi untuk memberikan telaah kelayakan naskah sebelum disubmit. Sesuai aturan PRD, reviewer tidak boleh berasal dari tim penulis naskah ini.
          </p>

          <div>
            <label className="label">Dosen Reviewer</label>
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className="select-field text-xs"
            >
              {mockProfiles
                .filter((p) => p.tipe_pengguna === 'DOSEN' && !pub.authors.some((a) => a.user_id === p.id))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_lengkap}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">Tenggat Waktu Review</label>
            <input
              type="date"
              required
              value={reviewerDeadline}
              onChange={(e) => setReviewerDeadline(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalReviewerOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Kirim Penugasan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


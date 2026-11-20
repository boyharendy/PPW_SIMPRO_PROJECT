'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import type { PublicationReview } from '@/lib/types';

interface StageModalProps {
  open: boolean;
  onClose: () => void;
  newTahap: string;
  setNewTahap: (v: string) => void;
  newBukti: string;
  setNewBukti: (v: string) => void;
  newCatatan: string;
  setNewCatatan: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function UpdateStageModal({
  open,
  onClose,
  newTahap,
  setNewTahap,
  newBukti,
  setNewBukti,
  newCatatan,
  setNewCatatan,
  onSubmit,
}: StageModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Perbarui Status Publikasi" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Status Tahap Baru</label>
          <select value={newTahap} onChange={(e) => setNewTahap(e.target.value)} className="select-field">
            <option value="DRAF">Draf</option>
            <option value="REVIEW_INTERNAL">Review Internal</option>
            <option value="DIAJUKAN">Diajukan (Submit)</option>
            <option value="DALAM_REVIEW">Dalam Review</option>
            <option value="REVISI">Revisi</option>
            <option value="DITERIMA">Diterima (LoA Accepted)</option>
            <option value="TERBIT">Terbit (Published)</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Tautan Bukti / DOI / Berkas</label>
          <input
            type="text"
            value={newBukti}
            onChange={(e) => setNewBukti(e.target.value)}
            placeholder="Contoh: LoA_JTIIK_2025.pdf atau https://doi.org/..."
            className="input-field text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Progres</label>
          <textarea
            rows={2}
            value={newCatatan}
            onChange={(e) => setNewCatatan(e.target.value)}
            placeholder="Catatan perkembangan naskah..."
            className="input-field resize-none text-xs"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Batal</button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">Simpan Status</button>
        </div>
      </form>
    </Modal>
  );
}

interface AssignReviewerModalProps {
  open: boolean;
  onClose: () => void;
  eligibleReviewers: { id: string; nama: string }[];
  selectedReviewerId: string;
  setSelectedReviewerId: (v: string) => void;
  tenggatReview: string;
  setTenggatReview: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AssignReviewerModal({
  open,
  onClose,
  eligibleReviewers,
  selectedReviewerId,
  setSelectedReviewerId,
  tenggatReview,
  setTenggatReview,
  onSubmit,
}: AssignReviewerModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Tetapkan Dosen Reviewer Internal" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Dosen Reviewer (Bukan Penulis Naskah)</label>
          <select value={selectedReviewerId} onChange={(e) => setSelectedReviewerId(e.target.value)} className="select-field" required>
            <option value="">— Pilih Dosen Reviewer —</option>
            {eligibleReviewers.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Tenggat Review Internal</label>
          <input type="date" value={tenggatReview} onChange={(e) => setTenggatReview(e.target.value)} className="input-field text-xs" required />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Batal</button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">Tetapkan Reviewer</button>
        </div>
      </form>
    </Modal>
  );
}

interface CompleteReviewModalProps {
  review: PublicationReview | null;
  onClose: () => void;
  rekomendasi: 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN';
  setRekomendasi: (v: 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN') => void;
  catatanReview: string;
  setCatatanReview: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CompleteReviewModal({
  review,
  onClose,
  rekomendasi,
  setRekomendasi,
  catatanReview,
  setCatatanReview,
  onSubmit,
}: CompleteReviewModalProps) {
  return (
    <Modal open={Boolean(review)} onClose={onClose} title="Beri Catatan Review Internal" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Rekomendasi</label>
          <select value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value as 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN')} className="select-field">
            <option value="LAYAK_DIAJUKAN">LAYAK DIAJUKAN</option>
            <option value="PERLU_PERBAIKAN">PERLU PERBAIKAN</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Penelaahan</label>
          <textarea rows={3} value={catatanReview} onChange={(e) => setCatatanReview(e.target.value)} className="input-field resize-none text-xs" required placeholder="Tuliskan masukan sebelum naskah diajukan..." />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Batal</button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">Kirim Catatan</button>
        </div>
      </form>
    </Modal>
  );
}

interface VerifyStudentPubModalProps {
  open: boolean;
  onClose: () => void;
  verifyDecision: 'TERVERIFIKASI' | 'DITOLAK';
  setVerifyDecision: (v: 'TERVERIFIKASI' | 'DITOLAK') => void;
  verifyCatatan: string;
  setVerifyCatatan: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function VerifyStudentPubModal({
  open,
  onClose,
  verifyDecision,
  setVerifyDecision,
  verifyCatatan,
  setVerifyCatatan,
  onSubmit,
}: VerifyStudentPubModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Verifikasi Publikasi Mahasiswa" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 flex-1 cursor-pointer">
            <input type="radio" checked={verifyDecision === 'TERVERIFIKASI'} onChange={() => setVerifyDecision('TERVERIFIKASI')} />
            <span className="text-xs font-semibold text-emerald-700">Setujui Masuk Rekap</span>
          </label>
          <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 flex-1 cursor-pointer">
            <input type="radio" checked={verifyDecision === 'DITOLAK'} onChange={() => setVerifyDecision('DITOLAK')} />
            <span className="text-xs font-semibold text-rose-700">Tolak (Perlu Perbaikan)</span>
          </label>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Pembimbing / Pendamping</label>
          <textarea rows={3} value={verifyCatatan} onChange={(e) => setVerifyCatatan(e.target.value)} className="input-field resize-none text-xs" required={verifyDecision === 'DITOLAK'} placeholder="Catatan verifikasi..." />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Batal</button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">Simpan Verifikasi</button>
        </div>
      </form>
    </Modal>
  );
}

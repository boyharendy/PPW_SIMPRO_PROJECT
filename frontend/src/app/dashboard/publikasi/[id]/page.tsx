'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Eye,
  Plus,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';
import { useUser } from '@/lib/context';
import { publicationService } from '@/lib/api/services/publication.service';
import { mockPublications } from '@/lib/mock-data';
import type { Publication, PublicationReview } from '@/lib/types';
import {
  AssignReviewerModal,
  CompleteReviewModal,
  UpdateStageModal,
  VerifyStudentPubModal,
} from './PublicationActionModals';

const DOSEN_LIST = [
  { id: 'u-dosen1', nama: 'Dr. Eng. Hendra Wijaya, M.Sc.' },
  { id: 'u-dosen2', nama: 'Dewi Lestari, M.T.' },
  { id: 'u-gkm', nama: 'Siti Rahmawati, M.Kom.' },
  { id: 'u-koordinator', nama: 'Ir. Agus Pratama, M.Kom.' },
];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { user, currentRole } = useUser();

  const [pub, setPub] = useState<Publication>(
    () => mockPublications.find((p) => p.id === id) || mockPublications[0]
  );
  const [stageModal, setStageModal] = useState(false);
  const [newTahap, setNewTahap] = useState<string>('DIAJUKAN');
  const [newBukti, setNewBukti] = useState('');
  const [newCatatan, setNewCatatan] = useState('');

  const [assignRevModal, setAssignRevModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [tenggatReview, setTenggatReview] = useState('2025-11-30');

  const [completeRevModal, setCompleteRevModal] = useState<PublicationReview | null>(null);
  const [rekomendasi, setRekomendasi] = useState<'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN'>('LAYAK_DIAJUKAN');
  const [catatanReview, setCatatanReview] = useState('');

  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState<'TERVERIFIKASI' | 'DITOLAK'>('TERVERIFIKASI');
  const [verifyCatatan, setVerifyCatatan] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    publicationService.getPublicationById(id).then((res) => {
      if (active && res.data) {
        setPub(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  const isKaprodi = currentRole === 'KAPRODI';
  const publisherType =
    pub.tipe_pencatat || (pub.authors?.[0]?.tipe_penulis === 'MAHASISWA' ? 'MAHASISWA' : 'DOSEN');
  const isPublisher =
    !isKaprodi &&
    (publisherType === 'MAHASISWA' ? currentRole === 'MAHASISWA' : currentRole === 'DOSEN');
  const canVerifyStudentPub =
    !isKaprodi &&
    (currentRole === 'DOSEN' || currentRole === 'DOSEN_VERIFIKATOR') &&
    pub.status_verifikasi === 'MENUNGGU';
  const canReviewInternal = !isKaprodi && currentRole === 'DOSEN';

  const authorIds = new Set(pub.authors?.map((a) => a.user_id).filter(Boolean));
  const authorNames = new Set(pub.authors?.map((a) => a.nama_penulis.toLowerCase()));
  const eligibleReviewers = DOSEN_LIST.filter(
    (d) => !authorIds.has(d.id) && !authorNames.has(d.nama.toLowerCase())
  );

  const verifikatorDisplay =
    pub.verifikator_nama ||
    pub.authors?.find((a) => a.tipe_penulis === 'DOSEN')?.nama_penulis ||
    (publisherType === 'MAHASISWA'
      ? 'Dosen Pembimbing / Penulis Pendamping'
      : 'Tidak Diperlukan (Publikasi Dosen)');

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await publicationService.updateStatus(pub.id, {
      status: newTahap,
      bukti: newBukti.trim() || undefined,
      catatan: newCatatan.trim() || undefined,
    });
    if (res.data) setPub(res.data);
    setNewBukti('');
    setNewCatatan('');
    setStageModal(false);
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = eligibleReviewers.find((d) => d.id === selectedReviewerId);
    if (!chosen) return;
    const res = await publicationService.assignReviewer(pub.id, {
      reviewer_id: chosen.id,
      reviewer_nama: chosen.nama,
      tenggat_review: tenggatReview,
    });
    if (res.data) setPub(res.data);
    setSelectedReviewerId('');
    setAssignRevModal(false);
  };

  const handleCompleteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeRevModal) return;
    const res = await publicationService.completeReview(completeRevModal.id, {
      rekomendasi,
      catatan: catatanReview,
    });
    if (res.data) setPub(res.data);
    setCompleteRevModal(null);
    setCatatanReview('');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await publicationService.verifyPublication(pub.id, {
      status: verifyDecision,
      catatan: verifyCatatan.trim() || undefined,
    });
    if (res.data) setPub(res.data);
    setVerifyModal(false);
    setVerifyCatatan('');
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/publikasi"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Publikasi
        </Link>
      </div>

      <PageHeader
        title={pub.judul}
        badge={<StatusBadge status={pub.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canVerifyStudentPub && (
              <button
                onClick={() => setVerifyModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldCheck size={14} /> Verifikasi Naskah Mahasiswa
              </button>
            )}

            {isKaprodi && (
              <button
                onClick={() => setAssignRevModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <UserPlus size={14} /> Tugaskan Reviewer Internal
              </button>
            )}

            {isPublisher ? (
              <button
                onClick={() => setStageModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={14} /> Perbarui Tahapan Publikasi
              </button>
            ) : (
              isKaprodi && (
                <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                  Mode Monitoring Kaprodi (Read-Only Status)
                </span>
              )
            )}
          </div>
        }
      />

      {/* Detail Meta Publikasi */}
      <div className="card space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Informasi Publikasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Tipe Pencatat / Pengunggah:</span>
            <strong className="text-slate-800 text-sm">
              {publisherType === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Jenis Publikasi:</span>
            <strong className="text-slate-800 text-sm">{pub.jenis}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Peringkat / Akreditasi:</span>
            <strong className="text-slate-800 text-sm">{pub.peringkat || 'NON_PERINGKAT'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Target Jurnal / Konferensi:</span>
            <strong className="text-slate-800 text-sm">
              {pub.nama_target || '-'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Tahun Terbit:</span>
            <strong className="text-slate-800 text-sm">{pub.tahun || '-'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Status Validasi Dosen:</span>
            <div className="mt-1 flex items-center gap-2">
              <strong className="text-slate-800 font-bold">{pub.status_verifikasi || 'TIDAK_PERLU'}</strong>
              {pub.diverifikasi_at && (
                <span className="text-[11px] text-slate-400">
                  ({formatDateShort(pub.diverifikasi_at)})
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <span className="text-slate-500 block">Dosen Verifikator / Pendamping:</span>
            <strong className="text-slate-800 text-sm">{verifikatorDisplay}</strong>
          </div>
          {pub.doi && (
            <div className="md:col-span-2">
              <span className="text-slate-500 block">Digital Object Identifier (DOI):</span>
              <a
                href={`https://doi.org/${pub.doi}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-xs"
              >
                {pub.doi} <ExternalLink size={11} />
              </a>
            </div>
          )}
          {pub.url && (
            <div className="md:col-span-2">
              <span className="text-slate-500 block">Tautan Naskah / Repository:</span>
              <a
                href={pub.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs truncate max-w-md"
              >
                {pub.url} <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Review Internal Antar Dosen */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Review Internal Manuskrip
          </h3>
          {isKaprodi && (
            <button
              onClick={() => setAssignRevModal(true)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              + Tugaskan Reviewer Lain
            </button>
          )}
        </div>

        {(!pub.reviews || pub.reviews.length === 0) ? (
          <p className="text-xs text-slate-500 italic">
            Belum ada reviewer internal yang ditugaskan untuk naskah ini.
          </p>
        ) : (
          <div className="space-y-2">
            {pub.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong>{rev.reviewer_nama}</strong>
                    <StatusBadge status={rev.status} size="sm" />
                    {rev.rekomendasi && (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rev.rekomendasi.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {rev.tenggat_review && (
                    <div className="text-[11px] text-slate-500">
                      Tenggat Review: {formatDateShort(rev.tenggat_review)}
                    </div>
                  )}
                  {(rev.catatan_review || rev.catatan) && (
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                      {rev.catatan_review || rev.catatan}
                    </p>
                  )}
                </div>
                {canReviewInternal && rev.status === 'DITUGASKAN' && (
                  <button
                    onClick={() => {
                      setCompleteRevModal(rev);
                      setRekomendasi('LAYAK_DIAJUKAN');
                      setCatatanReview('');
                    }}
                    className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0"
                  >
                    <ClipboardCheck size={13} /> Beri Catatan Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daftar Penulis */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Susunan Penulis Karya
        </h3>
        <div className="divide-y divide-slate-100">
          {(pub.authors || []).map((p) => (
            <div key={p.id || p.urutan} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-400 w-4 text-center">{p.urutan}</span>
                <div>
                  <div className="font-semibold text-slate-800">{p.nama_penulis}</div>
                  <div className="text-[11px] text-slate-400">Tipe: {p.tipe_penulis}</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {p.peran.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Tahapan */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Riwayat Tahapan Publikasi
        </h3>
        <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {(pub.stage_logs || []).map((t, i) => (
            <div key={t.id || i} className="flex items-start gap-4 relative">
              <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-blue-500 text-blue-600 flex items-center justify-center shrink-0 z-10">
                <CheckCircle2 size={14} />
              </div>
              <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{t.tahap.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] text-slate-400">• {formatDateShort(t.tanggal_tahap)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Bukti: {t.tautan_bukti || t.nama_berkas_bukti || '-'}
                    {t.catatan ? ` — ${t.catatan}` : ''}
                  </div>
                </div>
                <StatusBadge status={t.status_verifikasi} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <UpdateStageModal
        open={stageModal}
        onClose={() => setStageModal(false)}
        newTahap={newTahap}
        setNewTahap={setNewTahap}
        newBukti={newBukti}
        setNewBukti={setNewBukti}
        newCatatan={newCatatan}
        setNewCatatan={setNewCatatan}
        onSubmit={handleUpdateStage}
      />
      <AssignReviewerModal
        open={assignRevModal}
        onClose={() => setAssignRevModal(false)}
        eligibleReviewers={eligibleReviewers}
        selectedReviewerId={selectedReviewerId}
        setSelectedReviewerId={setSelectedReviewerId}
        tenggatReview={tenggatReview}
        setTenggatReview={setTenggatReview}
        onSubmit={handleAssignReviewer}
      />
      <CompleteReviewModal
        review={completeRevModal}
        onClose={() => setCompleteRevModal(null)}
        rekomendasi={rekomendasi}
        setRekomendasi={setRekomendasi}
        catatanReview={catatanReview}
        setCatatanReview={setCatatanReview}
        onSubmit={handleCompleteReview}
      />
      <VerifyStudentPubModal
        open={verifyModal}
        onClose={() => setVerifyModal(false)}
        verifyDecision={verifyDecision}
        setVerifyDecision={setVerifyDecision}
        verifyCatatan={verifyCatatan}
        setVerifyCatatan={setVerifyCatatan}
        onSubmit={handleVerifySubmit}
      />
    </div>
  );
}

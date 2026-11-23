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
import { useLecturers } from '@/lib/hooks/useLecturers';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateShort } from '@/lib/utils';
import { useUser } from '@/lib/context';
import { publicationService } from '@/lib/api/services/publication.service';
import type { Publication, PublicationReview } from '@/lib/types';
import {
  AssignReviewerModal,
  CompleteReviewModal,
  UpdateStageModal,
  VerifyStudentPubModal,
} from './PublicationActionModals';



export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { user, currentRole } = useUser();
  const lecturers = useLecturers();

  const [pub, setPub] = useState<Publication | null>(null);
  const [loadError,setLoadError]=useState(false);
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
    }).catch(() => { if(active) {setPub(null);setLoadError(true);} });
    return () => {
      active = false;
    };
  }, [id]);

  if (!pub || pub.id!==id) return <p role="status">{loadError ? "Publikasi tidak tersedia." : "Memuat publikasi?"}</p>;

  const isKaprodi = currentRole === 'KAPRODI';
  const publisherType =
    pub.tipe_pencatat || (pub.authors?.[0]?.tipe_penulis === 'MAHASISWA' ? 'MAHASISWA' : 'DOSEN');
  const isPublisher =
    !isKaprodi &&
    (publisherType === 'MAHASISWA' ? currentRole === 'MAHASISWA' : currentRole === 'DOSEN');
  const canVerifyStudentPub =
    !isKaprodi &&
    (currentRole === 'DOSEN' || currentRole === 'DOSEN_VERIFIKATOR') &&
    pub.status_verifikasi === 'MENUNGGU' && pub.verifikator_id === user.id;
  const canReviewInternal = !isKaprodi && currentRole === 'DOSEN';

  const authorIds = new Set(pub.authors?.map((a) => a.user_id).filter(Boolean));
  const authorNames = new Set(pub.authors?.map((a) => a.nama_penulis.toLowerCase()));
  const eligibleReviewers = lecturers.filter(
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
    await publicationService.updateStatus(pub.id, {
      status: newTahap,
      bukti: newBukti.trim() || undefined,
      catatan: newCatatan.trim() || undefined,
    });
    setPub((await publicationService.getPublicationById(id)).data);
    setNewBukti('');
    setNewCatatan('');
    setStageModal(false);
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = eligibleReviewers.find((d) => d.id === selectedReviewerId);
    if (!chosen) return;
    await publicationService.assignReviewer(pub.id, {
      reviewer_id: chosen.id,
      reviewer_nama: chosen.nama,
      tenggat_review: tenggatReview,
    });
    setPub((await publicationService.getPublicationById(id)).data);
    setSelectedReviewerId('');
    setAssignRevModal(false);
  };

  const handleCompleteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeRevModal) return;
    await publicationService.completeReview(completeRevModal.id, {
      rekomendasi,
      catatan: catatanReview,
    });
    setPub((await publicationService.getPublicationById(id)).data);
    setCompleteRevModal(null);
    setCatatanReview('');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await publicationService.verifyPublication(pub.id, {
      status: verifyDecision,
      catatan: verifyCatatan.trim(),
      verifikator_nama: user.nama_lengkap,
    });
    setPub((await publicationService.getPublicationById(id)).data);
    setVerifyModal(false);
    setVerifyCatatan('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/publikasi"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Publikasi
        </Link>
      </div>

      <PageHeader
        title={pub.judul}
        description={`Katalog karya ilmiah prodi — ID: ${pub.id} • Pencatat: ${publisherType}`}
        badge={<StatusBadge status={pub.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isKaprodi && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <Eye size={13} /> Mode Pantau Kaprodi (Read-Only)
              </span>
            )}
            {isPublisher && (
              <>
                <button
                  onClick={() => setAssignRevModal(true)}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <UserPlus size={14} /> Tetapkan Reviewer Internal
                </button>
                <button
                  onClick={() => {
                    setNewTahap(pub.status === 'DRAF' ? 'DIAJUKAN' : pub.status);
                    setStageModal(true);
                  }}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Perbarui Status Publikasi
                </button>
              </>
            )}
            {canVerifyStudentPub && (
              <button
                onClick={() => setVerifyModal(true)}
                className="bg-emerald-600 text-white rounded-xl text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
              >
                <ShieldCheck size={14} /> Verifikasi Publikasi Mahasiswa
              </button>
            )}
          </div>
        }
      />

      {/* Info Karya Ilmiah & Verifikasi Pembimbing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Informasi Manuskrip & Target
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Jenis Publikasi:</span>
              <span className="font-semibold text-slate-800">{pub.jenis}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Peringkat / Indeksasi:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {(pub.peringkat || 'NON_PERINGKAT').replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Target Publikasi:</span>
              <span className="font-medium text-slate-800">{pub.nama_target}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tahun Terbit / Catat:</span>
              <span className="font-medium text-slate-800">{pub.tahun}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">DOI / Tautan Resmi:</span>
              {pub.url ? (
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  {pub.doi || pub.url} <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Verifikasi Mahasiswa (FR-31) */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Verifikasi Rekap (FR-31)
          </h3>
          <div>
            <div className="text-xs text-slate-400 mb-1">Status Verifikasi:</div>
            <StatusBadge status={pub.status_verifikasi} size="md" />
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
            <span className="text-slate-400 block">Dosen Pembimbing / Pendamping:</span>
            <span className="font-medium text-slate-800 block">{verifikatorDisplay}</span>
            {pub.catatan_verifikasi && (
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                {pub.catatan_verifikasi}
              </p>
            )}
            <p className="text-[11px] text-slate-400 pt-1">
              Status tahapan diperbarui langsung oleh {publisherType === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'} pem-publish.
            </p>
          </div>
        </div>
      </div>

      {/* Review Internal Sebelum Diajukan (FR-31) */}
      <div className="card space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Review Internal Naskah (FR-31)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan telaah dari dosen reviewer internal (bukan penulis) sebelum naskah diajukan.
          </p>
        </div>
        {!pub.reviews || pub.reviews.length === 0 ? (
          <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-4">
            Belum ada penugasan dosen reviewer internal pada publikasi ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pub.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      {rev.reviewer_nama || rev.reviewer?.nama_lengkap || rev.reviewer_id}
                    </span>
                    <StatusBadge status={rev.status} size="sm" />
                    {rev.rekomendasi && <StatusBadge status={rev.rekomendasi} size="sm" />}
                  </div>
                  {rev.tenggat_review && (
                    <div className="text-[11px] text-slate-400">
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
          Riwayat Tahapan Publikasi (FR-30)
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

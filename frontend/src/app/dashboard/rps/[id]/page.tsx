'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusStepper from '@/components/ui/StatusStepper';
import Modal from '@/components/ui/Modal';
import { mockRpsSubmissions, mockProfiles } from '@/lib/mock-data';
import { rpsService } from '@/lib/api/services/rps.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { RpsSubmission } from '@/lib/types';
import {
  ArrowLeft,
  BookCheck,
  UserCheck,
  CheckCircle2,
  FileText,
  Clock,
  Download,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

const RPS_STEPS = [
  { id: 'DRAF', label: 'Draf' },
  { id: 'DIAJUKAN', label: 'Diajukan' },
  { id: 'DIREVIEW', label: 'Direview' },
  { id: 'DISETUJUI', label: 'Disetujui' },
  { id: 'DISAHKAN', label: 'Disahkan' },
];

export default function DetailRpsPage() {
  const params = useParams();
  const subId = params.id as string;

  const [sub, setSub] = useState<RpsSubmission>(() => {
    const list = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
    return list.find((s) => s.id === subId) || mockRpsSubmissions[0];
  });
  const [modalReviewerOpen, setModalReviewerOpen] = useState(false);
  const [modalSahkanOpen, setModalSahkanOpen] = useState(false);

  useEffect(() => {
    let active = true;
    rpsService
      .getSubmissionById(subId)
      .then((res) => {
        if (active && res.data) {
          setSub(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [subId]);

  // Reviewer assignment state
  const [selectedReviewerId, setSelectedReviewerId] = useState('u-dosen2');
  const [tenggatReview, setTenggatReview] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [catatanPengesahan, setCatatanPengesahan] = useState('');

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...sub,
      status: 'DIREVIEW' as const,
    };
    setSub(updated);
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, sub.id, updated, mockRpsSubmissions);
    try {
      await rpsService.assignReviewer(sub.id, selectedReviewerId);
    } catch {
      // Offline fallback
    }
    setModalReviewerOpen(false);
  };

  const handleSahkan = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...sub,
      status: 'DISAHKAN' as const,
      disahkan_oleh: 'u-kaprodi',
      disahkan_at: new Date().toISOString(),
      catatan_pengesahan: catatanPengesahan || 'RPS disahkan resmi untuk perkuliahan semester berjalan.',
    };
    setSub(updated);
    storageSync.update(STORAGE_KEYS.RPS_SUBMISSIONS, sub.id, updated, mockRpsSubmissions);
    try {
      await rpsService.approveSubmission(sub.id, catatanPengesahan);
    } catch {
      // Offline fallback
    }
    setModalSahkanOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rps"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Pengajuan RPS</span>
        </Link>
      </div>

      <PageHeader
        title={`${sub.course?.kode_mk} — ${sub.course?.nama_mk}`}
        description={`Bobot: ${sub.course?.sks} SKS • Dosen Pengampu: ${sub.dosen_pengampu?.nama_lengkap || 'Dosen Pengampu'}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={sub.status} size="md" />

            {sub.status === 'DIAJUKAN' && (
              <button
                type="button"
                onClick={() => setModalReviewerOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <UserCheck size={14} />
                <span>Tetapkan Reviewer RPS</span>
              </button>
            )}

            {sub.status === 'DISETUJUI' && (
              <button
                type="button"
                onClick={() => setModalSahkanOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Sahkan RPS (Kaprodi)</span>
              </button>
            )}
          </div>
        }
      />

      {/* Stepper Card */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Siklus Telaah & Pengesahan Mutu RPS
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Versi Terkini: v{sub.versi_terbaru}
          </span>
        </div>
        <StatusStepper steps={RPS_STEPS} currentStepId={sub.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Versions & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Riwayat Versi RPS */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Riwayat Versi Berkas RPS
            </h3>

            <div className="space-y-4">
              {sub.versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                        v{ver.nomor_versi}
                      </span>
                      <span className="font-bold text-slate-800">{ver.file_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDateShort(ver.created_at)}</span>
                  </div>

                  {ver.catatan_perubahan && (
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                      Perubahan: &ldquo;{ver.catatan_perubahan}&rdquo;
                    </p>
                  )}

                  {/* Reviews for this version */}
                  {ver.reviews && ver.reviews.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <p className="font-semibold text-slate-700">Hasil Telaah Peer Reviewer:</p>
                      {ver.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">
                              Reviewer: {rev.reviewer?.nama_lengkap || 'Dosen Reviewer'}
                            </span>
                            {rev.rekomendasi && <StatusBadge status={rev.rekomendasi} size="sm" />}
                          </div>

                          {rev.catatan_umum && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              &ldquo;{rev.catatan_umum}&rdquo;
                            </p>
                          )}

                          {rev.items && rev.items.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px]">
                              {rev.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100"
                                >
                                  <span className="text-slate-600 truncate mr-2">{it.komponen.replace(/_/g, ' ')}</span>
                                  <StatusBadge status={it.hasil} size="sm" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: CQI Improvement Plans & Pengesahan */}
        <div className="space-y-6">
          {/* Rencana Perbaikan Evaluasi Sebelumnya */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Tindak Lanjut Perbaikan (CQI)
            </h3>
            <div className="space-y-3 text-xs">
              {sub.improvement_plans && sub.improvement_plans.length > 0 ? (
                sub.improvement_plans.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-semibold text-slate-800">{p.uraian}</p>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    {p.catatan_penerapan && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                        {p.catatan_penerapan}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">Tidak ada rencana perbaikan yang diteruskan.</p>
              )}
            </div>
          </div>

          {/* Pengesahan Kaprodi */}
          {sub.disahkan_at && (
            <div className="card space-y-3 bg-emerald-50/50 border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 size={16} />
                <span>RPS Telah Disahkan Resmi</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Disahkan pada: <strong>{formatDateShort(sub.disahkan_at)}</strong>
              </p>
              {sub.catatan_pengesahan && (
                <p className="text-[11px] text-slate-700 italic bg-white p-2.5 rounded-lg border border-emerald-200">
                  &ldquo;{sub.catatan_pengesahan}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tetapkan Reviewer */}
      <Modal open={modalReviewerOpen} onClose={() => setModalReviewerOpen(false)} title="Tetapkan Reviewer RPS" size="md">
        <form onSubmit={handleAssignReviewer} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Pilih dosen reviewer independen. Berdasarkan aturan mutu SKPL, <strong>reviewer tidak boleh sama dengan dosen pengampu mata kuliah ini</strong>.
          </p>

          <div>
            <label className="label">Pilih Dosen Reviewer</label>
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className="select-field text-xs"
            >
              {mockProfiles
                .filter((p) => p.tipe_pengguna === 'DOSEN' && p.id !== sub.dosen_pengampu_id)
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
              value={tenggatReview}
              onChange={(e) => setTenggatReview(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalReviewerOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Tugaskan Reviewer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Sahkan RPS */}
      <Modal open={modalSahkanOpen} onClose={() => setModalSahkanOpen(false)} title="Pengesahan Dokumen RPS (Kaprodi)" size="md">
        <form onSubmit={handleSahkan} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 leading-relaxed">
            Seluruh peer reviewer telah memberikan rekomendasi <strong>DISETUJUI</strong>. Dengan melakukan pengesahan, dokumen RPS ini menjadi pedoman kurikulum resmi untuk semester berjalan.
          </div>

          <div>
            <label className="label">Catatan Pengesahan Kaprodi</label>
            <textarea
              rows={3}
              value={catatanPengesahan}
              onChange={(e) => setCatatanPengesahan(e.target.value)}
              placeholder="RPS disahkan resmi dan memenuhi standar mutu CPL prodi..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalSahkanOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700">
              Konfirmasi Sahkan RPS
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquareHeart,
  ShieldCheck,
  ShieldAlert,
  Lock,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileText,
  Download,
  Star,
  Plus,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusStepper } from '@/components/ui/StatusStepper';
import ThreadChat from '@/components/ui/ThreadChat';
import { mockComplaints, mockProfiles } from '@/lib/mock-data';
import { complaintService } from '@/lib/api/services/complaint.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Complaint, ComplaintMessage, ComplaintStatus, Disposition } from '@/lib/types';

export default function DetailKelolaAduanPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint>(() => {
    const list = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
    return list.find((c) => c.id === complaintId) || mockComplaints[0];
  });

  useEffect(() => {
    let active = true;
    complaintService
      .getComplaintById(complaintId)
      .then((res) => {
        if (active && res.data) {
          setComplaint(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [complaintId]);

  // Disposition form state
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [disposisiForm, setDisposisiForm] = useState({
    penanggung_jawab_id: 'u-admin',
    tenggat: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    catatan: '',
  });

  // Resolution form state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stepper stages
  const stages = [
    { key: 'DITERIMA', label: 'Diterima' },
    { key: 'DIDISPOSISIKAN', label: 'Didisposisi' },
    { key: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti' },
    { key: 'SELESAI', label: 'Selesai' },
  ];

  let currentStageKey = 'DITERIMA';
  if (complaint.status === 'SELESAI') {
    currentStageKey = 'SELESAI';
  } else if (complaint.status === 'DITINDAKLANJUTI') {
    currentStageKey = 'DITINDAKLANJUTI';
  } else if (complaint.dispositions && complaint.dispositions.length > 0) {
    currentStageKey = 'DIDISPOSISIKAN';
  }

  // Handle ThreadChat message
  const handleSendMessage = async (text: string, isInternal: boolean) => {
    const newMessage: ComplaintMessage = {
      id: `cm-${Date.now()}`,
      complaint_id: complaint.id,
      urutan: (complaint.messages?.length || 0) + 1,
      pengirim: 'PETUGAS',
      sender_user_id: 'u-pengelola-aduan',
      sender_name: isInternal ? 'Catatan Internal Staf' : 'Pengelola Aduan Prodi',
      isi: text,
      is_catatan_internal: isInternal,
      tanggal: new Date().toISOString(),
    };

    const updated = {
      ...complaint,
      messages: [...(complaint.messages || []), newMessage],
    };

    setComplaint(updated);
    storageSync.update(STORAGE_KEYS.COMPLAINTS, complaint.id, updated, mockComplaints);

    try {
      await complaintService.replyComplaint(complaint.id, {
        isi: text,
        is_internal: isInternal,
      });
    } catch {
      // Offline fallback
    }

    setToastMessage(isInternal ? 'Catatan internal tersimpan.' : 'Pesan terkirim ke pelapor.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Add Disposition
  const handleSaveDisposisi = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDisp: Disposition = {
      id: `disp-${Date.now()}`,
      complaint_id: complaint.id,
      didisposisi_oleh: 'u-pengelola-aduan',
      penanggung_jawab_id: disposisiForm.penanggung_jawab_id,
      tenggat: disposisiForm.tenggat,
      catatan: disposisiForm.catatan,
      status: 'AKTIF',
      created_at: new Date().toISOString(),
    };

    const updated = {
      ...complaint,
      status: 'DITINDAKLANJUTI' as const,
      dispositions: [...(complaint.dispositions || []), newDisp],
    };

    setComplaint(updated);
    storageSync.update(STORAGE_KEYS.COMPLAINTS, complaint.id, updated, mockComplaints);

    try {
      await complaintService.createDisposition(complaint.id, {
        penanggung_jawab_id: disposisiForm.penanggung_jawab_id,
        catatan: disposisiForm.catatan,
        tenggat: disposisiForm.tenggat,
      });
    } catch {
      // Offline fallback
    }

    setShowDisposisiModal(false);
    setToastMessage('Disposisi baru berhasil ditetapkan.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Complete Complaint
  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const completionMessage: ComplaintMessage = {
      id: `cm-res-${Date.now()}`,
      complaint_id: complaint.id,
      urutan: (complaint.messages?.length || 0) + 1,
      pengirim: 'PETUGAS',
      sender_user_id: 'u-pengelola-aduan',
      sender_name: 'Pengelola Aduan Prodi',
      isi: `Aduan telah diselesaikan oleh tim pengelola dengan tindak lanjut: ${resolutionNote}`,
      is_catatan_internal: false,
      tanggal: new Date().toISOString(),
    };

    const updated = {
      ...complaint,
      status: 'SELESAI' as const,
      tanggal_selesai: new Date().toISOString().split('T')[0],
      messages: [...(complaint.messages || []), completionMessage],
    };

    setComplaint(updated);
    storageSync.update(STORAGE_KEYS.COMPLAINTS, complaint.id, updated, mockComplaints);

    try {
      await complaintService.resolveComplaint(complaint.id, {
        solusi: resolutionNote,
      });
    } catch {
      // Offline fallback
    }

    setShowResolveModal(false);
    setToastMessage('Aduan berhasil ditandai selesai.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={complaint.is_sensitif ? '/dashboard/kelola/aduan/sensitif' : '/dashboard/kelola/aduan'}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Antrean Aduan
        </Link>
        <div className="flex items-center gap-2">
          {complaint.is_sensitif && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              Sensitif (Satgas PPKPT)
            </span>
          )}
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <PageHeader
        title={complaint.judul}
        subtitle={`${complaint.nomor_aduan} • Tanggal Lapor: ${formatDate(complaint.tanggal_diterima)}`}
        badge={
          <span className="font-mono text-xs rounded bg-slate-100 px-2 py-0.5 text-slate-600 border border-slate-200">
            {complaint.kode_tiket}
          </span>
        }
      />

      {toastMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lifecycle Progress Stepper */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <StatusStepper stages={stages} currentStageKey={currentStageKey} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint Details & Dispositions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Anonymity Banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-blue-900">Privasi Pelapor Terlindungi Penuh</p>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                Pelapor berstatus Mahasiswa Anonim. Seluruh respon publik yang Anda kirim pada kolom pesan di
                sebelah kanan dapat dipantau oleh mahasiswa melalui portal pelacakan tiket mandiri.
              </p>
            </div>
          </div>

          {/* Uraian Aduan */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Uraian Laporan Mahasiswa</h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Kategori: {complaint.kategori.replace('_', ' ')}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {complaint.uraian}
            </p>

            {/* Lampiran Bukti */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Lampiran Berkas Pendukung:</p>
              {complaint.lampiran && complaint.lampiran.length > 0 ? (
                <div className="space-y-1.5">
                  {complaint.lampiran.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-slate-800">{file}</span>
                      </div>
                      <button
                        onClick={() => alert(`Mengunduh berkas: ${file}`)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-medium"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">Tidak ada lampiran berkas pendukung.</p>
              )}
            </div>

            {/* If resolved: feedback rating */}
            {complaint.rating_kepuasan && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
                <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  Penilaian Kepuasan dari Pelapor
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= complaint.rating_kepuasan!
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-amber-800">
                    {complaint.rating_kepuasan} / 5
                  </span>
                </div>
                {complaint.komentar_kepuasan && (
                  <p className="text-xs text-amber-900 italic">
                    &ldquo;{complaint.komentar_kepuasan}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Riwayat Disposisi */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Penetapan Disposisi Petugas</h3>
                <p className="text-xs text-slate-500">Tugas penanganan yang diberikan kepada staf atau dosen</p>
              </div>
              <button
                onClick={() => setShowDisposisiModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Disposisi
              </button>
            </div>

            {complaint.dispositions && complaint.dispositions.length > 0 ? (
              <div className="space-y-3">
                {complaint.dispositions.map((disp, index) => {
                  const staff = mockProfiles.find((p) => p.id === disp.penanggung_jawab_id);
                  const assigner = mockProfiles.find((p) => p.id === disp.didisposisi_oleh);
                  return (
                    <div
                      key={disp.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                          {staff?.nama_lengkap || disp.penanggung_jawab_id}
                        </span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {disp.status}
                        </span>
                      </div>
                      <p className="text-slate-600">{disp.catatan}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 pt-2">
                        <span>Oleh: {assigner?.nama_lengkap || 'Pengelola Aduan'}</span>
                        <span className="font-medium text-red-600">
                          Tenggat: {formatDate(disp.tenggat)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Belum ada penugasan disposisi untuk aduan ini.
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500">Aksi Penanganan Aduan:</span>
            <div className="flex items-center gap-2">
              {complaint.status !== 'SELESAI' && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Tandai Selesai &amp; Solutif
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Utas Chat & Catatan Internal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Utas Komunikasi &amp; Catatan Internal</h3>
              <p className="text-xs text-slate-500">
                Pesan publik terlihat oleh pelapor. Centang <em>Catatan Internal</em> untuk diskusi rahasia tim petugas.
              </p>
            </div>

            <ThreadChat
              messages={complaint.messages || []}
              isStaff={true}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>

      {/* Modal Tambah Disposisi */}
      {showDisposisiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Penugasan Disposisi</h3>
              <button
                onClick={() => setShowDisposisiModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDisposisi} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <select
                  value={disposisiForm.penanggung_jawab_id}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, penanggung_jawab_id: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {mockProfiles
                    .filter((p) => p.tipe_pengguna === 'DOSEN' || p.tipe_pengguna === 'TENDIK')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_lengkap} ({p.tipe_pengguna})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Tenggat Waktu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={disposisiForm.tenggat}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, tenggat: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruksi / Catatan Tindakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={disposisiForm.catatan}
                  onChange={(e) =>
                    setDisposisiForm({ ...disposisiForm, catatan: e.target.value })
                  }
                  required
                  placeholder="Deskripsikan langkah teknis penanganan yang harus dilakukan..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDisposisiModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Simpan Disposisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tandai Selesai */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Penyelesaian Aduan Mahasiswa</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Solusi / Tindakan Perbaikan Selesai <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  placeholder="Contoh: Unit lampu proyektor telah diganti dengan suku cadang baru dan diuji coba siap digunakan praktikum..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <p className="text-xs text-slate-500">
                Pesan solusi ini akan dikirimkan ke mahasiswa pelapor. Mahasiswa akan dapat memberikan penilaian
                bintang atas kepuasan penanganan.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Konfirmasi Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


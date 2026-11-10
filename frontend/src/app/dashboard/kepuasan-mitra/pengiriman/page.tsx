'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare, Copy, Check, Edit3 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyTemplates, mockSurveyInvitations } from '@/lib/mock-data';
import type { PartnerSurveyTemplate, PartnerSurveyInvitation, PartnerSurveyResponse, SurveyProgram } from '@/lib/types';

function PengirimanMitraContent() {
  const searchParams = useSearchParams();
  const initialProgram = (searchParams?.get('program') as SurveyProgram) || 'ALL';

  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>([]);
  const [invitations, setInvitations] = useState<PartnerSurveyInvitation[]>([]);
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'KP' | 'PSI' | 'PDLK'>(
    initialProgram === 'KP' || initialProgram === 'PSI' || initialProgram === 'PDLK' ? initialProgram : 'ALL'
  );
  const [activeModal, setActiveModal] = useState<{ type: 'LINK' | 'MANUAL'; invitation: PartnerSurveyInvitation } | null>(null);
  const [copied, setCopied] = useState(false);

  // Manual input form states
  const [manualPenilai, setManualPenilai] = useState('');
  const [manualJabatan, setManualJabatan] = useState('');
  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [manualCatatan, setManualCatatan] = useState('');

  useEffect(() => {
    setTemplates(storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates));
    setInvitations(storageSync.get<PartnerSurveyInvitation[]>(STORAGE_KEYS.SURVEY_INVITATIONS, mockSurveyInvitations));
  }, []);

  const filtered = filterProgram === 'ALL'
    ? invitations
    : invitations.filter((i) => i.placement?.program === filterProgram);

  const getTemplateForInv = (inv: PartnerSurveyInvitation) =>
    templates.find((t) => t.id === inv.template_id) || templates[0];

  const handleTemplateChange = (invId: string, newTemplateId: string) => {
    const nextInvs = invitations.map((inv) =>
      inv.id === invId ? { ...inv, template_id: newTemplateId } : inv
    );
    setInvitations(nextInvs);
    storageSync.set(STORAGE_KEYS.SURVEY_INVITATIONS, nextInvs);
  };

  const handleSendLink = (inv: PartnerSurveyInvitation) => {
    const nextStatus: 'TERKIRIM' | 'DIISI' = inv.status === 'DIISI' ? 'DIISI' : 'TERKIRIM';
    const nextInvs: PartnerSurveyInvitation[] = invitations.map((i) =>
      i.id === inv.id ? { ...i, status: nextStatus, dikirim_at: new Date().toISOString() } : i
    );
    setInvitations(nextInvs);
    storageSync.set(STORAGE_KEYS.SURVEY_INVITATIONS, nextInvs);
    setActiveModal({ type: 'LINK', invitation: { ...inv, status: nextStatus } });
  };

  const getSurveyLink = (inv: PartnerSurveyInvitation) => {
    const token = inv.token_plain || inv.token_hash || inv.id;
    return typeof window !== 'undefined' ? `${window.location.origin}/mitra/isi/${token}` : `/mitra/isi/${token}`;
  };

  const handleCopyLink = (inv: PartnerSurveyInvitation) => {
    copyToClipboard(getSurveyLink(inv));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (inv: PartnerSurveyInvitation) => {
    const link = getSurveyLink(inv);
    const pic = inv.placement?.partner?.nama_kontak || 'Bapak/Ibu Pembimbing';
    const mitra = inv.placement?.partner?.nama_mitra || 'Mitra Perusahaan';
    const mhs = inv.placement?.student?.nama_lengkap || 'Mahasiswa';
    const prog = inv.placement?.program || 'Kerja Praktik';
    const phone = inv.placement?.partner?.telepon_kontak?.replace(/[^0-9]/g, '') || '628123456789';

    const text = encodeURIComponent(
      `Yth. Bapak/Ibu ${pic} (${mitra}),\n\n` +
      `Sehubungan dengan program ${prog} mahasiswa kami (${mhs}), kami memohon kesediaan Bapak/Ibu mengisi kuesioner evaluasi kepuasan mitra pada tautan berikut:\n${link}\n\n` +
      `Pengisian membutuhkan waktu <3 menit tanpa perlu login. Terima kasih atas kerja samanya.\n\n— Program Studi Sistem Informasi`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const openManualModal = (inv: PartnerSurveyInvitation) => {
    const tmpl = getTemplateForInv(inv);
    const initialAspectScores: Record<string, number> = {};
    (tmpl?.aspek || []).forEach((asp) => {
      initialAspectScores[asp.id] = 5;
    });

    setManualPenilai(inv.placement?.partner?.nama_kontak || '');
    setManualJabatan('Pembimbing Lapangan Mitra');
    setManualScores(initialAspectScores);
    setManualCatatan('');
    setActiveModal({ type: 'MANUAL', invitation: inv });
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const inv = activeModal.invitation;
    const tmpl = getTemplateForInv(inv);
    const respId = `resp-${Date.now()}`;

    const newResponse: PartnerSurveyResponse = {
      id: respId,
      template_id: tmpl?.id || inv.template_id,
      placement_id: inv.placement_id,
      invitation_id: inv.id,
      sumber: 'INPUT_KOORDINATOR',
      status: 'TERKIRIM',
      nama_pengisi: manualPenilai.trim() || 'Pembimbing Lapangan',
      jabatan_pengisi: manualJabatan.trim() || undefined,
      komentar: manualCatatan.trim() || undefined,
      diinput_oleh: 'u-koordinator',
      submitted_at: new Date().toISOString(),
      placement: inv.placement,
      answers: Object.entries(manualScores).map(([aspectId, score], idx) => ({
        id: `ans-${respId}-${idx}`,
        response_id: respId,
        aspect_id: aspectId,
        skor: score,
      })),
    };

    storageSync.prepend(STORAGE_KEYS.SURVEY_RESPONSES, newResponse);

    const nextInvs = invitations.map((i) =>
      i.id === inv.id ? { ...i, status: 'DIISI' as const } : i
    );
    setInvitations(nextInvs);
    storageSync.set(STORAGE_KEYS.SURVEY_INVITATIONS, nextInvs);

    if (tmpl) {
      const nextTmpls = templates.map((t) =>
        t.id === tmpl.id ? { ...t, total_responden: (t.total_responden || 0) + 1 } : t
      );
      setTemplates(nextTmpls);
      storageSync.set(STORAGE_KEYS.SURVEYS, nextTmpls);
    }

    setActiveModal(null);
  };

  const columns: DataTableColumn<PartnerSurveyInvitation>[] = [
    {
      key: 'mitra',
      header: 'Mitra & Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.placement?.partner?.nama_mitra || 'Mitra Industri'}</div>
          <div className="text-xs text-slate-500 mt-0.5">PIC: {r.placement?.partner?.nama_kontak || '-'} ({r.placement?.partner?.telepon_kontak || '-'})</div>
          <div className="text-xs text-slate-400 mt-0.5">Mhs: {r.placement?.student?.nama_lengkap || '-'} • NIM: {r.placement?.student?.nomor_induk || '-'}</div>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Program',
      render: (r) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {r.placement?.program || 'KP'}
        </span>
      ),
    },
    {
      key: 'kuesioner',
      header: 'Kuesioner Instrumen',
      render: (r) => {
        const assignedTmpl = getTemplateForInv(r);
        return (
          <div className="space-y-1 max-w-xs">
            <select
              value={r.template_id}
              onChange={(e) => handleTemplateChange(r.id, e.target.value)}
              className="select-field text-xs py-1 px-2 font-medium"
              title="Pilih instrumen template untuk penempatan ini"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.nama} ({tmpl.status})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400">
              {assignedTmpl?.aspek?.length || 0} Aspek • Skala 1–{assignedTmpl?.skala_maks || 5}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Survei',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} size="sm" />
          {r.dikirim_at && (
            <div className="text-[10px] text-slate-400 mt-0.5">Kirim: {r.dikirim_at.split('T')[0]}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi Pengiriman & Pengisian',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === 'DIISI' ? (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
              <Check size={12} /> Kuesioner Selesai
            </span>
          ) : (
            <>
              <button
                onClick={() => handleSendLink(r)}
                className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                title="Dapatkan tautan unik kuesioner"
              >
                <Send size={12} /> {r.status === 'TERKIRIM' ? 'Kirim Ulang' : 'Kirim Tautan'}
              </button>
              <button
                onClick={() => handleWhatsApp(r)}
                className="btn-secondary text-xs px-2 py-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 inline-flex items-center gap-1"
                title="Bagikan pesan ke WhatsApp PIC Mitra"
              >
                <MessageSquare size={12} /> WA
              </button>
              <button
                onClick={() => openManualModal(r)}
                className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
                title="Input nilai kuesioner jika mitra mengisi via form cetak"
              >
                <Edit3 size={12} /> Manual
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengiriman & Input Mitra"
        description="Kirim tautan kuesioner ke mitra via email/WhatsApp atau catat hasil evaluasi secara manual (FR-27)."
      />

      <div className="card">
        {/* Filter Bar: Hanya Filter Program Sesuai Arahan (Gambar 3 Dihapus) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Program:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'KP', 'PSI', 'PDLK'] as const).map((prog) => (
                <button
                  key={prog}
                  onClick={() => setFilterProgram(prog)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filterProgram === prog ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {prog === 'ALL' ? 'Semua Program' : prog}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400">
            Menampilkan {filtered.length} penempatan mitra
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada penempatan mitra untuk filter ini."
        />
      </div>

      {/* Modal Tautan Terkirim */}
      <Modal
        open={activeModal?.type === 'LINK'}
        onClose={() => setActiveModal(null)}
        title="Tautan Survei Mitra Siap Dikirim"
        size="md"
      >
        {activeModal?.type === 'LINK' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 leading-relaxed">
              Tautan survei unik untuk <strong>{activeModal.invitation.placement?.partner?.nama_mitra}</strong> (mahasiswa: {activeModal.invitation.placement?.student?.nama_lengkap}) telah aktif selama 30 hari.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tautan Unik Kuesioner:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getSurveyLink(activeModal.invitation)}
                  className="input-field font-mono text-xs text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeModal.invitation)}
                  className="btn-primary text-xs px-3 py-2.5 shrink-0 flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleWhatsApp(activeModal.invitation)}
                className="btn-secondary text-xs px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
              >
                <MessageSquare size={14} /> Bagikan via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-primary text-xs px-4 py-2"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Input Manual */}
      <Modal
        open={activeModal?.type === 'MANUAL'}
        onClose={() => setActiveModal(null)}
        title="Input Hasil Evaluasi Mitra Manual"
        size="lg"
      >
        {activeModal?.type === 'MANUAL' && (
          <form onSubmit={handleSaveManual} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-2">
              <div><strong>Mitra:</strong> {activeModal.invitation.placement?.partner?.nama_mitra}</div>
              <div><strong>Program:</strong> {activeModal.invitation.placement?.program}</div>
              <div><strong>Mahasiswa:</strong> {activeModal.invitation.placement?.student?.nama_lengkap} ({activeModal.invitation.placement?.student?.nomor_induk})</div>
              <div><strong>Instrumen:</strong> {getTemplateForInv(activeModal.invitation)?.nama}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pengisi Mitra</label>
                <input
                  type="text"
                  value={manualPenilai}
                  onChange={(e) => setManualPenilai(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Jabatan Pengisi</label>
                <input
                  type="text"
                  value={manualJabatan}
                  onChange={(e) => setManualJabatan(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Skor Penilaian per Aspek (Skala 1 - 5)
              </label>
              <div className="space-y-2.5">
                {(getTemplateForInv(activeModal.invitation)?.aspek || []).map((aspek, idx) => (
                  <div key={aspek.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{idx + 1}. {aspek.nama_aspek}</div>
                      <div className="text-[11px] text-slate-400">Bobot {aspek.bobot}% {aspek.deskripsi ? `• ${aspek.deskripsi}` : ''}</div>
                    </div>
                    <select
                      value={manualScores[aspek.id] || 5}
                      onChange={(e) => setManualScores({ ...manualScores, [aspek.id]: Number(e.target.value) })}
                      className="select-field w-32 text-xs font-bold text-blue-700"
                    >
                      <option value={5}>5 - Sangat Baik</option>
                      <option value={4}>4 - Baik</option>
                      <option value={3}>3 - Cukup</option>
                      <option value={2}>2 - Kurang</option>
                      <option value={1}>1 - Sangat Kurang</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan / Komentar Mitra</label>
              <textarea
                rows={2}
                value={manualCatatan}
                onChange={(e) => setManualCatatan(e.target.value)}
                placeholder="Masukkan catatan penilaian jika ada..."
                className="input-field resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary text-xs px-4 py-2">
                Simpan Hasil Evaluasi
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat pengiriman mitra...</div>}>
      <PengirimanMitraContent />
    </Suspense>
  );
}

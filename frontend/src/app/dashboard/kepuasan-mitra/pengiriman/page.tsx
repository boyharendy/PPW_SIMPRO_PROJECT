'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare, Copy, Check, Edit3, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyTemplates, mockSurveyInvitations } from '@/lib/mock-data';
import type { PartnerSurveyTemplate, PartnerSurveyInvitation, PartnerSurveyResponse, SurveyProgram } from '@/lib/types';
import CreateInvitationModal from './CreateInvitationModal';
import ManualInputModal from './ManualInputModal';
import MotionCard from '@/components/motion/MotionCard';

function PengirimanMitraContent() {
  const searchParams = useSearchParams();
  const initialProgram = (searchParams?.get('program') as SurveyProgram) || 'ALL';

  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>([]);
  const [invitations, setInvitations] = useState<PartnerSurveyInvitation[]>([]);
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'KP' | 'PSI' | 'PDLK'>(
    initialProgram === 'KP' || initialProgram === 'PSI' || initialProgram === 'PDLK' ? initialProgram : 'ALL'
  );
  const [linkModalInv, setLinkModalInv] = useState<PartnerSurveyInvitation | null>(null);
  const [manualModalInv, setManualModalInv] = useState<PartnerSurveyInvitation | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setTemplates(storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates));
      setInvitations(storageSync.get<PartnerSurveyInvitation[]>(STORAGE_KEYS.SURVEY_INVITATIONS, mockSurveyInvitations));
    };
    loadData();
    window.addEventListener('simpro_storage_change', loadData);
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('simpro_storage_change', loadData);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  const filtered = filterProgram === 'ALL'
    ? invitations
    : invitations.filter((i) => i.placement?.program === filterProgram);

  const getTemplateForInv = (inv: PartnerSurveyInvitation) =>
    templates.find((t) => t.id === inv.template_id) || templates[0];

  const handleTemplateChange = (invId: string, templateId: string) => {
    const nextInvs = invitations.map((inv) =>
      inv.id === invId ? { ...inv, template_id: templateId } : inv
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
    setLinkModalInv({ ...inv, status: nextStatus });
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

  const handleCreatedInvitation = (newInv: PartnerSurveyInvitation) => {
    const nextInvs = [newInv, ...invitations];
    setInvitations(nextInvs);
    storageSync.set(STORAGE_KEYS.SURVEY_INVITATIONS, nextInvs);
  };

  const handleSaveManual = (manualData: {
    namaPenilai: string;
    jabatan: string;
    scores: Record<string, number>;
    catatan: string;
  }) => {
    if (!manualModalInv) return;
    const inv = manualModalInv;
    const tmpl = getTemplateForInv(inv);
    const respId = `resp-${Date.now()}`;

    const newResponse: PartnerSurveyResponse = {
      id: respId,
      template_id: tmpl?.id || inv.template_id,
      placement_id: inv.placement_id,
      invitation_id: inv.id,
      sumber: 'INPUT_KOORDINATOR',
      status: 'TERKIRIM',
      nama_pengisi: manualData.namaPenilai.trim() || 'Pembimbing Lapangan',
      jabatan_pengisi: manualData.jabatan.trim() || undefined,
      komentar: manualData.catatan.trim() || undefined,
      diinput_oleh: 'u-koordinator',
      submitted_at: new Date().toISOString(),
      placement: inv.placement,
      answers: Object.entries(manualData.scores).map(([aspectId, score], idx) => ({
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

    setManualModalInv(null);
  };

  const columns: DataTableColumn<PartnerSurveyInvitation>[] = [
    {
      key: 'mitra',
      header: 'Mitra & Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.placement?.partner?.nama_mitra || 'Mitra Industri'}</div>
          <div className="text-xs text-slate-500 mt-1">PIC: {r.placement?.partner?.nama_kontak || '-'} ({r.placement?.partner?.telepon_kontak || '-'})</div>
          <div className="text-xs text-slate-500 mt-0.5">Mhs: {r.placement?.student?.nama_lengkap || '-'} • NIM: {r.placement?.student?.nomor_induk || '-'}</div>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Program',
      render: (r) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
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
          <div className="space-y-1 min-w-[220px] max-w-[280px]">
            <select
              value={r.template_id}
              onChange={(e) => handleTemplateChange(r.id, e.target.value)}
              className="select-compact w-full text-xs font-medium text-slate-700"
              title="Pilih instrumen template untuk penempatan ini"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.nama} ({tmpl.status})
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500 pl-0.5">
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
            <div className="text-xs text-slate-500 mt-1">Kirim: {r.dikirim_at.split('T')[0]}</div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi Pengiriman & Pengisian',
      className: 'text-right min-w-[280px] whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          {r.status === 'DIISI' ? (
            <span className="h-8 px-3 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Check size={13} /> Kuesioner Selesai
            </span>
          ) : (
            <>
              <button
                onClick={() => handleSendLink(r)}
                className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
                title="Dapatkan tautan unik kuesioner"
              >
                <Send size={13} /> {r.status === 'TERKIRIM' ? 'Kirim Ulang' : 'Kirim Tautan'}
              </button>
              <button
                onClick={() => handleWhatsApp(r)}
                className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
                title="Bagikan pesan ke WhatsApp PIC Mitra"
              >
                <MessageSquare size={13} /> WA
              </button>
              <button
                onClick={() => setManualModalInv(r)}
                className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
                title="Input nilai kuesioner jika mitra mengisi via form cetak"
              >
                <Edit3 size={13} /> Manual
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
        description="Distribusi tautan kuesioner ke pembimbing mitra industri serta pencatatan evaluasi manual."
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> Buat Undangan Baru
          </button>
        }
      />

      <MotionCard index={0} interactive={false} className="card">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Program:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['ALL', 'KP', 'PSI', 'PDLK'] as const).map((prog) => (
                <button
                  key={prog}
                  onClick={() => setFilterProgram(prog)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterProgram === prog ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {prog === 'ALL' ? 'Semua Program' : prog}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filtered.length} penempatan mitra
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="Tidak ada penempatan mitra untuk filter ini."
        />
      </MotionCard>

      {/* Modal Buat Undangan Baru */}
      <CreateInvitationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        templates={templates}
        onCreated={handleCreatedInvitation}
      />

      {/* Modal Input Manual */}
      <ManualInputModal
        open={Boolean(manualModalInv)}
        onClose={() => setManualModalInv(null)}
        invitation={manualModalInv}
        template={manualModalInv ? getTemplateForInv(manualModalInv) : templates[0]}
        onSave={handleSaveManual}
      />

      {/* Modal Tautan Terkirim */}
      <Modal
        open={Boolean(linkModalInv)}
        onClose={() => setLinkModalInv(null)}
        title="Tautan Survei Mitra Siap Dikirim"
        size="md"
      >
        {linkModalInv && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 leading-relaxed">
              Tautan survei unik untuk <strong>{linkModalInv.placement?.partner?.nama_mitra}</strong> (mahasiswa: {linkModalInv.placement?.student?.nama_lengkap}) telah aktif selama 30 hari.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tautan Unik Kuesioner:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getSurveyLink(linkModalInv)}
                  className="input-field font-mono text-xs text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(linkModalInv)}
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
                onClick={() => handleWhatsApp(linkModalInv)}
                className="btn-secondary text-xs px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
              >
                <MessageSquare size={14} /> Bagikan via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setLinkModalInv(null)}
                className="btn-primary text-xs px-4 py-2"
              >
                Tutup
              </button>
            </div>
          </div>
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

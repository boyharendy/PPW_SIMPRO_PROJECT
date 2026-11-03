'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import {
  mockPlacements,
  mockSurveyInvitations,
  mockSurveyTemplates,
} from '@/lib/mock-data';
import { surveyService } from '@/lib/api/services/survey.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type {
  PartnerSurveyInvitation,
  PartnerSurveyTemplate,
  PartnerSurveyResponse,
} from '@/lib/types';
import {
  Send,
  MessageCircle,
  CheckCircle2,
  FileEdit,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { formatDateShort, copyToClipboard } from '@/lib/utils';

export default function PengirimanMitraPage() {
  const [invitations, setInvitations] = useState<PartnerSurveyInvitation[]>(mockSurveyInvitations);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>('');
  const [modalKirimOpen, setModalKirimOpen] = useState(false);
  const [modalManualOpen, setModalManualOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PartnerSurveyTemplate[]>(mockSurveyTemplates);

  // Manual Form State
  const [manualPartnerName, setManualPartnerName] = useState('');
  const [manualPosition, setManualPosition] = useState('');
  const [manualComment, setManualComment] = useState('');
  const [manualScores, setManualScores] = useState<Record<string, number>>({
    asp1: 5,
    asp2: 4,
    asp3: 5,
    asp4: 4,
  });

  const activeTemplate = availableTemplates[0] || mockSurveyTemplates[0];

  useEffect(() => {
    const localInvs = storageSync.get<PartnerSurveyInvitation[]>(STORAGE_KEYS.SURVEY_INVITATIONS, mockSurveyInvitations);
    if (localInvs && localInvs.length > 0) {
      setInvitations(localInvs);
    }
    const localTmpls = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    if (localTmpls && localTmpls.length > 0) {
      setAvailableTemplates(localTmpls);
    }

    let active = true;
    surveyService
      .getInvitations()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setInvitations(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleKirimTautan = async (placementId: string) => {
    setSelectedPlacementId(placementId);
    const placement = mockPlacements.find((p) => p.id === placementId);
    const randomToken = `token-${placement?.program?.toLowerCase() || 'survey'}-${Date.now().toString(36)}`;
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/mitra/isi/${randomToken}` : '';

    const newInv: PartnerSurveyInvitation = {
      id: `inv-${Date.now()}`,
      template_id: activeTemplate.id,
      placement_id: placementId,
      token_hash: `hash_${randomToken}`,
      token_plain: randomToken,
      status: 'TERKIRIM',
      dikirim_via: 'WHATSAPP',
      dikirim_at: new Date().toISOString(),
      kedaluwarsa_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      jumlah_pengingat: 0,
      dibuat_oleh: 'u-koordinator',
      created_at: new Date().toISOString(),
      placement: placement,
      template: activeTemplate,
    };

    const updated = storageSync.prepend(STORAGE_KEYS.SURVEY_INVITATIONS, newInv, invitations);
    setInvitations(updated);
    setGeneratedLink(fullUrl);
    setModalKirimOpen(true);

    try {
      await surveyService.createInvitation(newInv);
    } catch {
      // Offline fallback
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await copyToClipboard(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleOpenManual = (placementId: string) => {
    setSelectedPlacementId(placementId);
    const placement = mockPlacements.find((p) => p.id === placementId);
    setManualPartnerName(placement?.partner?.nama_kontak || '');
    setManualPosition('Pembimbing Lapangan');
    setModalManualOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const placement = mockPlacements.find((p) => p.id === selectedPlacementId);
    const invId = `inv-manual-${Date.now()}`;
    const respId = `resp-manual-${Date.now()}`;

    const updatedInv: PartnerSurveyInvitation = {
      id: invId,
      template_id: activeTemplate.id,
      placement_id: selectedPlacementId,
      token_hash: 'manual_input',
      status: 'DIISI',
      dikirim_via: 'MANUAL',
      dikirim_at: new Date().toISOString(),
      kedaluwarsa_at: new Date().toISOString(),
      jumlah_pengingat: 0,
      dibuat_oleh: 'u-koordinator',
      created_at: new Date().toISOString(),
      placement: placement,
      template: activeTemplate,
    };

    // Simpan respons penilaian manual ke dalam daftar respons kepuasan mitra (FR-27)
    const manualResponse: PartnerSurveyResponse = {
      id: respId,
      invitation_id: invId,
      template_id: activeTemplate.id,
      placement_id: selectedPlacementId,
      nama_pengisi: manualPartnerName,
      jabatan_pengisi: manualPosition,
      komentar: manualComment || undefined,
      sumber: 'INPUT_KOORDINATOR',
      diinput_oleh: 'u-koordinator',
      submitted_at: new Date().toISOString(),
      placement: placement,
      answers: (activeTemplate.aspek || []).map((asp, i) => ({
        id: `ans-${Date.now()}-${i}`,
        response_id: respId,
        aspect_id: asp.id,
        skor: manualScores[`asp${i + 1}`] || 5,
      })),
    };

    surveyService.saveResponseLocal(manualResponse);
    const updated = storageSync.prepend(STORAGE_KEYS.SURVEY_INVITATIONS, updatedInv, invitations);
    setInvitations(updated);
    setModalManualOpen(false);
    setManualComment('');

    try {
      await surveyService.createInvitation(updatedInv);
    } catch {
      // Offline fallback
    }
  };

  const columns = [
    {
      key: 'mitra',
      header: 'Mitra & Program',
      render: (p: typeof mockPlacements[0]) => {
        return (
          <div>
            <p className="font-semibold text-slate-800 text-xs sm:text-sm">{p.partner?.nama_mitra}</p>
            <p className="text-[11px] text-slate-500">
              <span className="font-bold text-blue-600 mr-2">[{p.program}]</span>
              PIC: {p.partner?.nama_kontak} ({p.partner?.telepon_kontak || '-'})
            </p>
          </div>
        );
      },
    },
    {
      key: 'mahasiswa',
      header: 'Mahasiswa Penempatan',
      render: (p: typeof mockPlacements[0]) => {
        return (
          <div>
            <p className="font-medium text-slate-800 text-xs">{p.student?.nama_lengkap}</p>
            <p className="text-[11px] text-slate-400">NIM: {p.student?.nomor_induk}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Survei',
      render: (p: typeof mockPlacements[0]) => {
        const inv = invitations.find((i) => i.placement_id === p.id);
        const status = inv ? inv.status : 'DIBUAT';
        return (
          <div>
            <StatusBadge status={status} size="sm" />
            {inv?.dikirim_at && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Kirim: {formatDateShort(inv.dikirim_at)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi Pengiriman',
      className: 'text-right',
      render: (p: typeof mockPlacements[0]) => {
        const inv = invitations.find((i) => i.placement_id === p.id);
        const isFilled = inv?.status === 'DIISI';

        if (isFilled) {
          return (
            <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 size={14} /> Kuesioner Selesai
            </span>
          );
        }

        const phone = p.partner?.telepon_kontak || '6281234567890';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const waMsg = encodeURIComponent(
          `Yth. Bapak/Ibu ${p.partner?.nama_kontak} (${p.partner?.nama_mitra}),\n\nKami dari Program Studi Sistem Informasi memohon kesediaan Bapak/Ibu untuk mengisi instrumen evaluasi kepuasan mitra atas mahasiswa kami (${p.student?.nama_lengkap}) melalui tautan berikut:\n${origin}/mitra/isi/${inv?.token_plain || 'telkom-kp-demo-token-1'}\n\nPengisian membutuhkan waktu < 3 menit. Terima kasih atas kerja samanya.`
        );

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => handleKirimTautan(p.id)}
              className="btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1"
              title="Buat Tautan Baru"
            >
              <Send size={12} />
              <span>{inv ? 'Kirim Ulang' : 'Kirim Tautan'}</span>
            </button>

            {inv && (
              <a
                href={`https://wa.me/${phone}?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                title="Bagikan via WhatsApp"
              >
                <MessageCircle size={13} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => handleOpenManual(p.id)}
              className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-slate-600"
              title="Input Manual atas nama Mitra"
            >
              <FileEdit size={13} />
              <span className="hidden sm:inline">Input Manual</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengiriman Tautan & Input Survei Mitra"
        description="Kirimkan tautan instrumen kepuasan kepada kontak mitra melalui surel/WhatsApp, atau lakukan pencatatan manual atas nama mitra."
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={mockPlacements}
          emptyMessage="Belum ada penempatan mahasiswa pada periode aktif"
        />
      </div>

      {/* Modal Tautan Berhasil Dibuat */}
      <Modal open={modalKirimOpen} onClose={() => setModalKirimOpen(false)} title="Tautan Kuesioner Dibuat" size="md">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tautan kuesioner berikut bersifat unik dan berlaku selama 30 hari. Mitra dapat langsung mengisi formulir tanpa perlu login:
          </p>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="text"
              readOnly
              value={generatedLink || ''}
              className="bg-transparent border-none outline-none text-xs w-full text-blue-700 font-mono"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1 flex-shrink-0"
            >
              {linkCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{linkCopied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <a
              href={generatedLink || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <ExternalLink size={13} />
              <span>Buka Formulir Langsung (Pratinjau)</span>
            </a>
            <button
              type="button"
              onClick={() => setModalKirimOpen(false)}
              className="btn-secondary text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Input Manual Koordinator */}
      <Modal open={modalManualOpen} onClose={() => setModalManualOpen(false)} title="Input Kuesioner Manual (Atas Nama Mitra)" size="md">
        <form onSubmit={handleSaveManual} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            Fitur ini digunakan bila mitra telah memberikan jawaban secara fisik/lisan dan koordinator menginputkannya ke dalam sistem (Status: <strong>INPUT_KOORDINATOR</strong>).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Narahubung Pengisi</label>
              <input
                type="text"
                required
                value={manualPartnerName}
                onChange={(e) => setManualPartnerName(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="label">Jabatan di Perusahaan</label>
              <input
                type="text"
                required
                value={manualPosition}
                onChange={(e) => setManualPosition(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-800">Skor Penilaian Aspek (1 - 5):</p>
            {activeTemplate.aspek?.map((asp, i) => (
              <div key={asp.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span className="font-medium text-slate-700">{asp.nama_aspek}</span>
                <select
                  value={manualScores[`asp${i + 1}`] || 5}
                  onChange={(e) =>
                    setManualScores({ ...manualScores, [`asp${i + 1}`]: Number(e.target.value) })
                  }
                  className="select-field text-xs py-1 w-24"
                >
                  <option value={5}>5 (Sangat Baik)</option>
                  <option value={4}>4 (Baik)</option>
                  <option value={3}>3 (Cukup)</option>
                  <option value={2}>2 (Kurang)</option>
                  <option value={1}>1 (Sangat Kurang)</option>
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Komentar / Saran Mitra</label>
            <textarea
              rows={2}
              value={manualComment}
              onChange={(e) => setManualComment(e.target.value)}
              placeholder="Saran peningkatan untuk prodi dan mahasiswa..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalManualOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Simpan Hasil Survei
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

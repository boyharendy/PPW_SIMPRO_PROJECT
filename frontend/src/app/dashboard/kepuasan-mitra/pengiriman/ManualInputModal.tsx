'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import type { PartnerSurveyTemplate, PartnerSurveyInvitation } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  invitation: PartnerSurveyInvitation | null;
  template: PartnerSurveyTemplate;
  onSave: (manualData: {
    namaPenilai: string;
    jabatan: string;
    scores: Record<string, number>;
    catatan: string;
  }) => void;
}

export default function ManualInputModal({ open, onClose, invitation, template, onSave }: Props) {
  const [namaPenilai, setNamaPenilai] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (invitation) {
      setNamaPenilai(invitation.placement?.partner?.nama_kontak || '');
      setJabatan('Pembimbing Lapangan Mitra');
      const initialScores: Record<string, number> = {};
      (template?.aspek || []).forEach((asp) => {
        initialScores[asp.id] = 5;
      });
      setScores(initialScores);
      setCatatan('');
    }
  }, [invitation, template]);

  if (!invitation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ namaPenilai, jabatan, scores, catatan });
  };

  return (
    <Modal open={open} onClose={onClose} title="Input Hasil Evaluasi Mitra Manual" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-2">
          <div><strong>Mitra:</strong> {invitation.placement?.partner?.nama_mitra}</div>
          <div><strong>Program:</strong> {invitation.placement?.program}</div>
          <div><strong>Mahasiswa:</strong> {invitation.placement?.student?.nama_lengkap} ({invitation.placement?.student?.nomor_induk})</div>
          <div><strong>Instrumen:</strong> {template?.nama}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pengisi Mitra</label>
            <input
              type="text"
              value={namaPenilai}
              onChange={(e) => setNamaPenilai(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Jabatan Pengisi</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
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
            {(template?.aspek || []).map((aspek, idx) => (
              <div key={aspek.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{idx + 1}. {aspek.nama_aspek}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Bobot {aspek.bobot}% {aspek.deskripsi ? `• ${aspek.deskripsi}` : ''}</div>
                </div>
                <select
                  value={scores[aspek.id] || 5}
                  onChange={(e) => setScores({ ...scores, [aspek.id]: Number(e.target.value) })}
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
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Masukkan catatan penilaian jika ada..."
            className="input-field resize-none text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Batal
          </button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">
            Simpan Hasil Evaluasi
          </button>
        </div>
      </form>
    </Modal>
  );
}


'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { PartnerSurveyTemplate, PartnerSurveyInvitation } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  templates: PartnerSurveyTemplate[];
  onCreated: (invitation: PartnerSurveyInvitation) => void;
}

export default function CreateInvitationModal({ open, onClose, templates, onCreated }: Props) {
  const [program, setProgram] = useState<'KP' | 'PSI' | 'PDLK'>('KP');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [mitra, setMitra] = useState('');
  const [mahasiswa, setMahasiswa] = useState('');
  const [nim, setNim] = useState('');
  const [pic, setPic] = useState('');
  const [telepon, setTelepon] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitra.trim() || !mahasiswa.trim()) return;

    const assignedTmpl = templates.find((t) => t.id === templateId) || templates[0];
    const invId = `inv-${Date.now()}`;
    const token = `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newInv: PartnerSurveyInvitation = {
      id: invId,
      template_id: assignedTmpl?.id || 'tmpl-kp-2025',
      placement_id: `place-${Date.now()}`,
      token_hash: token,
      token_plain: token,
      status: 'DIBUAT',
      kedaluwarsa_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      jumlah_pengingat: 0,
      dibuat_oleh: 'u-koordinator',
      created_at: new Date().toISOString().split('T')[0],
      placement: {
        id: `place-${Date.now()}`,
        partner_id: `partner-${Date.now()}`,
        student_id: `student-${Date.now()}`,
        academic_period_id: 'period-2025-ganjil',
        program,
        partner: {
          id: `partner-${Date.now()}`,
          nama_mitra: mitra.trim(),
          nama_kontak: pic.trim() || 'Pembimbing Lapangan',
          telepon_kontak: telepon.trim() || '6281234567890',
          is_active: true,
        },
        student: {
          id: `student-${Date.now()}`,
          nama_lengkap: mahasiswa.trim(),
          nomor_induk: nim.trim() || '1201220000',
          email: `${nim || 'mhs'}@student.ac.id`,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      template: assignedTmpl,
    };

    onCreated(newInv);
    setMitra('');
    setMahasiswa('');
    setNim('');
    setPic('');
    setTelepon('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Penempatan Mitra & Buat Undangan" size="md">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Program</label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value as 'KP' | 'PSI' | 'PDLK')}
              className="select-field"
            >
              <option value="KP">Kerja Praktik (KP)</option>
              <option value="PSI">Proyek SI (PSI)</option>
              <option value="PDLK">PDLK</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kuesioner</label>
            <select
              value={templateId || templates[0]?.id}
              onChange={(e) => setTemplateId(e.target.value)}
              className="select-field"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.nama} ({tmpl.program})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Perusahaan / Mitra Industri</label>
          <input
            type="text"
            value={mitra}
            onChange={(e) => setMitra(e.target.value)}
            placeholder="Contoh: PT GoTo Gojek Tokopedia"
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Mahasiswa</label>
            <input
              type="text"
              value={mahasiswa}
              onChange={(e) => setMahasiswa(e.target.value)}
              placeholder="Nama mahasiswa"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">NIM</label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="1201220000"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nama PIC Mitra</label>
            <input
              type="text"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              placeholder="Nama pembimbing"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">No. WhatsApp PIC</label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="08123456789"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Batal
          </button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">
            Simpan & Buat Tautan
          </button>
        </div>
      </form>
    </Modal>
  );
}

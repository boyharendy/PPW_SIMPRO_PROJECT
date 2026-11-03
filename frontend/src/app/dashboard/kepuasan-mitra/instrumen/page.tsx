'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockSurveyTemplates } from '@/lib/mock-data';
import type { PartnerSurveyTemplate, SurveyProgram } from '@/lib/types';
import { Plus, Copy, ArrowRight, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export default function InstrumenKepuasanPage() {
  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>(mockSurveyTemplates);
  const [openModal, setOpenModal] = useState(false);
  const [formProgram, setFormProgram] = useState<SurveyProgram>('KP');
  const [formNama, setFormNama] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    const newTemplate: PartnerSurveyTemplate = {
      id: `tmpl-${formProgram.toLowerCase()}-${Date.now()}`,
      program: formProgram,
      nama: formNama,
      skala_maks: 5,
      status: 'DRAF',
      dibuat_oleh: 'u-koordinator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aspek: [
        { id: `asp-${Date.now()}-1`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Integritas & Etika', bobot: 30, urutan: 1, is_active: true },
        { id: `asp-${Date.now()}-2`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Kompetensi Keilmuan', bobot: 40, urutan: 2, is_active: true },
        { id: `asp-${Date.now()}-3`, template_id: `tmpl-${Date.now()}`, nama_aspek: 'Komunikasi & Adaptasi', bobot: 30, urutan: 3, is_active: true },
      ],
      total_responden: 0,
    };

    setTemplates([newTemplate, ...templates]);
    setOpenModal(false);
    setFormNama('');
  };

  const handleDuplicate = (tmpl: PartnerSurveyTemplate) => {
    const duplicated: PartnerSurveyTemplate = {
      ...tmpl,
      id: `${tmpl.id}-copy-${Date.now()}`,
      nama: `${tmpl.nama} (Salinan Baru)`,
      status: 'DRAF',
      total_responden: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTemplates([duplicated, ...templates]);
  };

  const columns = [
    {
      key: 'program',
      header: 'Program',
      render: (row: PartnerSurveyTemplate) => (
        <span className="font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md">
          {row.program}
        </span>
      ),
    },
    {
      key: 'nama',
      header: 'Nama Template Instrumen',
      render: (row: PartnerSurveyTemplate) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs sm:text-sm">{row.nama}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Skala 1–{row.skala_maks} • Dibuat: {formatDateShort(row.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: 'aspek',
      header: 'Jumlah Aspek',
      render: (row: PartnerSurveyTemplate) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.aspek?.length || 0} Butir Penilaian
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: PartnerSurveyTemplate) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: PartnerSurveyTemplate) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleDuplicate(row)}
            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-slate-600 hover:text-blue-600"
            title="Duplikasi Template"
          >
            <Copy size={13} />
            <span className="hidden sm:inline">Duplikasi</span>
          </button>
          <Link
            href={`/dashboard/kepuasan-mitra/instrumen/${row.id}`}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <Settings2 size={13} />
            <span>Atur Aspek</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instrumen Kuesioner Kepuasan Mitra"
        description="Kelola template kuesioner, bobot penilaian, dan aspek evaluasi per program (KP, PSI, PDLK)."
        action={
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Buat Template Baru</span>
          </button>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={templates}
          emptyMessage="Belum ada template instrumen kepuasan"
        />
      </div>

      {/* Modal Buat Template */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Buat Template Kuesioner Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Program Akademik</label>
            <select
              value={formProgram}
              onChange={(e) => setFormProgram(e.target.value as SurveyProgram)}
              className="select-field text-xs"
            >
              <option value="KP">Kerja Praktik (KP)</option>
              <option value="PSI">Proyek Sistem Informasi (PSI)</option>
              <option value="PDLK">Pembelajaran di Luar Kampus (PDLK / Magang)</option>
            </select>
          </div>

          <div>
            <label className="label">Nama Template</label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Kuesioner Kepuasan Mitra KP 2025/2026"
              className="input-field text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
            Aspek standar (Integritas, Kompetensi, Komunikasi) akan dibuat otomatis sebagai draf awal dan dapat disesuaikan pada halaman detail instrumen.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="btn-secondary text-xs"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Simpan & Lanjutkan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


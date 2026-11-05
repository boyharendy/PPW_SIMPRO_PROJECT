'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal, Copy, Send, FileEdit } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface InstrumentTemplate {
  id: string;
  program: 'KP' | 'PSI' | 'PDLK';
  nama: string;
  skalaMaks: number;
  dibuatAt: string;
  jumlahAspek: number;
  jumlahResponden: number;
  status: 'AKTIF' | 'DRAF' | 'ARSIP';
}

const INITIAL_TEMPLATES: InstrumentTemplate[] = [
  {
    id: 'tmpl-kp-2025',
    program: 'KP',
    nama: 'Instrumen Kepuasan Mitra Kerja Praktik 2025/2026',
    skalaMaks: 5,
    dibuatAt: '2025-06-01',
    jumlahAspek: 4,
    jumlahResponden: 18,
    status: 'AKTIF',
  },
  {
    id: 'tmpl-psi-2025',
    program: 'PSI',
    nama: 'Instrumen Evaluasi Mitra Proyek Sistem Informasi (PSI)',
    skalaMaks: 5,
    dibuatAt: '2025-06-05',
    jumlahAspek: 4,
    jumlahResponden: 12,
    status: 'AKTIF',
  },
  {
    id: 'tmpl-pdlk-2025',
    program: 'PDLK',
    nama: 'Instrumen Pembimbing Mitra Pembelajaran di Luar Kampus',
    skalaMaks: 5,
    dibuatAt: '2025-06-10',
    jumlahAspek: 3,
    jumlahResponden: 6,
    status: 'AKTIF',
  },
  {
    id: 'tmpl-kp-draft',
    program: 'KP',
    nama: 'Draft Instrumen KP Skema Magang MBKM 2026',
    skalaMaks: 5,
    dibuatAt: '2025-08-01',
    jumlahAspek: 5,
    jumlahResponden: 0,
    status: 'DRAF',
  },
];

export default function Page() {
  const [templates, setTemplates] = useState<InstrumentTemplate[]>(INITIAL_TEMPLATES);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<'KP' | 'PSI' | 'PDLK'>('KP');
  const [newNama, setNewNama] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    const newTmpl: InstrumentTemplate = {
      id: `tmpl-${Date.now()}`,
      program: newProgram,
      nama: newNama.trim(),
      skalaMaks: 5,
      dibuatAt: new Date().toISOString().split('T')[0],
      jumlahAspek: 3,
      jumlahResponden: 0,
      status: 'DRAF',
    };

    setTemplates([newTmpl, ...templates]);
    setNewNama('');
    setModalOpen(false);
  };

  const handleDuplicate = (template: InstrumentTemplate) => {
    const duplicated: InstrumentTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      nama: `${template.nama} (Salinan)`,
      jumlahResponden: 0,
      status: 'DRAF',
      dibuatAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([duplicated, ...templates]);
  };

  const columns: DataTableColumn<InstrumentTemplate>[] = [
    {
      key: 'program',
      header: 'Program',
      render: (r) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
          {r.program}
        </span>
      ),
    },
    {
      key: 'nama',
      header: 'Nama Template Instrumen',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.nama}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Skala 1–{r.skalaMaks} • Dibuat: {r.dibuatAt}
          </div>
        </div>
      ),
    },
    {
      key: 'jumlahAspek',
      header: 'Aspek Penilaian',
      render: (r) => <span className="text-sm font-medium text-slate-700">{r.jumlahAspek} Aspek</span>,
    },
    {
      key: 'jumlahResponden',
      header: 'Responden',
      render: (r) => <span className="text-sm text-slate-600">{r.jumlahResponden} Mitra</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href="/dashboard/kepuasan-mitra/pengiriman"
            className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
            title="Kirim ke Mitra"
          >
            <Send size={12} /> Kirim
          </Link>
          <button
            onClick={() => handleDuplicate(r)}
            className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
            title="Duplikasi Template"
          >
            <Copy size={12} /> Duplikasi
          </button>
          <Link
            href={`/dashboard/kepuasan-mitra/instrumen/${r.id}`}
            className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
          >
            <FileEdit size={12} /> Kelola
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instrumen Kuesioner"
        description="Kelola kuesioner evaluasi mitra lapangan untuk program KP, PSI, dan PDLK (FR-26)."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> Tambah Instrumen
          </button>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={templates}
          emptyMessage="Belum ada template kuesioner. Klik Tambah Instrumen untuk membuat baru."
        />
      </div>

      {/* Modal Tambah Template */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Template Instrumen Baru"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Program Penempatan
            </label>
            <select
              value={newProgram}
              onChange={(e) => setNewProgram(e.target.value as 'KP' | 'PSI' | 'PDLK')}
              className="select-field"
            >
              <option value="KP">Kerja Praktik (KP)</option>
              <option value="PSI">Proyek Sistem Informasi (PSI)</option>
              <option value="PDLK">Pembelajaran di Luar Kampus (PDLK)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Template Instrumen
            </label>
            <input
              type="text"
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              placeholder="Contoh: Instrumen Kepuasan Mitra KP 2026/2027"
              className="input-field"
              required
            />
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
            Template baru akan dibuat dengan status <strong>DRAF</strong> dan memuat 4 aspek penilaian standar (Integritas, Kompetensi Teknis, Komunikasi, dan Koordinasi) yang dapat Anda kustomisasi selanjutnya.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary text-xs px-4 py-2"
            >
              Simpan & Lanjutkan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

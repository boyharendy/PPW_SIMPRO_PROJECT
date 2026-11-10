'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Copy, FileEdit } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyTemplates } from '@/lib/mock-data';
import type { PartnerSurveyTemplate } from '@/lib/types';

export default function Page() {
  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<'KP' | 'PSI' | 'PDLK'>('KP');
  const [newNama, setNewNama] = useState('');

  useEffect(() => {
    const loaded = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    setTemplates(loaded);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    const tmplId = `tmpl-${Date.now()}`;
    const newTmpl: PartnerSurveyTemplate = {
      id: tmplId,
      program: newProgram,
      nama: newNama.trim(),
      skala_maks: 5,
      status: 'DRAF',
      dibuat_oleh: 'u-koordinator',
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      total_responden: 0,
      aspek: [
        { id: `asp-${tmplId}-1`, template_id: tmplId, nama_aspek: 'Integritas & Etika Profesional', deskripsi: 'Disiplin, kejujuran, dan sopan santun mahasiswa di tempat kerja', bobot: 25, urutan: 1, is_active: true },
        { id: `asp-${tmplId}-2`, template_id: tmplId, nama_aspek: 'Kompetensi Teknis Sistem Informasi', deskripsi: 'Keahlian teknis dalam analisis, basis data, dan pemrograman', bobot: 35, urutan: 2, is_active: true },
        { id: `asp-${tmplId}-3`, template_id: tmplId, nama_aspek: 'Komunikasi & Kerja Sama Tim', deskripsi: 'Interaksi kerja serta penyampaian laporan kemajuan', bobot: 20, urutan: 3, is_active: true },
        { id: `asp-${tmplId}-4`, template_id: tmplId, nama_aspek: 'Koordinasi Pelaksanaan dengan Prodi', deskripsi: 'Kelancaran pelaporan berkala dan kesesuaian capaian', bobot: 20, urutan: 4, is_active: true },
      ],
    };

    const updated = [newTmpl, ...templates];
    storageSync.set(STORAGE_KEYS.SURVEYS, updated);
    setTemplates(updated);
    setNewNama('');
    setModalOpen(false);
  };

  const handleDuplicate = (template: PartnerSurveyTemplate) => {
    const tmplId = `tmpl-${Date.now()}`;
    const duplicated: PartnerSurveyTemplate = {
      ...template,
      id: tmplId,
      nama: `${template.nama} (Salinan)`,
      status: 'DRAF',
      total_responden: 0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      aspek: (template.aspek || []).map((a, i) => ({
        ...a,
        id: `asp-${tmplId}-${i + 1}`,
        template_id: tmplId,
      })),
    };

    const updated = [duplicated, ...templates];
    storageSync.set(STORAGE_KEYS.SURVEYS, updated);
    setTemplates(updated);
  };

  const columns: DataTableColumn<PartnerSurveyTemplate>[] = [
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
            Skala 1–{r.skala_maks} • Dibuat: {r.created_at}
          </div>
        </div>
      ),
    },
    {
      key: 'aspek',
      header: 'Aspek Penilaian',
      render: (r) => (
        <span className="text-sm font-medium text-slate-700">
          {r.aspek?.filter((a) => a.is_active !== false).length || 0} Aspek
        </span>
      ),
    },
    {
      key: 'total_responden',
      header: 'Responden',
      render: (r) => (
        <span className="text-sm text-slate-600">
          {r.total_responden || 0} Mitra
        </span>
      ),
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
          <button
            onClick={() => handleDuplicate(r)}
            className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
            title="Duplikasi Template Kuesioner"
          >
            <Copy size={12} /> Duplikasi
          </button>
          <Link
            href={`/dashboard/kepuasan-mitra/instrumen/${r.id}`}
            className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
            title="Kelola butir aspek dan bobot kuesioner"
          >
            <FileEdit size={12} /> Kelola Aspek
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
            Template baru akan dibuat dengan status <strong>DRAF</strong> dan memuat 4 aspek penilaian standar (Integritas, Kompetensi Teknis, Komunikasi, dan Koordinasi) yang dapat Anda ubah atau sesuaikan setelah dibuat.
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

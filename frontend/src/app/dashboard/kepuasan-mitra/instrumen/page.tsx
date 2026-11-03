'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockSurveyTemplates } from '@/lib/mock-data';
import { surveyService } from '@/lib/api/services/survey.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { PartnerSurveyTemplate, SurveyProgram } from '@/lib/types';
import { Plus, Copy, ArrowRight, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export default function InstrumenKepuasanPage() {
  const [templates, setTemplates] = useState<PartnerSurveyTemplate[]>(() =>
    storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates)
  );
  const [openModal, setOpenModal] = useState(false);
  const [formProgram, setFormProgram] = useState<SurveyProgram>('KP');
  const [formNama, setFormNama] = useState('');
  const [loading, setLoading] = useState(false);

  // Muat data dari Backend / Supabase saat halaman dibuka
  useEffect(() => {
    let active = true;
    surveyService
      .getSurveys()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setTemplates(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    setLoading(true);
    try {
      const res = await surveyService.createSurvey({
        program: formProgram,
        nama: formNama,
        skala_maks: 5,
        status: 'DRAF',
      });

      if (res.data) {
        setTemplates((prev) => [res.data, ...prev.filter((t) => t.id !== res.data.id)]);
      }
      setOpenModal(false);
      setFormNama('');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (tmpl: PartnerSurveyTemplate) => {
    const duplicated: Partial<PartnerSurveyTemplate> = {
      program: tmpl.program,
      nama: `${tmpl.nama} (Salinan Baru)`,
      skala_maks: tmpl.skala_maks,
      status: 'DRAF',
      aspek: tmpl.aspek,
    };
    const res = await surveyService.createSurvey(duplicated);
    if (res.data) {
      setTemplates((prev) => [res.data, ...prev]);
    }
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
      key: 'aspek_count',
      header: 'Aspek Penilaian',
      render: (row: PartnerSurveyTemplate) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.aspek?.length || 0} Aspek
        </span>
      ),
    },
    {
      key: 'total_responden',
      header: 'Responden',
      render: (row: PartnerSurveyTemplate) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.total_responden || 0} Mitra
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
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleDuplicate(row)}
            className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 text-slate-600"
            title="Duplikasi Instrumen"
          >
            <Copy size={13} />
            <span className="hidden sm:inline">Duplikasi</span>
          </button>

          <Link
            href={`/dashboard/kepuasan-mitra/instrumen/${row.id}`}
            className="btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1"
          >
            <Settings2 size={13} />
            <span>Kelola</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instrumen Kepuasan Mitra"
        description="Kelola kuesioner evaluasi mitra untuk program Kerja Praktik (KP), Proyek Sistem Informasi (PSI), dan Pembelajaran Di Luar Kampus (PDLK)."
        action={
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Tambah Instrumen</span>
          </button>
        }
      />

      <div className="card">
        <DataTable
          columns={columns}
          data={templates}
          emptyMessage="Belum ada instrumen kepuasan mitra yang dibuat"
        />
      </div>

      {/* Modal Tambah Instrumen */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Tambah Instrumen Kuesioner Baru" size="md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="label">Program Terkait *</label>
            <select
              className="input-field"
              value={formProgram}
              onChange={(e) => setFormProgram(e.target.value as SurveyProgram)}
            >
              <option value="KP">Kerja Praktik (KP)</option>
              <option value="PSI">Proyek Sistem Informasi (PSI)</option>
              <option value="PDLK">Pembelajaran Di Luar Kampus (PDLK)</option>
            </select>
          </div>

          <div>
            <label className="label">Nama Template Instrumen *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Evaluasi Kinerja Mahasiswa KP 2025/2026"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] leading-relaxed">
            Template baru akan dibuat dengan status <strong>DRAF</strong> beserta aspek standar (Integritas, Kompetensi, dan Komunikasi). Anda dapat menambahkan rincian butir pertanyaan pada menu Kelola setelah template dibuat.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formNama.trim()}
            >
              {loading ? 'Menyimpan...' : 'Simpan Template Kuesioner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

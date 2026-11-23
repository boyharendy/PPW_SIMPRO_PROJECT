'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import { mockSurveyTemplates } from '@/lib/mock-data';
import type { PartnerSurveyTemplate, PartnerSurveyAspect } from '@/lib/types';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [template, setTemplate] = useState<PartnerSurveyTemplate | null>(null);
  const [aspeks, setAspeks] = useState<PartnerSurveyAspect[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAspek, setEditingAspek] = useState<PartnerSurveyAspect | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [bobot, setBobot] = useState(25);

  const handleDeleteTemplate = () => {
    if (!template) return;
    storageSync.remove(STORAGE_KEYS.SURVEYS, template.id, mockSurveyTemplates);
    router.push('/dashboard/kepuasan-mitra/instrumen');
  };

  useEffect(() => {
    const tmpls = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    const found = tmpls.find((t) => t.id === id) || tmpls[0];
    if (found) {
      setTemplate(found);
      setAspeks(found.aspek || []);
    }
  }, [id]);

  const totalBobot = aspeks.reduce((sum, a) => sum + (a.is_active !== false ? a.bobot : 0), 0);

  const persistAspeks = (newAspeks: PartnerSurveyAspect[]) => {
    if (!template) return;
    setAspeks(newAspeks);
    const updatedTmpl = {
      ...template,
      aspek: newAspeks,
      updated_at: new Date().toISOString().split('T')[0],
    };
    setTemplate(updatedTmpl);
    storageSync.update(STORAGE_KEYS.SURVEYS, template.id, {
      aspek: newAspeks,
      updated_at: updatedTmpl.updated_at,
    }, mockSurveyTemplates);
  };

  const handleToggleStatus = () => {
    if (!template) return;
    const nextStatus: 'AKTIF' | 'DRAF' = template.status === 'AKTIF' ? 'DRAF' : 'AKTIF';
    const updatedTmpl: PartnerSurveyTemplate = { ...template, status: nextStatus };
    setTemplate(updatedTmpl);
    storageSync.update(STORAGE_KEYS.SURVEYS, template.id, { status: nextStatus }, mockSurveyTemplates);
  };

  const openAddModal = () => {
    setEditingAspek(null);
    setNama('');
    setDeskripsi('');
    setBobot(20);
    setModalOpen(true);
  };

  const openEditModal = (item: PartnerSurveyAspect) => {
    setEditingAspek(item);
    setNama(item.nama_aspek);
    setDeskripsi(item.deskripsi || '');
    setBobot(item.bobot);
    setModalOpen(true);
  };

  const handleSaveAspek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !template) return;

    let updated: PartnerSurveyAspect[];
    if (editingAspek) {
      updated = aspeks.map((a) =>
        a.id === editingAspek.id ? { ...a, nama_aspek: nama.trim(), deskripsi: deskripsi.trim(), bobot } : a
      );
    } else {
      const newItem: PartnerSurveyAspect = {
        id: `asp-${Date.now()}`,
        template_id: template.id,
        urutan: aspeks.length + 1,
        nama_aspek: nama.trim(),
        deskripsi: deskripsi.trim(),
        bobot,
        is_active: true,
      };
      updated = [...aspeks, newItem];
    }

    persistAspeks(updated);
    setModalOpen(false);
  };

  const handleDelete = (aspekId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aspek penilaian ini?')) {
      const updated = aspeks.filter((a) => a.id !== aspekId);
      persistAspeks(updated);
    }
  };

  const columns: DataTableColumn<PartnerSurveyAspect>[] = [
    {
      key: 'urutan',
      header: '#',
      className: 'w-12 text-center',
      render: (r: PartnerSurveyAspect) => (
        <span className="font-mono text-xs font-bold text-slate-400">
          {r.urutan || 1}
        </span>
      ),
    },
    {
      key: 'nama_aspek',
      header: 'Nama Aspek & Deskripsi',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.nama_aspek}</div>
          {r.deskripsi && (
            <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.deskripsi}</div>
          )}
        </div>
      ),
    },
    {
      key: 'bobot',
      header: 'Bobot',
      className: 'w-24',
      render: (r) => (
        <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2.5 py-1 rounded-md">
          {r.bobot}%
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      className: 'w-28',
      render: (r) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
            r.is_active !== false
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {r.is_active !== false ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right min-w-[150px] whitespace-nowrap',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            onClick={() => openEditModal(r)}
            className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
            title="Edit Aspek"
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-2xs"
            title="Hapus Aspek"
          >
            <Trash2 size={13} /> Hapus
          </button>
        </div>
      ),
    },
  ];

  if (!template) {
    return (
      <div className="card text-center py-12">
        <p className="text-sm text-slate-500">Memuat template instrumen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/kepuasan-mitra/instrumen"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Instrumen
        </Link>
      </div>

      <PageHeader
        title="Kelola Template Instrumen"
        description={`${template.nama} — Konfigurasi butir pertanyaan dan bobot penilaian kuesioner program ${template.program}.`}
        badge={<StatusBadge status={template.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <CheckCircle2 size={14} />
              {template.status === 'AKTIF' ? 'Set ke DRAF' : 'Aktifkan Template'}
            </button>
            <button
              onClick={openAddModal}
              className="h-8 px-3.5 text-xs font-medium rounded-full border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Plus size={14} /> Tambah Aspek
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="h-8 px-3 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 inline-flex items-center gap-1.5 shadow-2xs transition-all"
              title="Hapus template kuesioner ini"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        }
      />

      {/* Ringkasan Konfigurasi & Status Bobot (Komposisi Seragam & Selaras) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MotionCard index={0} interactive className="card p-4 sm:p-5 flex flex-col justify-between bg-white shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Program & Skala</div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">Program {template.program}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Skala Likert 1.0 s.d. {template.skala_maks}.0</div>
          </div>
        </MotionCard>

        <MotionCard index={1} interactive className="card p-4 sm:p-5 flex flex-col justify-between bg-white shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Responden</div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{template.total_responden || 0} Mitra</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Respons tersimpan dari instrumen ini</div>
          </div>
        </MotionCard>

        <MotionCard index={2} interactive className="card p-4 sm:p-5 flex flex-col justify-between bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akumulasi Bobot</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                totalBobot === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {totalBobot === 100 ? 'Sesuai 100%' : 'Perlu Perbaikan'}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalBobot}%</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${totalBobot === 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(totalBobot, 100)}%` }}
              />
            </div>
          </div>
        </MotionCard>
      </div>

      {/* Tabel Aspek */}
      <MotionCard index={3} interactive={false} className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <WordRevealHeading as="h3" text="Daftar Aspek Penilaian Kuesioner" className="text-base font-bold text-slate-800" />
            <p className="text-xs text-slate-500">
              Aspek-aspek kompetensi yang dinilai oleh perwakilan mitra industri saat mengisi formulir.
            </p>
          </div>
        </div>

        <DataTable columns={columns} data={aspeks} emptyMessage="Belum ada aspek penilaian pada template ini." />
      </MotionCard>

      {/* Modal Tambah/Edit Aspek */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAspek ? 'Edit Aspek Penilaian' : 'Tambah Aspek Penilaian'}
        size="md"
      >
        <form onSubmit={handleSaveAspek} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Aspek Kompetensi
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Kompetensi Analisis & Rekayasa Perangkat Lunak"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deskripsi Aspek (Petunjuk Penilaian)
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan kriteria yang diharapkan dari mahasiswa..."
              className="input-field resize-none text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bobot Penilaian (%)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={bobot}
              onChange={(e) => setBobot(Number(e.target.value))}
              className="input-field"
              required
            />
            <span className="text-xs text-slate-500 mt-1.5 block">
              Total seluruh bobot aspek aktif dianjurkan berjumlah 100%.
            </span>
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
              Simpan Aspek
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus Template */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Template Kuesioner"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus template kuesioner{' '}
            <strong className="text-slate-800">{template.nama}</strong> ({template.program})?
          </p>
          {template.total_responden && template.total_responden > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
              <strong>Perhatian:</strong> Template ini memiliki <strong>{template.total_responden} responden</strong>. Menghapusnya akan membersihkan template dari daftar instrumen aktif.
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="btn-secondary text-xs px-3.5 py-1.5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteTemplate}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} /> Ya, Hapus Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle2, Copy, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface AspekItem {
  id: string;
  urutan: number;
  nama: string;
  deskripsi: string;
  bobot: number;
  isActive: boolean;
}

const INITIAL_ASPEKS: AspekItem[] = [
  {
    id: 'asp-1',
    urutan: 1,
    nama: 'Integritas & Etika Profesional',
    deskripsi: 'Kedisiplinan, kejujuran, etika kerja, kepatuhan pada SOP perusahaan mitra, dan tanggung jawab.',
    bobot: 25,
    isActive: true,
  },
  {
    id: 'asp-2',
    urutan: 2,
    nama: 'Kompetensi Teknis Sistem Informasi',
    deskripsi: 'Keahlian teknis dalam analisis, perancangan, pemrograman, basis data, atau infrastruktur IT.',
    bobot: 35,
    isActive: true,
  },
  {
    id: 'asp-3',
    urutan: 3,
    nama: 'Komunikasi & Kerjasama Tim',
    deskripsi: 'Kemampuan menyampaikan gagasan, presentasi laporan kemajuan, serta kolaborasi lintas departemen.',
    bobot: 20,
    isActive: true,
  },
  {
    id: 'asp-4',
    urutan: 4,
    nama: 'Koordinasi dengan Program Studi',
    deskripsi: 'Keteraturan pelaporan berkala pembimbingan dan kesesuaian capaian pembelajaran kegiatan.',
    bobot: 20,
    isActive: true,
  },
];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'AKTIF' | 'DRAF'>('AKTIF');
  const [aspeks, setAspeks] = useState<AspekItem[]>(INITIAL_ASPEKS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAspek, setEditingAspek] = useState<AspekItem | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [bobot, setBobot] = useState(25);

  const totalBobot = aspeks.reduce((sum, a) => sum + (a.isActive ? a.bobot : 0), 0);

  const openAddModal = () => {
    setEditingAspek(null);
    setNama('');
    setDeskripsi('');
    setBobot(20);
    setModalOpen(true);
  };

  const openEditModal = (item: AspekItem) => {
    setEditingAspek(item);
    setNama(item.nama);
    setDeskripsi(item.deskripsi);
    setBobot(item.bobot);
    setModalOpen(true);
  };

  const handleSaveAspek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editingAspek) {
      setAspeks(
        aspeks.map((a) =>
          a.id === editingAspek.id ? { ...a, nama: nama.trim(), deskripsi: deskripsi.trim(), bobot } : a
        )
      );
    } else {
      const newItem: AspekItem = {
        id: `asp-${Date.now()}`,
        urutan: aspeks.length + 1,
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        bobot,
        isActive: true,
      };
      setAspeks([...aspeks, newItem]);
    }
    setModalOpen(false);
  };

  const handleDelete = (aspekId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aspek ini?')) {
      setAspeks(aspeks.filter((a) => a.id !== aspekId));
    }
  };

  const columns: DataTableColumn<AspekItem>[] = [
    {
      key: 'urutan',
      header: '#',
      className: 'w-12 text-center',
      render: (r) => <span className="font-mono text-xs font-bold text-slate-400">{r.urutan}</span>,
    },
    {
      key: 'nama',
      header: 'Nama Aspek & Deskripsi',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{r.nama}</div>
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{r.deskripsi}</div>
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
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (r) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
            r.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {r.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right w-24',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Aspek"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus Aspek"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

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
        description={`Konfigurasi butir pertanyaan dan bobot penilaian kuesioner (${id || 'KP-2025'}).`}
        badge={<StatusBadge status={status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatus(status === 'AKTIF' ? 'DRAF' : 'AKTIF')}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              {status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan Template'}
            </button>
            <button
              onClick={openAddModal}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Tambah Aspek
            </button>
          </div>
        }
      />

      {/* Ringkasan Konfigurasi & Status Bobot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Program & Skala</div>
          <div className="text-base font-bold text-slate-800 mt-1">Kerja Praktik (KP)</div>
          <div className="text-xs text-slate-500 mt-0.5">Skala Likert 1.0 s.d. 5.0</div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Responden Terkumpul</div>
          <div className="text-base font-bold text-slate-800 mt-1">18 Mitra Lapangan</div>
          <div className="text-xs text-slate-500 mt-0.5">Instrumen telah digunakan di periode ini</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Akumulasi Bobot</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                totalBobot === 100
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {totalBobot === 100 ? 'Sesuai (100%)' : 'Perlu Perbaikan'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalBobot}%</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${totalBobot === 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(totalBobot, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabel Aspek */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Daftar Aspek Penilaian Kuesioner</h3>
            <p className="text-xs text-slate-500">
              Aspek-aspek kompetensi yang akan dinilai oleh perwakilan mitra industri saat mengisi formulir.
            </p>
          </div>
        </div>

        <DataTable columns={columns} data={aspeks} emptyMessage="Belum ada aspek penilaian." />
      </div>

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
              placeholder="Contoh: Kompetensi Teknis Sistem Informasi"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deskripsi / Indikator Penilaian (Petunjuk untuk Mitra)
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan kriteria yang dinilai oleh mitra industri..."
              className="input-field resize-none"
              required
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
            <p className="text-[11px] text-slate-400 mt-1">
              Akumulasi seluruh aspek penilaian harus berjumlah tepat 100%.
            </p>
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
              {editingAspek ? 'Simpan Perubahan' : 'Tambahkan Aspek'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Eye, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

interface ReviewTask {
  id: string;
  judul: string;
  jenis: string;
  penulisUtama: string;
  target: string;
  tenggat: string;
  status: 'DITUGASKAN' | 'SELESAI';
  rekomendasi?: 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN';
  catatan?: string;
}

const MOCK_TASKS: ReviewTask[] = [
  {
    id: 'rev-1',
    judul: 'Optimasi Algoritma Random Forest pada Klasifikasi Citra Medis',
    jenis: 'JURNAL',
    penulisUtama: 'Dr. Andi Pratama, M.Kom.',
    target: 'Jurnal RESTI (SINTA 2)',
    tenggat: '2025-11-20',
    status: 'DITUGASKAN',
  },
  {
    id: 'rev-2',
    judul: 'Penerapan Microservices Architecture pada Sistem Informasi Rumah Sakit',
    jenis: 'PROSIDING',
    penulisUtama: 'Siti Rahmawati, M.T.',
    target: 'IEEE ICITACEE 2025 (Scopus)',
    tenggat: '2025-11-15',
    status: 'DITUGASKAN',
  },
  {
    id: 'rev-3',
    judul: 'Evaluasi Usability Website E-Government dengan Metode SUS',
    jenis: 'JURNAL',
    penulisUtama: 'Agus Salim, M.Kom.',
    target: 'Jurnal SISFO (SINTA 3)',
    tenggat: '2025-10-30',
    status: 'SELESAI',
    rekomendasi: 'LAYAK_DIAJUKAN',
    catatan: 'Metodologi dan interpretasi hasil sudah sangat komprehensif, layak diajukan ke jurnal target.',
  },
];

export default function Page() {
  const [tasks, setTasks] = useState<ReviewTask[]>(MOCK_TASKS);
  const [activeTask, setActiveTask] = useState<ReviewTask | null>(null);
  const [rekomendasi, setRekomendasi] = useState<'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN'>('LAYAK_DIAJUKAN');
  const [catatan, setCatatan] = useState('');

  const handleCompleteReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    setTasks(
      tasks.map((t) =>
        t.id === activeTask.id
          ? { ...t, status: 'SELESAI', rekomendasi, catatan }
          : t
      )
    );
    setActiveTask(null);
  };

  const columns: DataTableColumn<ReviewTask>[] = [
    {
      key: 'judul',
      header: 'Judul Manuskrip & Penulis',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm line-clamp-1">{r.judul}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Penulis: {r.penulisUtama} • <span className="font-semibold text-blue-600">{r.jenis}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target Publikasi',
      render: (r) => <span className="text-xs text-slate-700 font-medium">{r.target}</span>,
    },
    {
      key: 'tenggat',
      header: 'Tenggat Waktu',
      render: (r) => <span className="text-xs text-slate-600">{formatDateShort(r.tenggat)}</span>,
    },
    {
      key: 'status',
      header: 'Status & Rekomendasi',
      render: (r) => (
        <div>
          <StatusBadge status={r.status} size="sm" />
          {r.rekomendasi && (
            <div className="mt-1">
              <StatusBadge status={r.rekomendasi} size="sm" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => {
            setActiveTask(r);
            setRekomendasi(r.rekomendasi || 'LAYAK_DIAJUKAN');
            setCatatan(r.catatan || '');
          }}
          className="btn-primary text-xs px-3 py-1 inline-flex items-center gap-1.5"
        >
          {r.status === 'SELESAI' ? <Eye size={12} /> : <FileCheck size={12} />}
          {r.status === 'SELESAI' ? 'Lihat Hasil' : 'Beri Telaah'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Internal Publikasi"
        description="Daftar penugasan penelaahan internal manuskrip publikasi dosen (FR-31)."
      />

      <div className="card">
        <DataTable columns={columns} data={tasks} emptyMessage="Tidak ada tugas review saat ini." />
      </div>

      <Modal
        open={Boolean(activeTask)}
        onClose={() => setActiveTask(null)}
        title={activeTask?.status === 'SELESAI' ? 'Hasil Review Internal' : 'Formulir Review Internal'}
        size="md"
      >
        {activeTask && (
          <form onSubmit={handleCompleteReview} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div><strong>Judul:</strong> {activeTask.judul}</div>
              <div><strong>Penulis:</strong> {activeTask.penulisUtama}</div>
              <div><strong>Target:</strong> {activeTask.target}</div>
            </div>

            {activeTask.status === 'SELESAI' ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Rekomendasi Reviewer:</span>
                  <StatusBadge status={activeTask.rekomendasi || 'SELESAI'} size="md" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Catatan Penelaahan:</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {activeTask.catatan}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Rekomendasi Akhir
                  </label>
                  <select
                    value={rekomendasi}
                    onChange={(e) => setRekomendasi(e.target.value as any)}
                    className="select-field"
                  >
                    <option value="LAYAK_DIAJUKAN">LAYAK DIAJUKAN</option>
                    <option value="PERLU_PERBAIKAN">PERLU PERBAIKAN</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Catatan Reviewer & Arahan Perbaikan
                  </label>
                  <textarea
                    rows={4}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tuliskan catatan teknis metodologi, keselarasan target, atau sitasi..."
                    className="input-field resize-none text-xs"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Tutup
              </button>
              {activeTask.status !== 'SELESAI' && (
                <button type="submit" className="btn-primary text-xs px-4 py-2">
                  Selesaikan Review
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockIntegrations, mockCourses, mockActivities } from '@/lib/mock-data';
import { Plus, Download, BookOpen } from 'lucide-react';
import type { LearningIntegration } from '@/lib/types';

export default function IntegrasiPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrasi Pembelajaran"
        description="FR-32: Rekapitulasi integrasi hasil Penelitian/PkM ke dalam materi kuliah"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Bukti</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Integrasi</button>
          </div>
        }
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
        <div className="flex gap-3">
          <BookOpen size={24} className="text-blue-500 shrink-0" />
          <div>
            <h3 className="text-slate-800 font-medium mb-1">Bukti Kinerja Tridarma Dosen</h3>
            <p className="text-sm text-slate-500">Modul ini melacak luaran penelitian dan pengabdian masyarakat (PkM) yang diintegrasikan kembali ke dalam pembelajaran (RPS / Bahan Ajar / Studi Kasus) sesuai standar akreditasi.</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'matakuliah', header: 'Mata Kuliah', render: (r) => {
            const i = r as unknown as LearningIntegration;
            return (
              <div>
                <p className="font-medium text-slate-800">{i.course?.nama_mk}</p>
                <p className="text-xs text-slate-500">{i.course?.kode_mk}</p>
              </div>
            );
          }},
          { key: 'sumber', header: 'Sumber Integrasi (Penelitian/PkM)', render: (r) => {
            const i = r as unknown as LearningIntegration;
            return (
              <div className="max-w-md">
                <p className="text-sm text-slate-800 line-clamp-2">{i.activity?.judul}</p>
                <p className="text-xs text-slate-500 mt-1">Dosen: {i.activity?.lecturer?.profile?.nama_lengkap}</p>
              </div>
            );
          }},
          { key: 'bentuk', header: 'Bentuk Integrasi', render: (r) => <span className="text-sm font-medium text-emerald-400">{(r as unknown as LearningIntegration).bentuk_integrasi}</span> },
          { key: 'rujukan', header: 'Rujukan RPS', render: (r) => <span className="text-xs text-slate-500">{(r as unknown as LearningIntegration).rujukan_rps}</span> },
        ]}
        data={mockIntegrations as unknown as Record<string, unknown>[]}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Integrasi Pembelajaran">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Sumber Kegiatan (Penelitian/PkM)</label>
            <select className="select-field">
              {mockActivities.filter(a => a.jenis === 'PENELITIAN' || a.jenis === 'PKM').map(a => (
                <option key={a.id} value={a.id}>[{a.jenis}] {a.judul.substring(0, 50)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Diintegrasikan ke Mata Kuliah</label>
            <select className="select-field">
              {mockCourses.map(c => <option key={c.id} value={c.id}>{c.kode_mk} - {c.nama_mk}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bentuk Integrasi</label>
              <select className="select-field">
                <option>Studi Kasus</option>
                <option>Materi Ajar</option>
                <option>Tugas Proyek</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div>
              <label className="label">Rujukan di RPS</label>
              <input className="input-field" placeholder="mis. Pertemuan ke-7" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Integrasi</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

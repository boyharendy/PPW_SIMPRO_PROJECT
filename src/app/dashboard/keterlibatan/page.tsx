'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockInvolvements, mockActivities, mockStudents } from '@/lib/mock-data';
import { Plus, Download, Users, Microscope, UserCog } from 'lucide-react';
import type { ActivityStudentInvolvement } from '@/lib/types';

export default function KeterlibatanPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keterlibatan Mahasiswa"
        description="FR-31: Pencatatan keterlibatan mahasiswa dalam kegiatan Penelitian dan PkM Dosen"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Rekap</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Keterlibatan</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Total Mahasiswa Terlibat</p>
            <Users size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{mockInvolvements.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Kegiatan Penelitian</p>
            <Microscope size={18} className="text-emerald-400/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {mockInvolvements.filter(i => mockActivities.find(a => a.id === i.kegiatan_id)?.jenis === 'PENELITIAN').length}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Kegiatan PkM</p>
            <UserCog size={18} className="text-amber-400/70" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {mockInvolvements.filter(i => mockActivities.find(a => a.id === i.kegiatan_id)?.jenis === 'PKM').length}
          </p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Mahasiswa', render: (r) => {
            const i = r as unknown as ActivityStudentInvolvement;
            return (
              <div>
                <p className="font-medium text-slate-800">{i.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{i.student?.nim}</p>
              </div>
            );
          }},
          { key: 'peran', header: 'Peran', render: (r) => <span className="font-medium text-indigo-300">{(r as unknown as ActivityStudentInvolvement).peran}</span> },
          { key: 'kegiatan', header: 'Kegiatan Dosen', render: (r) => {
            const i = r as unknown as ActivityStudentInvolvement;
            const a = mockActivities.find(act => act.id === i.kegiatan_id);
            return (
              <div className="max-w-sm">
                <p className="text-sm text-slate-800 font-medium line-clamp-1">{a?.judul}</p>
                <p className="text-xs text-slate-500">{a?.jenis.replace('_', ' ')} • Dosen: {a?.lecturer?.profile?.nama_lengkap}</p>
              </div>
            );
          }},
        ]}
        data={mockInvolvements as unknown as Record<string, unknown>[]}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Keterlibatan Mahasiswa">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select className="select-field">
              {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pilih Kegiatan (Penelitian/PkM)</label>
            <select className="select-field">
              {mockActivities.filter(a => a.jenis === 'PENELITIAN' || a.jenis === 'PKM').map(a => (
                <option key={a.id} value={a.id}>[{a.jenis}] {a.judul.substring(0, 50)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Peran Mahasiswa</label>
            <input className="input-field" placeholder="mis. Asisten Peneliti, Enumerator, dll" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Keterlibatan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

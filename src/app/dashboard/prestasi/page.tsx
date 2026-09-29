'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockAchievements, mockStudents } from '@/lib/mock-data';
import { Plus, Download, Trophy } from 'lucide-react';
import type { StudentAchievement } from '@/lib/types';

export default function PrestasiPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTingkat, setFilterTingkat] = useState('all');

  const filtered = mockAchievements.filter(a =>
    (filterStatus === 'all' || a.status === filterStatus) &&
    (filterTingkat === 'all' || a.tingkat === filterTingkat)
  );

  const summary = {
    total: mockAchievements.length,
    nasional: mockAchievements.filter(a => a.tingkat === 'NASIONAL' && a.status === 'DISETUJUI').length,
    internasional: mockAchievements.filter(a => a.tingkat === 'INTERNASIONAL' && a.status === 'DISETUJUI').length,
    lokal: mockAchievements.filter(a => a.tingkat === 'LOKAL' && a.status === 'DISETUJUI').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prestasi Mahasiswa"
        description="FR-09, FR-10, FR-11: Pelaporan, validasi bukti, dan rekapitulasi prestasi"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Prestasi</button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <Trophy size={20} className="text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
          <p className="text-xs text-slate-500">Total Prestasi</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{summary.internasional}</p>
          <p className="text-xs text-slate-500">Internasional</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{summary.nasional}</p>
          <p className="text-xs text-slate-500">Nasional</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{summary.lokal}</p>
          <p className="text-xs text-slate-500">Lokal</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="select-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="DIAJUKAN">Diajukan</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
        <select className="select-field w-auto" value={filterTingkat} onChange={e => setFilterTingkat(e.target.value)}>
          <option value="all">Semua Tingkat</option>
          <option value="LOKAL">Lokal</option>
          <option value="NASIONAL">Nasional</option>
          <option value="INTERNASIONAL">Internasional</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Mahasiswa', render: (r) => {
            const a = r as unknown as StudentAchievement;
            return (
              <div>
                <p className="font-medium text-slate-800">{a.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{a.student?.nim}</p>
              </div>
            );
          }},
          { key: 'nama_prestasi', header: 'Prestasi', render: (r) => <span className="text-slate-800 font-medium">{(r as unknown as StudentAchievement).nama_prestasi}</span> },
          { key: 'kategori', header: 'Kategori', render: (r) => <span className="text-xs">{(r as unknown as StudentAchievement).kategori === 'AKADEMIK' ? '🎓 Akademik' : '🏅 Non-Akademik'}</span> },
          { key: 'tingkat', header: 'Tingkat' },
          { key: 'penyelenggara', header: 'Penyelenggara' },
          { key: 'tanggal_prestasi', header: 'Tanggal' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as StudentAchievement).status} /> },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        onEdit={(row) => alert('Membuka form edit untuk: ' + (row as any).nama_prestasi)}
        onDelete={(row) => confirm('Apakah Anda yakin ingin menghapus data ini?')}
      />

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Prestasi Mahasiswa">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select className="select-field">
              {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nama Prestasi</label>
            <input className="input-field" placeholder="mis. Juara 1 Hackathon" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <select className="select-field">
                <option value="AKADEMIK">Akademik</option>
                <option value="NON_AKADEMIK">Non-Akademik</option>
              </select>
            </div>
            <div>
              <label className="label">Tingkat</label>
              <select className="select-field">
                <option value="LOKAL">Lokal</option>
                <option value="NASIONAL">Nasional</option>
                <option value="INTERNASIONAL">Internasional</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Penyelenggara</label>
              <input className="input-field" placeholder="Pemberi penghargaan" />
            </div>
            <div>
              <label className="label">Tanggal Prestasi</label>
              <input className="input-field" type="date" />
            </div>
          </div>
          <div>
            <label className="label">Bukti (Sertifikat/Piagam) *</label>
            <input className="input-field" type="file" accept=".pdf,.jpg,.png" required />
            <p className="text-xs text-slate-500 mt-1">Wajib diunggah sebelum pengajuan diproses</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Pengajuan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

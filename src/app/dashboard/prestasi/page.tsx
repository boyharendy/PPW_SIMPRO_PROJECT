'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/context';
import { mockAchievements, mockStudents } from '@/lib/mock-data';
import { Plus, Download, Trophy, Globe, MapPin, Map } from 'lucide-react';
import type { StudentAchievement } from '@/lib/types';

export default function PrestasiPage() {
  const { user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [validateId, setValidateId] = useState<string | null>(null);
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
            {(user.roles.includes('MAHASISWA') || user.roles.includes('HIMPUNAN')) && (
              <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Prestasi</button>
            )}
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Total Prestasi</p>
            <Trophy size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Internasional</p>
            <Globe size={18} className="text-emerald-400/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{summary.internasional}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Nasional</p>
            <MapPin size={18} className="text-indigo-400/70" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{summary.nasional}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Lokal</p>
            <Map size={18} className="text-cyan-400/70" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">{summary.lokal}</p>
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
          { key: 'kategori', header: 'Kategori', render: (r) => <span className="whitespace-nowrap">{(r as unknown as StudentAchievement).kategori === 'AKADEMIK' ? 'Akademik' : 'Non-Akademik'}</span> },
          { key: 'tingkat', header: 'Tingkat' },
          { key: 'penyelenggara', header: 'Penyelenggara' },
          { key: 'tanggal_prestasi', header: 'Tanggal' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as StudentAchievement).status} /> },
          { key: 'aksi', header: '', render: (r) => {
            const a = r as unknown as StudentAchievement;
            if (a.status === 'DIAJUKAN' && user.roles.includes('HIMPUNAN')) {
              return <button onClick={() => setValidateId(a.id)} className="btn-secondary text-xs py-1.5 px-3">Validasi</button>;
            }
            return null;
          }},
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        onEdit={(row) => alert('Membuka form edit untuk: ' + (row as any).nama_prestasi)}
        onDelete={(row) => confirm('Apakah Anda yakin ingin menghapus data ini?')}
      />

      {/* Validasi Modal */}
      <Modal open={!!validateId} onClose={() => setValidateId(null)} title="Validasi Bukti Prestasi">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
            <p className="text-sm font-medium text-slate-800">Tugas Himpunan (FR-11)</p>
            <p className="text-xs text-slate-600 mt-1">Periksa sertifikat atau piagam lomba, lalu setujui jika sah atau tolak dengan catatan.</p>
          </div>
          <div>
            <label className="label block mb-1">Bukti Prestasi</label>
            <button className="text-indigo-500 text-sm hover:underline font-medium">Lihat Sertifikat.pdf</button>
          </div>
          <div>
            <label className="label">Catatan Validasi (opsional jika disetujui)</label>
            <textarea className="textarea-field" placeholder="Catatan..."></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button className="btn-danger py-2" onClick={() => setValidateId(null)}>Tolak</button>
            <button className="btn-success py-2" onClick={() => setValidateId(null)}>Setujui Prestasi</button>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Prestasi Mahasiswa">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          {user.roles.includes('HIMPUNAN') && (
            <div>
              <label className="label">Pilih Mahasiswa</label>
              <select className="select-field" required>
                <option value="">-- Pilih Mahasiswa --</option>
                {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
              </select>
            </div>
          )}
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

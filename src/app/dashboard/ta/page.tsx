'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockTA, mockDefenses, mockLecturers, mockStudents } from '@/lib/mock-data';
import { Plus, Download, Presentation } from 'lucide-react';
import type { FinalProject, DefenseSession } from '@/lib/types';

export default function TAPage() {
  const [showDefense, setShowDefense] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeDefenses = mockDefenses.filter(d => d.ta_id === showDefense);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Akhir (TA)"
        description="FR-26, FR-27, FR-28: Plotting pembimbing, pengajuan sidang, dan pencatatan nilai"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Data</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Ajukan Topik Baru</button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Mahasiswa', render: (r) => {
            const ta = r as unknown as FinalProject;
            return (
              <div>
                <p className="font-medium text-slate-800">{ta.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{ta.student?.nim}</p>
              </div>
            );
          }},
          { key: 'judul', header: 'Judul / Topik', render: (r) => {
            const ta = r as unknown as FinalProject;
            return (
              <div className="max-w-md">
                <p className="font-medium text-slate-800 leading-snug">{ta.judul || 'Belum ada judul final'}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ta.ringkasan_topik}</p>
              </div>
            );
          }},
          { key: 'pembimbing', header: 'Pembimbing', render: (r) => {
            const ta = r as unknown as FinalProject;
            const p1 = mockLecturers.find(l => l.id === ta.pembimbing_1_id);
            const p2 = mockLecturers.find(l => l.id === ta.pembimbing_2_id);
            return (
              <div className="text-sm">
                {p1 ? <p className="text-slate-600">1. {p1.profile?.nama_lengkap}</p> : <p className="text-amber-400 text-xs">P1 Belum di-plot</p>}
                {p2 && <p className="text-slate-600">2. {p2.profile?.nama_lengkap}</p>}
              </div>
            );
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as FinalProject).status} /> },
          { key: 'sidang', header: 'Jadwal Sidang', render: (r) => {
            const ta = r as unknown as FinalProject;
            const latestSidang = mockDefenses.find(d => d.ta_id === ta.id);
            if (!latestSidang) return <span className="text-xs text-slate-500">-</span>;
            
            return (
              <div className="flex flex-col items-start gap-1">
                <StatusBadge status={latestSidang.status} size="sm" />
                <button onClick={() => setShowDefense(ta.id)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1">
                  <Presentation size={12} /> Detail
                </button>
              </div>
            );
          }},
        ]}
        data={mockTA as unknown as Record<string, unknown>[]}
      />

      <Modal open={!!showDefense} onClose={() => setShowDefense(null)} title="Riwayat Sidang & Seminar">
        <div className="space-y-4">
          <DataTable
            columns={[
              { key: 'jenis', header: 'Jenis Sidang', render: (r) => <span className="text-sm font-medium text-slate-800">{(r as unknown as DefenseSession).jenis.replace('_', ' ')}</span> },
              { key: 'waktu', header: 'Jadwal', render: (r) => {
                const s = r as unknown as DefenseSession;
                return (
                  <div className="text-sm text-slate-600">
                    <p>{new Date(s.waktu_mulai).toLocaleDateString('id-ID')} {new Date(s.waktu_mulai).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.ruang || '-'}</p>
                  </div>
                );
              }},
              { key: 'nilai', header: 'Nilai', render: (r) => {
                const s = r as unknown as DefenseSession;
                return s.nilai ? <span className="text-lg font-bold text-indigo-400">{s.nilai}</span> : <span className="text-slate-500">-</span>;
              }},
              { key: 'status', header: 'Keputusan', render: (r) => <StatusBadge status={(r as unknown as DefenseSession).status} size="sm" /> },
            ]}
            data={activeDefenses as unknown as Record<string, unknown>[]}
            emptyMessage="Belum ada riwayat sidang untuk TA ini."
          />
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ajukan Topik Tugas Akhir Baru">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select className="select-field">
              {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Usulan Judul / Topik</label>
            <input className="input-field" placeholder="Ketik usulan judul tugas akhir..." required />
          </div>
          <div>
            <label className="label">Ringkasan Topik</label>
            <textarea className="textarea-field" placeholder="Deskripsi singkat mengenai apa yang akan dibahas..."></textarea>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Usulan Pembimbing 1</label>
              <select className="select-field">
                <option value="">-- Bebas (Akan diplot Koordinator) --</option>
                {mockLecturers.map(l => <option key={l.id} value={l.id}>{l.profile?.nama_lengkap}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Usulan Pembimbing 2</label>
              <select className="select-field">
                <option value="">-- Bebas / Tidak Ada --</option>
                {mockLecturers.map(l => <option key={l.id} value={l.id}>{l.profile?.nama_lengkap}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Dokumen Proposal/Draft (PDF) *</label>
            <input className="input-field" type="file" accept=".pdf" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Usulan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

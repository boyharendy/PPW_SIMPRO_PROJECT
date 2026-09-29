'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockMagang, mockLogbooks, mockStudents, mockPartners } from '@/lib/mock-data';
import { Plus, Download, BookOpen } from 'lucide-react';
import type { MagangRegistration, Logbook } from '@/lib/types';

export default function MagangPage() {
  const [showLogbook, setShowLogbook] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeLogbooks = mockLogbooks.filter(l => l.magang_id === showLogbook);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Magang MSIB / Mandiri"
        description="FR-29, FR-30: Administrasi pendaftaran magang, pembimbing lapangan, dan monitoring kegiatan"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Data</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Daftar Magang Baru</button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Mahasiswa', render: (r) => {
            const m = r as unknown as MagangRegistration;
            return (
              <div>
                <p className="font-medium text-slate-800">{m.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{m.student?.nim}</p>
              </div>
            );
          }},
          { key: 'mitra', header: 'Lembaga Mitra', render: (r) => {
            const m = r as unknown as MagangRegistration;
            return (
              <div>
                <p className="font-medium text-slate-800">{m.partner?.nama_lembaga}</p>
                <p className="text-xs text-slate-500">Pembimbing Lapangan: {m.nama_pembimbing_lapangan || '-'}</p>
              </div>
            );
          }},
          { key: 'waktu', header: 'Waktu Pelaksanaan', render: (r) => {
            const m = r as unknown as MagangRegistration;
            return (
              <p className="text-sm text-slate-600">
                {m.tanggal_mulai} <br/> <span className="text-slate-500">s.d.</span> {m.tanggal_selesai || '...'}
              </p>
            );
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as MagangRegistration).status} /> },
          { key: 'aksi', header: 'Logbook', render: (r) => {
            const m = r as unknown as MagangRegistration;
            if (m.status === 'BERJALAN' || m.status === 'SELESAI') {
              return (
                <button onClick={() => setShowLogbook(m.id)} className="btn-secondary text-xs py-1.5 px-3">
                  <BookOpen size={14} className="mr-1" /> Logbook MSIB
                </button>
              );
            }
            return <span className="text-xs text-slate-500">Belum tersedia</span>;
          }},
        ]}
        data={mockMagang as unknown as Record<string, unknown>[]}
      />

      <Modal open={!!showLogbook} onClose={() => setShowLogbook(null)} title="Logbook Magang" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Catatan harian/mingguan kegiatan magang mahasiswa (FR-30). Harus selaras dengan laporan MSIB.</p>
          
          <DataTable
            columns={[
              { key: 'tanggal', header: 'Tanggal', className: 'w-24', render: (r) => <span className="text-sm">{(r as unknown as Logbook).tanggal}</span> },
              { key: 'uraian', header: 'Uraian Kegiatan', render: (r) => <span className="text-sm text-slate-800">{(r as unknown as Logbook).uraian_kegiatan}</span> },
              { key: 'status', header: 'Verifikasi', className: 'w-32', render: (r) => <StatusBadge status={(r as unknown as Logbook).status_verifikasi} size="sm" /> },
            ]}
            data={activeLogbooks as unknown as Record<string, unknown>[]}
            emptyMessage="Belum ada catatan logbook yang diisi."
          />
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Pendaftaran Magang MSIB / Mandiri">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select className="select-field">
              {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pilih Lembaga Mitra (Atau Usulan Baru)</label>
            <select className="select-field">
              <option value="">-- Usulan Tempat Baru --</option>
              {mockPartners.map(p => <option key={p.id} value={p.id}>{p.nama_lembaga}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Posisi Magang</label>
            <input className="input-field" placeholder="mis. Frontend Web Developer" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Mulai</label>
              <input className="input-field" type="date" required />
            </div>
            <div>
              <label className="label">Tanggal Selesai (Estimasi)</label>
              <input className="input-field" type="date" required />
            </div>
          </div>
          <div>
            <label className="label">Bukti Penerimaan (Surat Penerimaan/LoA) *</label>
            <input className="input-field" type="file" accept=".pdf" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Pendaftaran</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockKP, mockLogbooks, mockStudents, mockPartners } from '@/lib/mock-data';
import { Plus, Download, BookOpen } from 'lucide-react';
import type { KPRegistration, Logbook } from '@/lib/types';

export default function KPPage() {
  const [showLogbook, setShowLogbook] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeLogbooks = mockLogbooks.filter(l => l.kp_id === showLogbook);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kerja Praktik (KP)"
        description="FR-24, FR-25: Pengajuan, penempatan, dan monitoring logbook kegiatan harian"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Data</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Ajukan KP Baru</button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Mahasiswa', render: (r) => {
            const kp = r as unknown as KPRegistration;
            return (
              <div>
                <p className="font-medium text-slate-800">{kp.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{kp.student?.nim}</p>
              </div>
            );
          }},
          { key: 'mitra', header: 'Tempat KP', render: (r) => {
            const kp = r as unknown as KPRegistration;
            return (
              <div>
                <p className="font-medium text-slate-800">{kp.partner?.nama_lembaga || kp.tempat_usulan}</p>
                <p className="text-xs text-slate-500">{kp.partner ? 'Mitra Terdaftar' : 'Usulan Baru'}</p>
              </div>
            );
          }},
          { key: 'waktu', header: 'Waktu Pelaksanaan', render: (r) => {
            const kp = r as unknown as KPRegistration;
            return (
              <p className="text-sm text-slate-600">
                {kp.tanggal_mulai} <br/> <span className="text-slate-500">s.d.</span> {kp.tanggal_selesai || '...'}
              </p>
            );
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as KPRegistration).status} /> },
          { key: 'aksi', header: 'Logbook', render: (r) => {
            const kp = r as unknown as KPRegistration;
            if (kp.status === 'BERJALAN' || kp.status === 'SELESAI') {
              return (
                <button onClick={() => setShowLogbook(kp.id)} className="btn-secondary text-xs py-1.5 px-3">
                  <BookOpen size={14} className="mr-1" /> Lihat Logbook
                </button>
              );
            }
            return <span className="text-xs text-slate-500">Belum tersedia</span>;
          }},
        ]}
        data={mockKP as unknown as Record<string, unknown>[]}
      />

      <Modal open={!!showLogbook} onClose={() => setShowLogbook(null)} title="Logbook Kerja Praktik" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Catatan harian kegiatan kerja praktik mahasiswa (FR-25). Pembimbing dapat memverifikasi logbook di sini.</p>
          
          <DataTable
            columns={[
              { key: 'tanggal', header: 'Tanggal', className: 'w-24', render: (r) => <span className="text-sm">{(r as unknown as Logbook).tanggal}</span> },
              { key: 'uraian', header: 'Uraian Kegiatan', render: (r) => <span className="text-sm text-slate-800">{(r as unknown as Logbook).uraian_kegiatan}</span> },
              { key: 'status', header: 'Verifikasi', className: 'w-32', render: (r) => <StatusBadge status={(r as unknown as Logbook).status_verifikasi} size="sm" /> },
              { key: 'catatan', header: 'Catatan Dosen', render: (r) => <span className="text-xs text-slate-500">{(r as unknown as Logbook).catatan_pembimbing || '-'}</span> },
              { key: 'aksi', header: '', render: (r) => {
                const lb = r as unknown as Logbook;
                if (lb.status_verifikasi === 'MENUNGGU') {
                  return <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Verifikasi</button>;
                }
                return null;
              }}
            ]}
            data={activeLogbooks as unknown as Record<string, unknown>[]}
            emptyMessage="Belum ada catatan logbook yang diisi."
          />
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ajukan Kerja Praktik Baru">
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
            <label className="label">Nama Tempat KP (Jika Usulan Baru)</label>
            <input className="input-field" placeholder="mis. PT Telkom Indonesia" />
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
            <label className="label">Proposal KP (PDF) *</label>
            <input className="input-field" type="file" accept=".pdf" required />
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

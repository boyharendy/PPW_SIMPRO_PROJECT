'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/context';
import { mockActivities, mockLecturers, mockPositions } from '@/lib/mock-data';
import { Download, Plus, Briefcase, BookOpen, Award } from 'lucide-react';
import type { LecturerActivity } from '@/lib/types';

const TABS = [
  { key: 'all', label: 'Semua Kegiatan' },
  { key: 'PENELITIAN', label: 'Penelitian' },
  { key: 'PKM', label: 'PkM' },
  { key: 'KEGIATAN_TAMBAHAN', label: 'Kegiatan Tambahan' },
  { key: 'jabatan', label: 'Riwayat Jabatan' },
];

export default function KinerjaDosen() {
  const { user } = useApp();
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const activities = tab === 'all' || tab === 'jabatan'
    ? mockActivities
    : mockActivities.filter(a => a.jenis === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kinerja Dosen & Tridarma"
        description="FR-06, FR-07, FR-08: Data penelitian, PkM, kegiatan tambahan, jabatan, dan laporan kinerja"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Laporan</button>
            {(
              (tab === 'jabatan' && user.roles.includes('KAPRODI')) || 
              (tab !== 'jabatan' && user.roles.includes('DOSEN'))
            ) && (
              <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> {tab === 'jabatan' ? 'Tambah Jabatan' : 'Tambah Kegiatan'}</button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="tab-bar overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jabatan' ? (
        <>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Riwayat Jabatan Struktural & Fungsional (FR-07)</h3>
          <DataTable
            columns={[
              { key: 'dosen', header: 'Dosen', render: (r) => {
                const d = mockLecturers.find(l => l.id === (r as Record<string, string>).dosen_id);
                return <span className="font-medium text-slate-800">{d?.profile?.nama_lengkap || '-'}</span>;
              }},
              { key: 'jenis', header: 'Jenis' },
              { key: 'nama_jabatan', header: 'Jabatan', render: (r) => <span className="text-slate-800 font-medium">{(r as Record<string, string>).nama_jabatan}</span> },
              { key: 'nomor_sk', header: 'No. SK' },
              { key: 'tmt_mulai', header: 'TMT Mulai' },
              { key: 'tmt_selesai', header: 'TMT Selesai', render: (r) => <span>{(r as Record<string, string>).tmt_selesai || <span className="text-emerald-400 text-xs">Masih Menjabat</span>}</span> },
            ]}
            data={mockPositions as unknown as Record<string, unknown>[]}
          />
        </>
      ) : (
        <DataTable
          columns={[
            { key: 'dosen', header: 'Dosen', render: (r) => {
              const a = r as unknown as LecturerActivity;
              return <span className="font-medium text-slate-800">{a.lecturer?.profile?.nama_lengkap || '-'}</span>;
            }},
            { key: 'jenis', header: 'Jenis', render: (r) => {
              const a = r as unknown as LecturerActivity;
              const icon = a.jenis === 'PENELITIAN' ? <BookOpen size={14} /> : a.jenis === 'PKM' ? <Award size={14} /> : <Briefcase size={14} />;
              return <span className="flex items-center gap-1.5 text-slate-600">{icon} {a.jenis.replace('_', ' ')}</span>;
            }},
            { key: 'judul', header: 'Judul', render: (r) => <span className="text-slate-800 font-medium">{(r as unknown as LecturerActivity).judul}</span> },
            { key: 'tanggal_kegiatan', header: 'Tanggal' },
            { key: 'uraian', header: 'Uraian', render: (r) => <span className="text-xs text-slate-500 line-clamp-2">{(r as unknown as LecturerActivity).uraian}</span> },
          ]}
          data={activities as unknown as Record<string, unknown>[]}
        />
      )}

      {/* Summary per dosen */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Rekap per Dosen (FR-08)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockLecturers.map(l => {
            const acts = mockActivities.filter(a => a.dosen_id === l.id);
            const penelitian = acts.filter(a => a.jenis === 'PENELITIAN').length;
            const pkm = acts.filter(a => a.jenis === 'PKM').length;
            const tambahan = acts.filter(a => a.jenis === 'KEGIATAN_TAMBAHAN').length;
            return (
              <div key={l.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm font-medium text-slate-800 mb-1">{l.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500 mb-3">NIDN: {l.nidn} {l.is_dtps && '• DTPS'}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-indigo-400">{penelitian}</p><p className="text-[10px] text-slate-500">Penelitian</p></div>
                  <div><p className="text-lg font-bold text-emerald-400">{pkm}</p><p className="text-[10px] text-slate-500">PkM</p></div>
                  <div><p className="text-lg font-bold text-amber-400">{tambahan}</p><p className="text-[10px] text-slate-500">Lainnya</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={tab === 'jabatan' ? 'Tambah Riwayat Jabatan' : 'Tambah Kegiatan Dosen'}>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          {tab === 'jabatan' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jenis Jabatan</label>
                  <select className="select-field">
                    <option value="STRUKTURAL">Struktural</option>
                    <option value="FUNGSIONAL">Fungsional</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nama Jabatan</label>
                  <input className="input-field" placeholder="mis. Lektor Kepala" required />
                </div>
              </div>
              <div>
                <label className="label">Nomor SK</label>
                <input className="input-field" placeholder="Nomor Surat Keputusan" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">TMT Mulai</label>
                  <input className="input-field" type="date" required />
                </div>
                <div>
                  <label className="label">TMT Selesai</label>
                  <input className="input-field" type="date" />
                  <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika masih menjabat</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Jenis Kegiatan</label>
                <select className="select-field">
                  <option value="PENELITIAN">Penelitian</option>
                  <option value="PKM">PkM</option>
                  <option value="KEGIATAN_TAMBAHAN">Kegiatan Tambahan</option>
                </select>
              </div>
              <div>
                <label className="label">Judul</label>
                <input className="input-field" placeholder="Judul kegiatan" required />
              </div>
              <div>
                <label className="label">Uraian</label>
                <textarea className="textarea-field" placeholder="Peran, sumber dana, atau hasil"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tanggal</label>
                  <input className="input-field" type="date" required />
                </div>
                <div>
                  <label className="label">Bukti (opsional)</label>
                  <input className="input-field" type="file" />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

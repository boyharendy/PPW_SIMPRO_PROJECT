'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/context';
import { mockFunding, mockStudents } from '@/lib/mock-data';
import { formatRupiah } from '@/lib/utils';
import { Plus, Download, Wallet, Check, X, FileText } from 'lucide-react';
import type { FundingRequest } from '@/lib/types';

export default function PendanaanPage() {
  const { user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showApproval, setShowApproval] = useState<string | null>(null);
  const [showCair, setShowCair] = useState<string | null>(null);

  const totalDiajukan = mockFunding.reduce((a, b) => a + (b.status === 'DIAJUKAN' ? b.estimasi_biaya : 0), 0);
  const totalDisetujui = mockFunding.reduce((a, b) => a + (b.jumlah_disetujui || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendanaan Lomba Mahasiswa"
        description="FR-12, FR-13, FR-14: Pengajuan, verifikasi dokumen, pencairan dana, dan riwayat"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Laporan</button>
            {user.roles.includes('MAHASISWA') && (
              <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Ajukan Dana</button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Total Pengajuan</p>
            <Wallet size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{mockFunding.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Total Disetujui</p>
            <Wallet size={18} className="text-emerald-500/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-500">{formatRupiah(totalDisetujui)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Menunggu Persetujuan</p>
            <Wallet size={18} className="text-amber-500/70" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{formatRupiah(totalDiajukan)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Sisa Anggaran</p>
            <Wallet size={18} className="text-indigo-500/70" />
          </div>
          <p className="text-2xl font-bold text-indigo-500">{formatRupiah(50000000 - totalDisetujui)}</p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Pengusul', render: (r) => {
            const f = r as unknown as FundingRequest;
            return (
              <div>
                <p className="font-medium text-slate-800">{f.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">{f.student?.nim}</p>
              </div>
            );
          }},
          { key: 'lomba', header: 'Lomba', render: (r) => {
            const f = r as unknown as FundingRequest;
            return (
              <div>
                <p className="font-medium text-slate-800">{f.nama_lomba}</p>
                <p className="text-xs text-slate-500">{f.tingkat} • {f.tanggal_lomba}</p>
              </div>
            );
          }},
          { key: 'dokumen', header: 'Dokumen', render: (r) => {
            const f = r as unknown as FundingRequest;
            return (
              <div className="flex gap-2">
                {f.dokumen_pendukung.map((d, i) => (
                  <button key={i} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400" title={d}>
                    <FileText size={16} />
                  </button>
                ))}
              </div>
            );
          }},
          { key: 'biaya', header: 'Estimasi Biaya', render: (r) => <span className="font-medium">{formatRupiah((r as unknown as FundingRequest).estimasi_biaya)}</span> },
          { key: 'status', header: 'Status', render: (r) => {
            const f = r as unknown as FundingRequest;
            return (
              <div className="flex flex-col gap-1 items-start">
                <StatusBadge status={f.status} />
                {f.jumlah_disetujui && f.jumlah_disetujui > 0 && (
                  <span className="text-xs text-emerald-400">Disetujui: {formatRupiah(f.jumlah_disetujui)}</span>
                )}
              </div>
            );
          }},
          { key: 'aksi', header: '', render: (r) => {
            const f = r as unknown as FundingRequest;
            if (f.status === 'DIAJUKAN' && user.roles.includes('KAPRODI')) {
              return (
                <button onClick={() => setShowApproval(f.id)} className="btn-secondary text-xs py-1.5 px-3">Verifikasi</button>
              );
            }
            if (f.status === 'DISETUJUI' && user.roles.includes('KAPRODI')) {
              return (
                <button onClick={() => setShowCair(f.id)} className="btn-primary text-xs py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white">Tandai Cair</button>
              );
            }
            return null;
          }},
        ]}
        data={mockFunding as unknown as Record<string, unknown>[]}
      />

      <Modal open={!!showCair} onClose={() => setShowCair(null)} title="Tandai Dana Cair">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-emerald-500 text-sm font-medium">Pencairan Dana (FR-13)</p>
            <p className="text-xs text-slate-600 mt-1">Pastikan bendahara prodi telah mentransfer dana ke rekening mahasiswa di luar sistem sebelum menandai status menjadi CAIR.</p>
          </div>
          <div>
            <label className="label">Tanggal Pencairan</label>
            <input className="input-field" type="date" required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button className="btn-secondary py-2" onClick={() => setShowCair(null)}>Batal</button>
            <button className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white py-2" onClick={() => setShowCair(null)}><Check size={16} className="mr-1" /> Konfirmasi Pencairan</button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ajukan Pendanaan Lomba">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Pilih Mahasiswa</label>
            <select className="select-field">
              {mockStudents.map(s => <option key={s.id} value={s.id}>{s.nim} - {s.profile?.nama_lengkap}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nama Lomba / Kegiatan</label>
            <input className="input-field" placeholder="mis. Gemastik XVII" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tingkat</label>
              <select className="select-field">
                <option value="LOKAL">Lokal</option>
                <option value="NASIONAL">Nasional</option>
                <option value="INTERNASIONAL">Internasional</option>
              </select>
            </div>
            <div>
              <label className="label">Tanggal Pelaksanaan</label>
              <input className="input-field" type="date" />
            </div>
          </div>
          <div>
            <label className="label">Estimasi Biaya (Rp)</label>
            <input className="input-field" type="number" placeholder="0" />
          </div>
          <div>
            <label className="label">RAB & Surat Pengumuman *</label>
            <input className="input-field" type="file" multiple accept=".pdf" required />
            <p className="text-xs text-slate-500 mt-1">Wajib lampirkan proposal, RAB, dan undangan/pengumuman resmi lomba.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Pengajuan</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showApproval} onClose={() => setShowApproval(null)} title="Verifikasi Pendanaan">
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-amber-400 text-sm font-medium">Perhatian</p>
            <p className="text-xs text-amber-200/70 mt-1">Kaprodi berhak menyetujui sebagian atau menolak pengajuan. Keputusan bersifat final dan akan dicatat di log audit.</p>
          </div>
          <div>
            <label className="label">Jumlah Disetujui (Rp)</label>
            <input className="input-field" type="number" defaultValue="5000000" />
          </div>
          <div>
            <label className="label">Catatan Keputusan</label>
            <textarea className="textarea-field" placeholder="Alasan persetujuan/penolakan"></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button className="btn-danger py-2" onClick={() => setShowApproval(null)}><X size={16} /> Tolak</button>
            <button className="btn-success py-2" onClick={() => setShowApproval(null)}><Check size={16} /> Setujui Pendanaan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

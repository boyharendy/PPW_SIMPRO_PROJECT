'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockAssets } from '@/lib/mock-data';
import { Plus, Download, Monitor, QrCode, CheckCircle, Wrench, AlertTriangle } from 'lucide-react';
import type { Asset } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

export default function AsetPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterKategori, setFilterKategori] = useState('all');

  const filtered = filterKategori === 'all' 
    ? mockAssets 
    : mockAssets.filter(a => a.kategori === filterKategori);

  const stats = {
    total: mockAssets.length,
    baik: mockAssets.filter(a => a.status === 'BAIK').length,
    rusak: mockAssets.filter(a => a.status === 'RUSAK').length,
    perbaikan: mockAssets.filter(a => a.status === 'DALAM_PERBAIKAN').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaris Aset Prodi"
        description="FR-23: Perekaman, monitoring kondisi, dan riwayat aset fisik/digital"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Laporan</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Catat Aset Baru</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Total Aset</p>
            <Monitor size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-emerald-600/80">Kondisi Baik</p>
            <CheckCircle size={18} className="text-emerald-500/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-500">{stats.baik}</p>
        </div>
        <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-amber-600/80">Dalam Perbaikan</p>
            <Wrench size={18} className="text-amber-500/70" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{stats.perbaikan}</p>
        </div>
        <div className="glass-card p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-red-600/80">Kondisi Rusak</p>
            <AlertTriangle size={18} className="text-red-500/70" />
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.rusak}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-500">Kategori:</label>
        <select className="select-field w-auto" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
          <option value="all">Semua Kategori</option>
          <option value="PERALATAN">Peralatan Fisik (PC, Proyektor, dll)</option>
          <option value="PERANGKAT_LUNAK">Perangkat Lunak / Lisensi</option>
          <option value="FURNITUR">Furnitur</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'kode', header: 'Kode / QR', render: (r) => {
            const a = r as unknown as Asset;
            return (
              <div className="flex items-center gap-3">
                <button className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-500" title="Cetak QR Code"><QrCode size={16} /></button>
                <code className="text-xs text-indigo-300 font-mono">{a.kode_aset}</code>
              </div>
            );
          }},
          { key: 'nama', header: 'Nama Aset', render: (r) => <span className="font-medium text-slate-800">{(r as unknown as Asset).nama_aset}</span> },
          { key: 'kategori', header: 'Kategori', render: (r) => <span className="text-xs">{(r as unknown as Asset).kategori.replace('_', ' ')}</span> },
          { key: 'lokasi', header: 'Lokasi/Ruang', render: (r) => <span>{(r as unknown as Asset).lokasi}</span> },
          { key: 'tanggal', header: 'Tgl Perolehan', render: (r) => <span className="text-sm">{formatDateShort((r as unknown as Asset).tanggal_perolehan)}</span> },
          { key: 'status', header: 'Kondisi', render: (r) => <StatusBadge status={(r as unknown as Asset).status} /> },
          { key: 'keterangan', header: 'Keterangan', render: (r) => <span className="text-xs text-slate-500 truncate max-w-[150px] inline-block">{(r as unknown as Asset).keterangan || '-'}</span> },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        onEdit={(row) => alert('Edit Aset: ' + (row as any).nama_aset)}
        onDelete={(row) => confirm('Hapus aset ini secara permanen?')}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Catat Aset Baru">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kode Aset</label>
              <input className="input-field font-mono text-sm" placeholder="Otomatis digenerate..." disabled />
            </div>
            <div>
              <label className="label">Nama Aset / Barang</label>
              <input className="input-field" placeholder="mis. PC Lab Pemrograman" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <select className="select-field">
                <option value="PERALATAN">Peralatan Fisik</option>
                <option value="PERANGKAT_LUNAK">Perangkat Lunak / Lisensi</option>
                <option value="FURNITUR">Furnitur</option>
              </select>
            </div>
            <div>
              <label className="label">Kondisi Awal</label>
              <select className="select-field">
                <option value="BAIK">Baik (Baru)</option>
                <option value="BAIK">Baik (Bekas)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lokasi Penempatan</label>
              <input className="input-field" placeholder="mis. Lab SI-01" required />
            </div>
            <div>
              <label className="label">Tanggal Perolehan</label>
              <input className="input-field" type="date" required />
            </div>
          </div>
          <div>
            <label className="label">Keterangan Tambahan</label>
            <textarea className="textarea-field" placeholder="Spesifikasi, sumber dana, dsb."></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Aset</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

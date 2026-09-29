'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockDecrees } from '@/lib/mock-data';
import { Plus, Download, FileText, Search, FolderDown } from 'lucide-react';
import type { Decree } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

export default function SKPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');

  const filtered = mockDecrees.filter(d => 
    (filterJenis === 'all' || d.jenis_sk === filterJenis) &&
    (d.judul.toLowerCase().includes(search.toLowerCase()) || d.nomor_sk.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositori SK Prodi"
        description="FR-22: Pencarian dan penyimpanan dokumen SK (Pembimbing, Panitia, Kurikulum)"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Unggah SK Baru</button>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 glass-card">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan Nomor SK atau Judul..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="select-field w-full sm:w-48"
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
        >
          <option value="all">Semua Jenis SK</option>
          <option value="Kurikulum">Kurikulum</option>
          <option value="Pembimbing">Pembimbing</option>
          <option value="Kepanitiaan">Kepanitiaan</option>
        </select>
        <select className="select-field w-full sm:w-32">
          <option>Tahun 2025</option>
          <option>Tahun 2024</option>
          <option>Semua Tahun</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { key: 'dokumen', header: 'Nomor & Judul SK', render: (r) => {
            const d = r as unknown as Decree;
            return (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{d.judul}</p>
                  <p className="text-xs text-slate-500">{d.nomor_sk}</p>
                </div>
              </div>
            );
          }},
          { key: 'jenis', header: 'Kategori', render: (r) => {
            const d = r as unknown as Decree;
            return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">{d.jenis_sk}</span>;
          }},
          { key: 'tanggal', header: 'Tgl. Ditetapkan', render: (r) => <span className="text-sm">{formatDateShort((r as unknown as Decree).tanggal_penetapan)}</span> },
          { key: 'aksi', header: 'Unduh', className: 'text-right', render: () => (
            <button className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors inline-flex ml-auto">
              <Download size={16} />
            </button>
          )},
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        emptyMessage="Tidak ada dokumen SK yang sesuai dengan pencarian."
      />

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Unggah Dokumen SK Baru">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Nomor SK</label>
            <input className="input-field" placeholder="mis. SK/PRODI/001/2025" required />
          </div>
          <div>
            <label className="label">Judul SK</label>
            <input className="input-field" placeholder="mis. Penetapan Pembimbing TA Genap 2025" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jenis Kategori</label>
              <select className="select-field">
                <option value="Kurikulum">Kurikulum</option>
                <option value="Pembimbing">Pembimbing Tugas Akhir/KP</option>
                <option value="Kepanitiaan">Kepanitiaan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="label">Tanggal Penetapan</label>
              <input className="input-field" type="date" required />
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer bg-slate-50">
            <FolderDown size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-sm font-medium text-slate-800">Klik atau seret file PDF SK ke sini</p>
            <p className="text-xs text-slate-500 mt-1">Maksimal ukuran file 10MB</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Unggah SK</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

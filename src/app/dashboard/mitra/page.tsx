'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockPartners } from '@/lib/mock-data';
import { Plus, Download, Globe, MapPin, Search, Building2, Building } from 'lucide-react';
import type { PartnerInstitution } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

export default function MitraPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = mockPartners.filter(p => 
    p.nama_lembaga.toLowerCase().includes(search.toLowerCase()) || 
    p.nomor_perjanjian.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    aktif: mockPartners.filter(p => p.status === 'AKTIF').length,
    luarNegeri: mockPartners.filter(p => p.status === 'AKTIF' && p.cakupan === 'LUAR_NEGERI').length,
    dalamNegeri: mockPartners.filter(p => p.status === 'AKTIF' && p.cakupan === 'DALAM_NEGERI').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lembaga Mitra"
        description="FR-24: Database lembaga mitra untuk Kerja Praktik (KP), Tugas Akhir (TA), dan Magang"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Mitra</button>
            <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Tambah Mitra</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Mitra Aktif</p>
            <Building2 size={18} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.aktif}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Mitra Dalam Negeri</p>
            <Building size={18} className="text-indigo-400/70" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{stats.dalamNegeri}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Mitra Luar Negeri</p>
            <Globe size={18} className="text-emerald-400/70" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.luarNegeri}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Cari nama lembaga atau nomor perjanjian..." 
          className="input-field pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={[
          { key: 'lembaga', header: 'Lembaga Mitra', render: (r) => {
            const p = r as unknown as PartnerInstitution;
            return (
              <div>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  {p.nama_lembaga} 
                  {p.cakupan === 'LUAR_NEGERI' && <Globe size={14} className="text-emerald-400" title="Luar Negeri" />}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={12} /> {p.negara}</p>
              </div>
            );
          }},
          { key: 'kontak', header: 'Kontak / PIC', render: (r) => {
            const p = r as unknown as PartnerInstitution;
            return (
              <div>
                <p className="text-sm text-slate-600">{p.nama_pic}</p>
                <p className="text-xs text-slate-500">{p.kontak_pic}</p>
              </div>
            );
          }},
          { key: 'perjanjian', header: 'Perjanjian', render: (r) => {
            const p = r as unknown as PartnerInstitution;
            return (
              <div>
                <p className="text-sm text-slate-800">{p.jenis_kerja_sama} <span className="text-slate-500 text-xs">({p.nomor_perjanjian})</span></p>
                <p className="text-xs text-slate-500">Berlaku: {formatDateShort(p.tanggal_mulai_berlaku)} - {formatDateShort(p.tanggal_akhir_berlaku)}</p>
              </div>
            );
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as PartnerInstitution).status} /> },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Lembaga Mitra">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Lembaga</label>
              <input className="input-field" placeholder="mis. PT Telkom Indonesia" required />
            </div>
            <div>
              <label className="label">Cakupan</label>
              <select className="select-field">
                <option value="DALAM_NEGERI">Dalam Negeri</option>
                <option value="LUAR_NEGERI">Luar Negeri</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Negara</label>
              <input className="input-field" defaultValue="Indonesia" required />
            </div>
            <div>
              <label className="label">Alamat Lengkap</label>
              <input className="input-field" placeholder="Kota, Provinsi" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nama PIC</label>
              <input className="input-field" placeholder="Nama narahubung" />
            </div>
            <div>
              <label className="label">Kontak PIC (Email/No. HP)</label>
              <input className="input-field" placeholder="081xxx / email@.." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
            <div>
              <label className="label">Jenis Perjanjian</label>
              <select className="select-field">
                <option value="MoU">MoU</option>
                <option value="PKS">PKS</option>
                <option value="SPK">SPK</option>
              </select>
            </div>
            <div>
              <label className="label">Nomor Perjanjian</label>
              <input className="input-field" placeholder="No. Dokumen" />
            </div>
            <div>
              <label className="label">Berlaku Sampai</label>
              <input className="input-field" type="date" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Mitra</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockAdmissions, mockPeriods, mockTrenPMB } from '@/lib/mock-data';
import { Plus, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PMBPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const filtered = selectedPeriod === 'all'
    ? mockAdmissions
    : mockAdmissions.filter(a => a.periode_id === selectedPeriod);

  const totalPendaftar = filtered.reduce((a, b) => a + b.jumlah_pendaftar, 0);
  const totalLulus = filtered.reduce((a, b) => a + b.jumlah_lulus_seleksi, 0);
  const totalDaftarUlang = filtered.reduce((a, b) => a + b.jumlah_daftar_ulang, 0);
  const rasio = totalLulus > 0 ? (totalPendaftar / totalLulus).toFixed(1) : '-';
  const persenDU = totalLulus > 0 ? ((totalDaftarUlang / totalLulus) * 100).toFixed(1) : '-';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Penerimaan Mahasiswa Baru"
        description="FR-01 & FR-02: Rekap data PMB, rasio keketatan, dan tren pendaftar"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => {}}>
              <Download size={16} /> Ekspor
            </button>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Tambah Rekap
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Total Pendaftar</p>
          <p className="text-2xl font-bold text-slate-800">{totalPendaftar.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Lulus Seleksi</p>
          <p className="text-2xl font-bold text-slate-800">{totalLulus.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">Rasio Keketatan</p>
          <p className="text-2xl font-bold text-indigo-400">1:{rasio}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-1">% Daftar Ulang</p>
          <p className="text-2xl font-bold text-emerald-400">{persenDU}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-500">Periode:</label>
        <select
          className="select-field w-auto"
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
        >
          <option value="all">Semua Periode</option>
          {mockPeriods.map(p => (
            <option key={p.id} value={p.id}>{p.tahun_ajaran} — {p.semester}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-slate-800 font-semibold mb-4">Grafik Tren PMB Antar Tahun</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={mockTrenPMB} barGap={6} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="tahun" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
              labelStyle={{ color: '#1E293B', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ fontSize: 13, color: '#475569' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="pendaftar" name="Pendaftar" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
            <Bar dataKey="lulus" name="Lulus Seleksi" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={45} />
            <Bar dataKey="daftar_ulang" name="Daftar Ulang" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { key: 'jalur_seleksi', header: 'Jalur Seleksi' },
          { key: 'jumlah_pendaftar', header: 'Pendaftar', render: (r) => <span className="font-medium text-slate-800">{(r.jumlah_pendaftar as number).toLocaleString()}</span> },
          { key: 'jumlah_lulus_seleksi', header: 'Lulus Seleksi', render: (r) => <span>{(r.jumlah_lulus_seleksi as number).toLocaleString()}</span> },
          { key: 'jumlah_daftar_ulang', header: 'Daftar Ulang', render: (r) => <span>{(r.jumlah_daftar_ulang as number).toLocaleString()}</span> },
          {
            key: 'rasio',
            header: 'Rasio',
            render: (r) => {
              const rasio = (r.jumlah_pendaftar as number) / (r.jumlah_lulus_seleksi as number);
              return <span className="text-indigo-400 font-medium">1:{rasio.toFixed(1)}</span>;
            },
          },
          {
            key: 'persen_du',
            header: '% DU',
            render: (r) => {
              const pct = ((r.jumlah_daftar_ulang as number) / (r.jumlah_lulus_seleksi as number) * 100);
              return <span className="text-emerald-400 font-medium">{pct.toFixed(1)}%</span>;
            },
          },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
      />

      {/* Add Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Rekap PMB">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
          <div>
            <label className="label">Periode</label>
            <select className="select-field">
              {mockPeriods.map(p => (
                <option key={p.id} value={p.id}>{p.tahun_ajaran} — {p.semester}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jalur Seleksi</label>
            <input className="input-field" placeholder="mis. SNBP, SNBT, Mandiri" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Pendaftar</label>
              <input className="input-field" type="number" placeholder="0" />
            </div>
            <div>
              <label className="label">Lulus Seleksi</label>
              <input className="input-field" type="number" placeholder="0" />
            </div>
            <div>
              <label className="label">Daftar Ulang</label>
              <input className="input-field" type="number" placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

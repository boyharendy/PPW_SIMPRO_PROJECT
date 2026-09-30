'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { useApp } from '@/lib/context';
import { mockSurveys, mockKepuasanPerLayanan, mockPeriods } from '@/lib/mock-data';
import { Plus, Download, LineChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SatisfactionSurvey } from '@/lib/types';

export default function KepuasanPage() {
  const { user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [fillId, setFillId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kepuasan Layanan Mahasiswa"
        description="FR-15, FR-16, FR-17: Pengelolaan kuesioner, pengisian, dan analisis kepuasan per layanan"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor Laporan</button>
            {user.roles.includes('GKM') && (
              <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Buat Kuesioner</button>
            )}
          </div>
        }
      />

      {/* Chart: Indeks Kepuasan per Layanan */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Indeks Kepuasan Berdasarkan Jenis Layanan</h3>
            <p className="text-xs text-slate-500 mt-1">Skala 1.00 (Sangat Tidak Puas) - 5.00 (Sangat Puas)</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-600" /> Periode Ini</span>
            <span className="flex items-center gap-1 ml-3"><div className="w-3 h-3 rounded-sm bg-slate-600" /> Periode Lalu</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockKepuasanPerLayanan} layout="vertical" barGap={4} margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 5]} tick={{ fill: '#64748B' }} />
            <YAxis dataKey="layanan" type="category" tick={{ fill: '#64748B', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#1E293B', fontWeight: 'bold' }}
              itemStyle={{ color: '#475569' }}
              formatter={(value: number) => [value.toFixed(2), 'Indeks']}
            />
            <Bar dataKey="indeks" name="Periode Ini" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
            <Bar dataKey="prev" name="Periode Lalu" fill="#475569" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daftar Kuesioner */}
      <h3 className="text-lg font-semibold text-slate-800 pt-4">Daftar Kuesioner Kepuasan</h3>
      <DataTable
        columns={[
          { key: 'judul', header: 'Judul Kuesioner', render: (r) => {
            const s = r as unknown as SatisfactionSurvey;
            const p = mockPeriods.find(p => p.id === s.periode_id);
            return (
              <div>
                <p className="font-medium text-slate-800">{s.judul}</p>
                <p className="text-xs text-slate-500">{p?.tahun_ajaran} — {p?.semester}</p>
              </div>
            );
          }},
          { key: 'jadwal', header: 'Jadwal Pelaksanaan', render: (r) => {
            const s = r as unknown as SatisfactionSurvey;
            return <span className="text-slate-600 text-sm">{s.tanggal_buka} s.d. {s.tanggal_tutup}</span>;
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as SatisfactionSurvey).status} /> },
          { key: 'aksi', header: '', render: (r) => {
            const s = r as unknown as SatisfactionSurvey;
            return (
              <div className="flex gap-2 justify-end">
                {s.status === 'DIBUKA' && (
                  <>
                    {user.roles.includes('GKM') && <button className="btn-secondary text-xs py-1.5 px-3">Salin Tautan</button>}
                    {user.roles.includes('MAHASISWA') && <button onClick={() => setFillId(s.id)} className="btn-primary text-xs py-1.5 px-3">Isi Kuesioner</button>}
                  </>
                )}
                {user.roles.includes('GKM') && <button className="btn-secondary text-xs py-1.5 px-3"><LineChart size={14} className="mr-1" /> Hasil</button>}
              </div>
            );
          }},
        ]}
        data={mockSurveys as unknown as Record<string, unknown>[]}
      />

      <Modal open={!!fillId} onClose={() => setFillId(null)} title="Isi Kuesioner Kepuasan">
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); setFillId(null); }}>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-sm font-medium text-slate-800">Petunjuk Pengisian (FR-15)</p>
            <p className="text-xs text-slate-600 mt-1">Pilih skala 1 (Sangat Tidak Puas) hingga 5 (Sangat Puas) untuk setiap layanan.</p>
          </div>
          <div className="space-y-4">
            {['Layanan Akademik', 'Layanan Administrasi', 'Layanan Kemahasiswaan'].map((layanan, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium text-slate-800">{layanan}</p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(score => (
                    <label key={score} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name={`layanan_${i}`} value={score} className="w-4 h-4 text-indigo-600" required />
                      <span className="text-sm text-slate-700">{score}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setFillId(null)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Jawaban</button>
          </div>
        </form>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Buat Kuesioner Baru">
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
            <label className="label">Judul Kuesioner</label>
            <input className="input-field" placeholder="mis. Kepuasan Layanan Semester Ganjil 2025/2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Buka</label>
              <input className="input-field" type="date" />
            </div>
            <div>
              <label className="label">Tanggal Tutup</label>
              <input className="input-field" type="date" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-800 mb-2">Pertanyaan Kuesioner (FR-16)</p>
            <p className="text-xs text-slate-500">Set pertanyaan otomatis disalin dari master layanan (Akademik, Administrasi, Fasilitas, Kemahasiswaan). Anda dapat mengubahnya setelah kuesioner berstatus Draft.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Draft</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

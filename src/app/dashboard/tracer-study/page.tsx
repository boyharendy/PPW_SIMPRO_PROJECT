'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { mockTracerResponses, mockStudents } from '@/lib/mock-data';
import { Mail, Download, Clock, Briefcase, Link as LinkIcon, Send } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TracerResponse, Student } from '@/lib/types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const KESESUAIAN_DATA = [
  { name: 'Sangat Sesuai', value: 45 },
  { name: 'Sesuai', value: 35 },
  { name: 'Kurang Sesuai', value: 15 },
  { name: 'Tidak Sesuai', value: 5 },
];
const WAKTU_TUNGGU_DATA = [
  { name: '< 3 Bulan', value: 60 },
  { name: '3 - 6 Bulan', value: 25 },
  { name: '> 6 Bulan', value: 15 },
];

export default function TracerStudyPage() {
  const [showBroadcast, setShowBroadcast] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracer Study Lulusan"
        description="FR-18, FR-19, FR-20, FR-21: Pengiriman token, kuesioner lulusan/pengguna, dan analitik waktu tunggu"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Ekspor IKU 1</button>
            <button className="btn-primary" onClick={() => setShowBroadcast(true)}><Send size={16} /> Broadcast Kuesioner</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <h3 className="text-slate-800 font-semibold mb-1">Kesesuaian Bidang Kerja</h3>
          <p className="text-xs text-slate-500 mb-6">Target IKU 1: Lulusan mendapat pekerjaan layak</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={KESESUAIAN_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {KESESUAIAN_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#475569', fontSize: 13, fontWeight: 500 }} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-slate-800 font-semibold mb-1">Waktu Tunggu Lulusan</h3>
              <p className="text-xs text-slate-500">Rata-rata lulusan mendapat pekerjaan pertama</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-400">3.5 <span className="text-sm font-medium text-slate-500">Bulan</span></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={WAKTU_TUNGGU_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {WAKTU_TUNGGU_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#475569', fontSize: 13, fontWeight: 500 }} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="text-slate-800 font-semibold pt-4">Status Pengisian Lulusan & Pengguna</h3>
      <DataTable
        columns={[
          { key: 'mahasiswa', header: 'Lulusan', render: (r) => {
            const t = r as unknown as TracerResponse;
            return (
              <div>
                <p className="font-medium text-slate-800">{t.student?.profile?.nama_lengkap}</p>
                <p className="text-xs text-slate-500">Lulus: {t.student?.tanggal_lulus}</p>
              </div>
            );
          }},
          { key: 'jenis', header: 'Jenis Kuesioner', render: (r) => {
            const t = r as unknown as TracerResponse;
            return (
              <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                {t.jenis_responden === 'LULUSAN' ? <Briefcase size={14} className="text-indigo-400" /> : <Clock size={14} className="text-amber-400" />}
                {t.jenis_responden.replace('_', ' ')}
              </span>
            );
          }},
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as unknown as TracerResponse).status} /> },
          { key: 'token', header: 'Token / Link', render: (r) => {
            const t = r as unknown as TracerResponse;
            return (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700 font-medium">{t.token_akses}</code>
                <button className="text-slate-400 hover:text-slate-600" title="Salin Tautan"><LinkIcon size={14} /></button>
              </div>
            );
          }},
          { key: 'aksi', header: '', render: (r) => {
            const t = r as unknown as TracerResponse;
            if (t.status === 'BELUM_DIISI') {
              return <button className="btn-secondary text-xs py-1.5 px-3"><Mail size={14} className="mr-1" /> Kirim Ulang</button>;
            }
            return <span className="text-xs text-slate-500">Diisi {t.diisi_at}</span>;
          }},
        ]}
        data={mockTracerResponses as unknown as Record<string, unknown>[]}
      />

      <Modal open={showBroadcast} onClose={() => setShowBroadcast(false)} title="Kirim Token Kuesioner Tracer Study">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowBroadcast(false); }}>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
            <p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Send size={16} className="text-indigo-400" /> Pengiriman Massal Token Unik</p>
            <p className="text-xs text-slate-500 mt-1">Sistem akan secara otomatis men-generate token unik (FR-18) dan mengirimkannya ke email masing-masing lulusan yang dipilih.</p>
          </div>
          <div>
            <label className="label">Tahun Lulus / Angkatan</label>
            <select className="select-field">
              <option>Lulusan Tahun 2025</option>
              <option>Lulusan Tahun 2024</option>
            </select>
          </div>
          <div>
            <label className="label">Penerima</label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
              {mockStudents.filter(s => s.status === 'LULUS').map(s => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="checkbox-field" defaultChecked />
                  <div>
                    <p className="text-sm text-slate-800">{s.profile?.nama_lengkap}</p>
                    <p className="text-xs text-slate-500">{s.profile?.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={() => setShowBroadcast(false)}>Batal</button>
            <button type="submit" className="btn-primary">Kirim Undangan (1 Lulusan)</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

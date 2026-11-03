'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import { BookOpen, Award, Users, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function RekapPublikasiPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const jenisData = [
    { name: 'Jurnal Ilmiah', jumlah: 14, color: '#2563EB' },
    { name: 'Prosiding Seminar', jumlah: 8, color: '#10B981' },
    { name: 'Buku Ajar / Monograf', jumlah: 2, color: '#F59E0B' },
    { name: 'Hak Cipta (HKI)', jumlah: 5, color: '#8B5CF6' },
  ];

  const peringkatData = [
    { peringkat: 'Scopus Q1/Q2', jumlah: 3 },
    { peringkat: 'Sinta 1/2', jumlah: 7 },
    { peringkat: 'Sinta 3/4', jumlah: 4 },
    { peringkat: 'Non-Peringkat', jumlah: 5 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Capaian Publikasi Ilmiah"
        description="Statistik rekap publikasi terverifikasi per jenis, peringkat akreditasi, dan keterlibatan mahasiswa dalam riset."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="select-field text-xs py-2 w-36"
            >
              <option value={2025}>Tahun 2025</option>
              <option value={2024}>Tahun 2024</option>
              <option value={2023}>Tahun 2023</option>
            </select>
            <ExportMenu title="Ekspor Rekap Publikasi" />
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Publikasi Terverifikasi"
          value="24 Judul"
          subtitle="Tercatat di data resmi prodi"
          icon={<BookOpen size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Publikasi Bersama Mahasiswa"
          value="9 Judul (37.5%)"
          subtitle="Memenuhi IKU riset kolaboratif"
          icon={<Users size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Jurnal Bereputasi Internasional"
          value="3 Artikel"
          subtitle="Scopus Q1 / Q2 terindeks"
          icon={<Award size={20} />}
          color="blue"
        />
        <StatCard
          title="Jurnal Terakreditasi Nasional"
          value="11 Artikel"
          subtitle="SINTA 1 hingga SINTA 4"
          icon={<TrendingUp size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Peringkat Akreditasi</h3>
              <p className="text-xs text-slate-500">Jumlah artikel berdasarkan indeksasi dan peringkat jurnal</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peringkatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="peringkat" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="jumlah" fill="#2563EB" radius={[6, 6, 0, 0]} name="Jumlah Publikasi" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Jenis Publikasi Breakdown */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Proporsi Jenis Luaran</h3>
            <p className="text-xs text-slate-500">Persentase luaran riset prodi</p>
          </div>

          <div className="space-y-3 pt-2">
            {jenisData.map((j) => (
              <div key={j.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: j.color }} />
                  <span className="font-semibold text-slate-700">{j.name}</span>
                </div>
                <span className="font-bold text-slate-800">{j.jumlah} Judul</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-slate-600">
            Seluruh data publikasi terverifikasi secara otomatis diteruskan ke portal SIMPRO Manajemen Prodi untuk evaluasi kinerja BKD dosen.
          </div>
        </div>
      </div>
    </div>
  );
}


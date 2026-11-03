'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import { mockCourseEvaluations, mockCourses } from '@/lib/mock-data';
import { GraduationCap, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export default function RekapEvaluasiPage() {
  const [selectedSemester, setSelectedSemester] = useState('period-2024-genap');

  const cpmkChartData = [
    { mk: 'Pengantar SI', Target: 75, Capaian: 84.5 },
    { mk: 'Basis Data', Target: 70, Capaian: 76.2 },
    { mk: 'Rekayasa PL', Target: 70, Capaian: 72.8 },
    { mk: 'Manajemen Proyek TI', Target: 75, Capaian: 79.0 },
    { mk: 'Audit & Tata Kelola SI', Target: 70, Capaian: 68.5 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Ketercapaian CPMK & Evaluasi Perkuliahan"
        description="Ringkasan pemenuhan capaian pembelajaran mata kuliah dan status pengisian evaluasi akhir semester."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="select-field text-xs py-2 w-52"
            >
              <option value="period-2024-genap">2024/2025 Semester Genap</option>
              <option value="period-2025-ganjil">2025/2026 Semester Ganjil</option>
            </select>
            <ExportMenu title="Ekspor Rekap CPMK" />
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kelas Perkuliahan"
          value="18 Kelas"
          subtitle="Semester Genap 2024/2025"
          icon={<GraduationCap size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Evaluasi Ditinjau GKM"
          value="16 Kelas (88.9%)"
          subtitle="Tuntas ditinjau"
          icon={<CheckCircle2 size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Rata-rata Ketercapaian CPMK"
          value="76.2%"
          subtitle="Di atas target standar prodi"
          icon={<Clock size={20} />}
          color="blue"
        />
        <StatCard
          title="CPMK Belum Tercapai"
          value="3 CPMK"
          subtitle="Diteruskan ke siklus revisi RPS"
          icon={<AlertTriangle size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
      </div>

      {/* CPMK Target vs Realization Bar Chart */}
      <div className="card space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Perbandingan Rata-rata Capaian CPMK vs Target per Mata Kuliah (%)
            </h3>
            <p className="text-xs text-slate-500">Evaluasi efektivitas pembelajaran semester</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cpmkChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="mk" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`${val}%`, '']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target (%)" />
              <Bar dataKey="Capaian" fill="#2563EB" radius={[4, 4, 0, 0]} name="Capaian Aktual (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


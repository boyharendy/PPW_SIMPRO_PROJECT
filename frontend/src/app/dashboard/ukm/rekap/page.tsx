'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { mockUkmParticipationStats } from '@/lib/mock-data';
import type { UkmParticipationStats } from '@/lib/types';
import { ArrowLeft, Users, CheckCircle2, PieChart } from 'lucide-react';

export default function RekapPartisipasiUkmPage() {
  const stats = mockUkmParticipationStats;
  const totalStudents = stats.reduce((s, r) => s + r.total_mahasiswa_angkatan, 0);
  const totalActive = stats.reduce((s, r) => s + r.mahasiswa_aktif_ukm, 0);
  const avgPct = totalStudents > 0 ? Math.round((totalActive / totalStudents) * 100) : 0;

  const columns: DataTableColumn<UkmParticipationStats>[] = [
    {
      key: 'angkatan',
      header: 'Angkatan',
      render: (r) => <span className="font-bold text-slate-800 text-xs sm:text-sm">Angkatan {r.angkatan}</span>,
    },
    {
      key: 'total',
      header: 'Total Mahasiswa',
      render: (r) => <span className="text-xs font-medium text-slate-700">{r.total_mahasiswa_angkatan} Mahasiswa</span>,
    },
    {
      key: 'aktif',
      header: 'Aktif di UKM',
      render: (r) => <span className="text-xs font-bold text-emerald-700">{r.mahasiswa_aktif_ukm} Mahasiswa</span>,
    },
    {
      key: 'persen',
      header: 'Tingkat Partisipasi',
      render: (r) => (
        <div className="space-y-1 min-w-[160px]">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-blue-700">{r.persentase_aktif}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.persentase_aktif}%` }} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/dashboard/ukm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Direktori UKM
        </Link>
      </div>

      <PageHeader
        title="Rekap Partisipasi UKM Mahasiswa"
        description="Statistik keaktifan mahasiswa mengikuti Unit Kegiatan Mahasiswa per angkatan untuk pemantauan keterlibatan ekstrakurikuler prodi."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Mahasiswa" value={totalStudents} subtitle="Seluruh angkatan aktif" icon={<Users size={16} />} badgeTone="blue" />
        <StatCard title="Aktif Mengikuti UKM" value={totalActive} subtitle="Terdata aktif di unit kegiatan" icon={<CheckCircle2 size={16} />} badgeTone="emerald" />
        <StatCard title="Rasio Partisipasi" value={`${avgPct}%`} subtitle="Rata-rata partisipasi prodi" icon={<PieChart size={16} />} badgeTone="indigo" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Partisipasi UKM per Angkatan</h3>
        <DataTable data={stats} columns={columns} emptyMessage="Belum ada data rekap partisipasi." />
      </div>
    </div>
  );
}

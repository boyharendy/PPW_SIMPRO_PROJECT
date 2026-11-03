'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockCourses, mockCourseEvaluations, mockProfiles } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { CourseEvaluation } from '@/lib/types';
import { GraduationCap, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const CPMK_CHART_DATA = [
  { mk: 'Pengantar SI', Target: 75, Capaian: 84.5 },
  { mk: 'Basis Data', Target: 70, Capaian: 76.2 },
  { mk: 'Rekayasa PL', Target: 70, Capaian: 72.8 },
  { mk: 'Manajemen Proyek TI', Target: 75, Capaian: 79.0 },
  { mk: 'Audit & Tata Kelola SI', Target: 70, Capaian: 68.5 },
];

const CPMK_SERIES: BarSeriesConfig[] = [
  { dataKey: 'Target', fill: '#94A3B8', name: 'Target (%)' },
  { dataKey: 'Capaian', fill: '#2563EB', name: 'Capaian Aktual (%)' },
];

const CPMK_DOMAIN: [number, number] = [0, 100];
const CPMK_TICKS = [0, 25, 50, 75, 100];

export default function RekapEvaluasiPage() {
  const [selectedSemester, setSelectedSemester] = useState('period-2024-genap');
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>(mockCourseEvaluations);

  useEffect(() => {
    const localEvals = storageSync.get<CourseEvaluation[]>(
      STORAGE_KEYS.EVALUATIONS,
      mockCourseEvaluations
    );
    if (localEvals && localEvals.length > 0) {
      setEvaluations(localEvals);
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Ketercapaian CPMK & Evaluasi Perkuliahan"
        description="Ringkasan status pengisian evaluasi dan ketercapaian CPMK per mata kuliah dan per semester beserta tindak lanjut ke siklus review RPS."
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
            <ExportMenu title="Ekspor Rekap CPMK" filename="rekap-evaluasi-cpmk" />
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
          <InteractiveBarChart
            data={CPMK_CHART_DATA}
            xKey="mk"
            series={CPMK_SERIES}
            domain={CPMK_DOMAIN}
            ticks={CPMK_TICKS}
            tooltipFormatter={(val) => `${val}%`}
            showLegend
          />
        </div>
      </div>

      {/* Tabel Status Pengisian Evaluasi & Ketercapaian CPMK per Kelas (SKPL FR-46) */}
      <div className="card space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">
            Status Pengisian Evaluasi &amp; Ketercapaian CPMK per Kelas Mata Kuliah (FR-46)
          </h3>
          <p className="text-xs text-slate-500">
            Pemantauan kelas yang sudah/belum mengisi post-evaluasi perkuliahan serta rencana perbaikan untuk RPS semester berikutnya
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left font-mono">Kode &amp; Kelas</th>
                <th className="px-3 py-2.5 text-left">Mata Kuliah &amp; Dosen Pengampu</th>
                <th className="px-3 py-2.5 text-left">Status Pengisian</th>
                <th className="px-3 py-2.5 text-right">Rata-rata CPMK</th>
                <th className="px-3 py-2.5 text-right">Rencana Perbaikan RPS</th>
                <th className="px-3 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockCourses.map((course, idx) => {
                const classId = `cls-${idx + 1}`;
                const evalDoc = evaluations.find(
                  (e) => e.course_class_id === classId || e.course_class?.course_id === course.id
                );
                const status = evalDoc ? evalDoc.status : 'DRAF';
                const cpmkList = evalDoc?.cpmk_list || [];
                const avgCpmk =
                  cpmkList.length > 0
                    ? (
                        cpmkList.reduce((acc, c) => acc + c.capaian_persen, 0) / cpmkList.length
                      ).toFixed(1)
                    : idx < CPMK_CHART_DATA.length
                    ? CPMK_CHART_DATA[idx].Capaian.toFixed(1)
                    : '-';
                const planCount = evalDoc?.improvement_plans?.length || 0;
                const lecturer =
                  mockProfiles.find((p) => p.id === evalDoc?.diisi_oleh) || mockProfiles[3];

                return (
                  <tr key={course.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-700">
                      {course.kode_mk} - Kelas SI-A
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">{course.nama_mk}</p>
                      <span className="text-[11px] text-slate-500">{lecturer.nama_lengkap}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                      {avgCpmk !== '-' ? `${avgCpmk}%` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {planCount > 0 ? `${planCount} Butir CQI` : '1 Butir CQI'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/dashboard/evaluasi-perkuliahan/${evalDoc?.course_class_id || 'cls-1'}`}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Detail Evaluasi →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

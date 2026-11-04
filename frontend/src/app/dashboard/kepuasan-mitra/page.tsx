'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockSurveyTemplates, mockSurveyResponses, mockPartners } from '@/lib/mock-data';
import { Smile, Award, Users, TrendingUp } from 'lucide-react';

const ASPECT_STATS = [
  { aspek: 'Integritas & Etika', skor: 4.8, skala: 5 },
  { aspek: 'Kompetensi Teknis', skor: 4.5, skala: 5 },
  { aspek: 'Komunikasi & Tim', skor: 4.7, skala: 5 },
  { aspek: 'Koordinasi Prodi', skor: 4.4, skala: 5 },
];

const TREND_DATA = [
  { periode: '2023/2024 Genap', KP: 4.35, PSI: 4.20, RataRata: 4.28 },
  { periode: '2024/2025 Ganjil', KP: 4.50, PSI: 4.38, RataRata: 4.44 },
  { periode: '2024/2025 Genap', KP: 4.58, PSI: 4.45, RataRata: 4.52 },
  { periode: '2025/2026 Ganjil', KP: 4.65, PSI: 4.55, RataRata: 4.60 },
];

const TREND_SERIES: BarSeriesConfig[] = [
  { dataKey: 'KP', fill: '#2563EB', name: 'Kerja Praktik' },
  { dataKey: 'PSI', fill: '#10B981', name: 'Proyek SI' },
  { dataKey: 'RataRata', fill: '#F59E0B', name: 'Rata-rata Prodi' },
];

const TREND_DOMAIN: [number, number] = [0, 5];
const TREND_TICKS = [0, 1, 2, 3, 4, 5];

export default function KepuasanMitraDashboard() {
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  // Rekap Data Skor
  const templateKP = mockSurveyTemplates[0];

  const overallScore = 4.62;
  const maxScore = 5.0;
  const percentScore = Math.round((overallScore / maxScore) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Kepuasan Mitra (KP, PSI, PDLK)"
        description="Pemantauan indeks kepuasan mitra eksternal, tren kepuasan antar periode, dan tingkat respons survei."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="select-field text-xs py-2 w-44"
            >
              <option value="ALL">Semua Program</option>
              <option value="KP">Kerja Praktik (KP)</option>
              <option value="PSI">Proyek SI (PSI)</option>
              <option value="PDLK">PDLK / Magang</option>
            </select>
            <ExportMenu title="Ekspor Rekap" />
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Indeks Kepuasan Keseluruhan"
          value={`${overallScore} / ${maxScore}`}
          subtitle={`${percentScore}% Sangat Memuaskan`}
          icon={<Smile size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Tingkat Respons Survei"
          value="85.7%"
          subtitle="30 dari 35 kuesioner terisi"
          icon={<Award size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Mitra Pengisi"
          value={mockPartners.length}
          subtitle="Aktif di 3 Program Akademik"
          icon={<Users size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Pertumbuhan Indeks"
          value="+0.16"
          subtitle="Dibandingkan semester lalu"
          icon={<TrendingUp size={20} />}
          color="blue"
        />
      </div>

      {/* Main Charts & Aspect Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Indeks Kepuasan per Periode</h3>
              <p className="text-xs text-slate-500">Perbandingan rata-rata skor kepuasan antar semester (Skala 1–5)</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Target Mutu: ≥ 4.00
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <InteractiveBarChart
              data={TREND_DATA}
              xKey="periode"
              series={TREND_SERIES}
              domain={TREND_DOMAIN}
              ticks={TREND_TICKS}
              tooltipFormatter={(val) => val.toFixed(2)}
              showLegend
            />
          </div>
        </div>

        {/* Aspect Scores Breakdown */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Indeks per Aspek Penilaian</h3>
            <p className="text-xs text-slate-500">Berdasarkan {templateKP?.aspek?.length || 4} aspek utama instrumen</p>
          </div>

          <div className="space-y-4">
            {ASPECT_STATS.map((item, idx) => {
              const pct = (item.skor / item.skala) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.aspek}</span>
                    <span className="font-bold text-blue-600">{item.skor.toFixed(2)} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-blue-900">Catatan Mutu (GKM):</p>
            <p className="text-[11px] leading-relaxed">
              Aspek koordinasi prodi terus meningkat, namun kemitraan teknis pada penguasaan tools backend modern perlu diselaraskan dengan silabus praktikum.
            </p>
          </div>
        </div>
      </div>

      {/* Mitra Responses Table Summary */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Respons Terbaru dari Mitra</h3>
            <p className="text-xs text-slate-500">Daftar umpan balik yang telah diisi langsung oleh mitra</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {mockSurveyResponses.map((resp) => (
            <div key={resp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">
                    {resp.placement?.partner?.nama_mitra}
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {resp.sumber === 'TAUTAN_MITRA' ? 'Diisi oleh Mitra' : 'Input Koordinator'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Pengisi: <strong className="text-slate-700">{resp.nama_pengisi}</strong> ({resp.jabatan_pengisi}) • Mahasiswa:{' '}
                  <span className="text-blue-600 font-medium">{resp.placement?.student?.nama_lengkap}</span>
                </p>
                {resp.komentar && (
                  <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    &ldquo;{resp.komentar}&rdquo;
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-400">Rata-rata Skor</p>
                <p className="text-base font-extrabold text-emerald-600">4.50 / 5.0</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

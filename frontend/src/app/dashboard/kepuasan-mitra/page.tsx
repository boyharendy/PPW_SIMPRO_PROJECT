'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import {
  mockSurveyTemplates,
  mockSurveyResponses,
  mockSurveyInvitations,
  mockPartners,
} from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { PartnerSurveyResponse, PartnerSurveyInvitation } from '@/lib/types';
import { Smile, Award, Users, TrendingUp, Building2 } from 'lucide-react';

const ASPECT_STATS = [
  { aspek: 'Integritas & Etika', skor: 4.8, skala: 5 },
  { aspek: 'Kompetensi Teknis', skor: 4.5, skala: 5 },
  { aspek: 'Komunikasi & Tim', skor: 4.7, skala: 5 },
  { aspek: 'Koordinasi Prodi', skor: 4.4, skala: 5 },
];

const TREND_DATA = [
  { periode: '2023/2024 Genap', KP: 4.35, PSI: 4.2, PDLK: 4.3, RataRata: 4.28 },
  { periode: '2024/2025 Ganjil', KP: 4.5, PSI: 4.38, PDLK: 4.42, RataRata: 4.44 },
  { periode: '2024/2025 Genap', KP: 4.58, PSI: 4.45, PDLK: 4.5, RataRata: 4.52 },
  { periode: '2025/2026 Ganjil', KP: 4.65, PSI: 4.55, PDLK: 4.6, RataRata: 4.6 },
];

const TREND_SERIES: BarSeriesConfig[] = [
  { dataKey: 'KP', fill: '#2563EB', name: 'Kerja Praktik (KP)' },
  { dataKey: 'PSI', fill: '#10B981', name: 'Proyek SI (PSI)' },
  { dataKey: 'PDLK', fill: '#8B5CF6', name: 'PDLK / Magang' },
  { dataKey: 'RataRata', fill: '#F59E0B', name: 'Rata-rata Prodi' },
];

const TREND_DOMAIN: [number, number] = [0, 5];
const TREND_TICKS = [0, 1, 2, 3, 4, 5];

const PROGRAM_SCORES = [
  { program: 'KP', label: 'Kerja Praktik (KP)', skor: 4.65, responden: 16, terkirim: 18 },
  { program: 'PSI', label: 'Proyek Sistem Informasi (PSI)', skor: 4.55, responden: 9, terkirim: 11 },
  { program: 'PDLK', label: 'Praktik Dunia Kerja (PDLK)', skor: 4.6, responden: 5, terkirim: 6 },
];

export default function KepuasanMitraDashboard() {
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [responses, setResponses] = useState<PartnerSurveyResponse[]>(mockSurveyResponses);
  const [invitations, setInvitations] = useState<PartnerSurveyInvitation[]>(mockSurveyInvitations);

  useEffect(() => {
    const localResps = storageSync.get<PartnerSurveyResponse[]>(
      STORAGE_KEYS.SURVEY_RESPONSES,
      mockSurveyResponses
    );
    if (localResps && localResps.length > 0) {
      setResponses(localResps);
    }
    const localInvs = storageSync.get<PartnerSurveyInvitation[]>(
      STORAGE_KEYS.SURVEY_INVITATIONS,
      mockSurveyInvitations
    );
    if (localInvs && localInvs.length > 0) {
      setInvitations(localInvs);
    }
  }, []);

  const templateKP = mockSurveyTemplates[0];

  const filteredResponses =
    selectedProgram === 'ALL'
      ? responses
      : responses.filter((r) => r.placement?.program === selectedProgram);

  const filteredProgramStats =
    selectedProgram === 'ALL'
      ? PROGRAM_SCORES
      : PROGRAM_SCORES.filter((p) => p.program === selectedProgram);

  const totalResponden = filteredProgramStats.reduce((s, p) => s + p.responden, 0);
  const totalTerkirim = filteredProgramStats.reduce((s, p) => s + p.terkirim, 0);
  const responseRate = totalTerkirim > 0 ? ((totalResponden / totalTerkirim) * 100).toFixed(1) : '85.7';

  const overallScore =
    selectedProgram === 'ALL'
      ? 4.62
      : Number((filteredProgramStats[0]?.skor || 4.6).toFixed(2));
  const maxScore = 5.0;
  const percentScore = Math.round((overallScore / maxScore) * 100);

  // Indeks Kepuasan per Mitra (FR-28)
  const partnerRecap = mockPartners.map((partner, idx) => {
    const partnerResps = responses.filter(
      (r) => r.placement?.partner_id === partner.id || r.placement?.partner?.id === partner.id
    );
    const defaultScores = [4.75, 4.5, 4.68, 4.45];
    const defaultPrograms = ['KP & PDLK', 'KP & PSI', 'PSI', 'KP'];
    let avgScore = defaultScores[idx % defaultScores.length];
    if (partnerResps.length > 0 && partnerResps[0].answers && partnerResps[0].answers.length > 0) {
      const sum = partnerResps[0].answers.reduce((acc, a) => acc + a.skor, 0);
      avgScore = Number((sum / partnerResps[0].answers.length).toFixed(2));
    }
    return {
      id: partner.id,
      nama_mitra: partner.nama_mitra,
      bidang_usaha: partner.bidang_usaha || 'Teknologi Informasi',
      program: defaultPrograms[idx % defaultPrograms.length],
      jumlah_mahasiswa: partnerResps.length > 0 ? partnerResps.length : 2,
      indeks_kepuasan: avgScore,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Kepuasan Mitra (KP, PSI, PDLK)"
        description="Pemantauan indeks kepuasan mitra eksternal per aspek, per mitra, dan per jenis program, tren antar periode, serta tingkat respons survei."
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
            <ExportMenu title="Ekspor Rekap" filename="rekap-kepuasan-mitra" />
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Indeks Kepuasan Keseluruhan"
          value={`${overallScore.toFixed(2)} / ${maxScore}`}
          subtitle={`${percentScore}% Sangat Memuaskan`}
          icon={<Smile size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Tingkat Respons Survei"
          value={`${responseRate}%`}
          subtitle={`${totalResponden} dari ${totalTerkirim} kuesioner terisi`}
          icon={<Award size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Mitra Pengisi"
          value={mockPartners.length}
          subtitle={
            selectedProgram === 'ALL'
              ? 'Aktif di 3 Program Akademik'
              : `Program ${selectedProgram}`
          }
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
              <p className="text-xs text-slate-500">
                Perbandingan rata-rata skor kepuasan antar semester (Skala 1–5)
              </p>
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
            <p className="text-xs text-slate-500">
              Berdasarkan {templateKP?.aspek?.length || 4} aspek utama instrumen
            </p>
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
              Aspek koordinasi prodi terus meningkat, namun kemitraan teknis pada penguasaan tools
              backend modern perlu diselaraskan dengan silabus praktikum.
            </p>
          </div>
        </div>
      </div>

      {/* Indeks Kepuasan per Jenis Program & per Mitra (SKPL FR-28) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Per Jenis Program */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Indeks per Jenis Program</h3>
            <p className="text-xs text-slate-500">
              Rata-rata kepuasan & tingkat respons per program akademik
            </p>
          </div>

          <div className="space-y-3">
            {filteredProgramStats.map((prog) => {
              const respPct = Math.round((prog.responden / prog.terkirim) * 100);
              return (
                <div
                  key={prog.program}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{prog.label}</span>
                    <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {prog.skor.toFixed(2)} / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Respons: {prog.responden}/{prog.terkirim} mitra ({respPct}%)
                    </span>
                    <span className="text-emerald-600 font-semibold">Sangat Baik</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per Mitra Table */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Indeks Kepuasan per Mitra</h3>
                <p className="text-xs text-slate-500">
                  Rekapitulasi rata-rata penilaian berdasarkan organisasi mitra kerja sama
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2.5 text-left">Nama Organisasi Mitra</th>
                  <th className="px-3 py-2.5 text-left">Bidang Usaha</th>
                  <th className="px-3 py-2.5 text-left">Program</th>
                  <th className="px-3 py-2.5 text-right">Indeks Kepuasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerRecap.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{m.nama_mitra}</td>
                    <td className="px-3 py-2.5 text-slate-600">{m.bidang_usaha}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        {m.program}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-600">
                      {m.indeks_kepuasan.toFixed(2)} / 5.0
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mitra Responses Table Summary */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Respons Terbaru dari Mitra</h3>
            <p className="text-xs text-slate-500">
              Daftar umpan balik yang telah diisi langsung oleh mitra maupun diinput koordinator (
              {invitations.filter((i) => i.status === 'DIISI').length} terisi)
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {filteredResponses.map((resp) => {
            const avg =
              resp.answers && resp.answers.length > 0
                ? (
                    resp.answers.reduce((acc, a) => acc + a.skor, 0) / resp.answers.length
                  ).toFixed(2)
                : '4.50';
            return (
              <div
                key={resp.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
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
                    Pengisi: <strong className="text-slate-700">{resp.nama_pengisi}</strong> (
                    {resp.jabatan_pengisi}) • Mahasiswa:{' '}
                    <span className="text-blue-600 font-medium">
                      {resp.placement?.student?.nama_lengkap}
                    </span>
                  </p>
                  {resp.komentar && (
                    <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      &ldquo;{resp.komentar}&rdquo;
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-slate-400">Rata-rata Skor</p>
                  <p className="text-base font-extrabold text-emerald-600">{avg} / 5.0</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

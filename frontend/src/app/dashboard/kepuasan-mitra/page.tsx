'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  Building2,
  Sparkles,
  Calendar,
  ChevronRight,
  Search,
  Send,
  FileText,
  ExternalLink,
  CheckCircle2,
  Star,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';

const ASPECT_STATS = [
  {
    aspek: 'Integritas & Etika',
    skor: 4.8,
    skala: 5,
    target: '4/4 tercapai',
    desc: 'Kedisiplinan dan etika kerja mahasiswa di industri.',
  },
  {
    aspek: 'Komunikasi & Tim',
    skor: 4.7,
    skala: 5,
    target: '4/4 tercapai',
    desc: 'Kolaborasi tim dan adaptasi budaya organisasi mitra.',
  },
  {
    aspek: 'Kompetensi Teknis',
    skor: 4.5,
    skala: 5,
    target: '3/4 tercapai',
    desc: 'Penguasaan rekayasa perangkat lunak & basis data.',
  },
  {
    aspek: 'Koordinasi Prodi',
    skor: 4.4,
    skala: 5,
    target: '3/4 tercapai',
    desc: 'Responsivitas dosen pembimbing dan administrasi KP/PSI.',
  },
];

const TREND_DATA = [
  { periode: '23/24 Genap', KP: 4.35, PSI: 4.2, PDLK: 4.3, RataRata: 4.28 },
  { periode: '24/25 Ganjil', KP: 4.5, PSI: 4.38, PDLK: 4.42, RataRata: 4.44 },
  { periode: '24/25 Genap', KP: 4.58, PSI: 4.45, PDLK: 4.5, RataRata: 4.52 },
  { periode: '25/26 Ganjil', KP: 4.65, PSI: 4.55, PDLK: 4.6, RataRata: 4.62 },
];

const TREND_SERIES: BarSeriesConfig[] = [
  { dataKey: 'KP', fill: '#6EE7B7', name: 'Kerja Praktik (KP)' },
  { dataKey: 'PSI', fill: '#818CF8', name: 'Proyek SI (PSI)' },
  { dataKey: 'PDLK', fill: '#38BDF8', name: 'PDLK / Magang' },
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
  const [activeTab, setActiveTab] = useState<'MITRA' | 'RESPONS' | 'PROGRAM'>('MITRA');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Indeks Kepuasan per Mitra (FR-28)
  const partnerRecap = mockPartners
    .map((partner, idx) => {
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
    })
    .filter(
      (m) =>
        m.nama_mitra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.bidang_usaha.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pendingInvitations = invitations.filter((i) => i.status !== 'DIISI');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rekap & Analitik Kepuasan Mitra (KP, PSI, PDLK)"
        description="Pemantauan indeks kepuasan mitra industri per aspek, organisasi mitra, jenis program, serta tren antar semester."
        action={
          <div className="flex items-center gap-2.5">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="select-field text-xs sm:text-sm py-2 w-44"
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

      {/* Main LoopAI Bento Grid (8 Columns Left + 4 Columns Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Indeks Kepuasan"
              value={`${overallScore.toFixed(2)} / ${maxScore}`}
              badgeText="+0.16"
              badgeTone="emerald"
              subtitle="Bandingkan 4.46 (semester lalu)"
            />
            <StatCard
              title="Tingkat Respons"
              value={`${responseRate}%`}
              badgeText={`${totalResponden}/${totalTerkirim}`}
              badgeTone="emerald"
              subtitle="Kuesioner mitra terisi"
            />
            <StatCard
              title="Mitra Industri"
              value={`${mockPartners.length} Mitra`}
              badgeText={`+${pendingInvitations.length} Aktif`}
              badgeTone="indigo"
              subtitle={
                selectedProgram === 'ALL'
                  ? 'KP, PSI & PDLK (3 Program)'
                  : `Fokus Program ${selectedProgram}`
              }
            />
          </div>

          {/* 2. Middle Analytics Card (Revenue Analytics Style) */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Analitik Tren Kepuasan Mitra</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Perbandingan capaian skor kepuasan antar periode akademik (Skala 1.0 – 5.0)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  4 Periode Terakhir
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold">
                  Target SPMI ≥ 4.00
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Insight Box & CTA */}
              <div className="md:col-span-4 space-y-4">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Capaian Aktual Program</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Sorotan Periode Aktif</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Insight Mutu GKM</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Indeks integritas &amp; komunikasi mencapai <strong>4.80/5.0</strong>. Penyelarasan kurikulum praktikum backend meningkatkan kesiapan teknis mahasiswa.
                  </p>
                </div>

                <Link
                  href="/dashboard/kepuasan-mitra/pengiriman"
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 text-white py-2.5 px-5 text-sm font-semibold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Undangan Survei</span>
                </Link>
              </div>

              {/* Right Chart Canvas */}
              <div className="md:col-span-8 h-64 w-full">
                <InteractiveBarChart
                  data={TREND_DATA}
                  xKey="periode"
                  series={TREND_SERIES}
                  domain={TREND_DOMAIN}
                  ticks={TREND_TICKS}
                  tooltipFormatter={(val) => `${val.toFixed(2)} / 5.0`}
                  showLegend
                />
              </div>
            </div>
          </div>

          {/* 3. Bottom Manage Card (Manage Projects Style with Pill Filter Tabs) */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Kelola Evaluasi &amp; Respons Mitra</h2>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama mitra atau bidang..."
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* LoopAI Pill Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('MITRA')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'MITRA'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Indeks per Mitra</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    activeTab === 'MITRA' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {partnerRecap.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('RESPONS')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'RESPONS'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Umpan Balik Masuk</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    activeTab === 'RESPONS' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {filteredResponses.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('PROGRAM')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'PROGRAM'
                    ? 'bg-indigo-50/60 text-slate-900 font-bold border border-indigo-900/25 shadow-2xs'
                    : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <span>Per Jenis Program</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-xs font-bold ${
                    activeTab === 'PROGRAM' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {filteredProgramStats.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Indeks per Mitra (LoopAI Avatar Table Style) */}
            {activeTab === 'MITRA' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs sm:text-sm font-medium text-slate-400">
                      <th className="py-3 px-3 text-left">Organisasi Mitra</th>
                      <th className="py-3 px-3 text-left">Bidang Industri</th>
                      <th className="py-3 px-3 text-left">Program</th>
                      <th className="py-3 px-3 text-left">Mahasiswa</th>
                      <th className="py-3 px-3 text-left">Indeks</th>
                      <th className="py-3 px-3 text-right">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {partnerRecap.map((m, idx) => {
                      const colors = [
                        'bg-indigo-100 text-indigo-700',
                        'bg-emerald-100 text-emerald-700',
                        'bg-sky-100 text-sky-700',
                        'bg-amber-100 text-amber-700',
                      ];
                      const badgeColors = ['bg-emerald-500', 'bg-sky-500', 'bg-indigo-500', 'bg-teal-500'];
                      const initials = m.nama_mitra
                        .replace('PT ', '')
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('');

                      return (
                        <tr key={m.id} className="hover:bg-indigo-50/25 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div
                                  className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center ${
                                    colors[idx % colors.length]
                                  }`}
                                >
                                  {initials}
                                </div>
                                <span
                                  className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full ${
                                    badgeColors[idx % badgeColors.length]
                                  } text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white`}
                                >
                                  ✓
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{m.nama_mitra}</p>
                                <p className="text-xs text-slate-400">Mitra Resmi Prodi</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-slate-800 text-sm">{m.bidang_usaha}</p>
                            <p className="text-xs text-slate-400">Penempatan Akademik</p>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold">
                              {m.program}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium">
                            {m.jumlah_mahasiswa} Mahasiswa
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-extrabold text-slate-900 text-base">
                              {m.indeks_kepuasan.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-400"> / 5.0</span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sangat Puas
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Umpan Balik Masuk */}
            {activeTab === 'RESPONS' && (
              <div className="divide-y divide-slate-100/80">
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
                      className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/20 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-base">
                            {resp.placement?.partner?.nama_mitra}
                          </span>
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            {resp.sumber === 'TAUTAN_MITRA' ? 'Portal Token Mitra' : 'Input Koordinator'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm">
                          Penilai: <strong className="text-slate-700">{resp.nama_pengisi}</strong> (
                          {resp.jabatan_pengisi}) &bull; Mahasiswa:{' '}
                          <span className="text-indigo-600 font-semibold">
                            {resp.placement?.student?.nama_lengkap}
                          </span>
                        </p>
                        {resp.komentar && (
                          <p className="text-xs sm:text-sm text-slate-600 italic bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mt-1">
                            &ldquo;{resp.komentar}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-extrabold text-emerald-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {avg} / 5.0
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Per Jenis Program */}
            {activeTab === 'PROGRAM' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {filteredProgramStats.map((prog) => {
                  const respPct = Math.round((prog.responden / prog.terkirim) * 100);
                  return (
                    <div
                      key={prog.program}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{prog.program}</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs">
                          {prog.skor.toFixed(2)} / 5.0
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700">{prog.label}</p>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${respPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Respons: {prog.responden}/{prog.terkirim} ({respPct}%)</span>
                        <span className="text-emerald-600 font-semibold">Sangat Puas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Top Right Card: Priority Tasks Style (Indeks per Aspek Instrumen) */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Indeks per Aspek</h3>
              <Link
                href="/dashboard/kepuasan-mitra/instrumen"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Lihat instrumen
              </Link>
            </div>

            <div className="space-y-2">
              {ASPECT_STATS.map((item, idx) => (
                <Link
                  key={idx}
                  href="/dashboard/kepuasan-mitra/instrumen"
                  className={`block rounded-2xl p-3.5 transition-all ${
                    idx === 0
                      ? 'bg-indigo-50/60 border border-indigo-100/80'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent inline-block shrink-0" />
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {item.aspek}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                        {item.skor.toFixed(2)} / 5.0
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 pl-6">
                    <span>Skala 1–5</span>
                    <span>&bull;</span>
                    <span>{item.target}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Action Hub (How can I help you? Style) */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Instrumen Aktif: {templateKP?.nama ? 'Kuesioner KP/PSI' : 'Standar GKM'} 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pusat Kendali Kuesioner
              </h3>
            </div>

            {/* Mode Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                Token Sekali Pakai
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                Tanpa Login
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                FR-25 s/d FR-28
              </span>
            </div>

            {/* 2x2 Grid Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/kepuasan-mitra/pengiriman"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Kirim Undangan
                </p>
              </Link>

              <Link
                href="/dashboard/kepuasan-mitra/instrumen"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Kelola Instrumen
                </p>
              </Link>

              <Link
                href="/mitra/isi/tok-telkom-2025"
                target="_blank"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Portal Mitra Publik
                </p>
              </Link>

              <Link
                href="/dashboard/kepuasan-mitra/pengiriman"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Input Respons
                </p>
              </Link>
            </div>

            {/* Bottom Prompt Bar */}
            <Link
              href="/dashboard/kepuasan-mitra/pengiriman"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Buat tautan survei mitra baru...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

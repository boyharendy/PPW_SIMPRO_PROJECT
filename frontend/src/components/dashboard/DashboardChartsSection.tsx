'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from '@/components/layout/RoleLink';
import { animate, createScope, remove, stagger, type Scope } from 'animejs';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

export interface DashboardChartsSectionProps {
  serapanRkaPersen: number;
  rpsTuntasPersen: number;
  evaluasiTerkirimPersen: number;
  totalPublikasiTahunIni: number;
  indeksKepuasanMitra: number;
  animationTrigger?: number;
}

interface QuarterTrendPoint {
  quarter: string;
  label: string;
  rkaTarget: number;
  rkaRealisasi: number;
  nominalJuta: number;
  publikasiKumulatif: number;
  publikasiTarget: number;
}

const QUARTERLY_TREND_DATA: QuarterTrendPoint[] = [
  {
    quarter: 'TW I',
    label: 'Jan–Mar 2025',
    rkaTarget: 25,
    rkaRealisasi: 24,
    nominalJuta: 107.7,
    publikasiKumulatif: 6,
    publikasiTarget: 5,
  },
  {
    quarter: 'TW II',
    label: 'Apr–Jun 2025',
    rkaTarget: 50,
    rkaRealisasi: 60,
    nominalJuta: 229.5,
    publikasiKumulatif: 14,
    publikasiTarget: 12,
  },
  {
    quarter: 'TW III',
    label: 'Jul–Sep 2025',
    rkaTarget: 75,
    rkaRealisasi: 75,
    nominalJuta: 286.8,
    publikasiKumulatif: 20,
    publikasiTarget: 18,
  },
  {
    quarter: 'TW IV',
    label: 'Okt–Des 2025 (Berjalan)',
    rkaTarget: 95,
    rkaRealisasi: 82,
    nominalJuta: 314.0,
    publikasiKumulatif: 24,
    publikasiTarget: 22,
  },
];

interface QualitySegment {
  id: string;
  label: string;
  sublabel: string;
  value: number;
  targetText: string;
  strokeColor: string;
  barClass: string;
  dotClass: string;
  badgeClass: string;
  href: string;
}

export default function DashboardChartsSection({
  serapanRkaPersen,
  rpsTuntasPersen,
  evaluasiTerkirimPersen,
  totalPublikasiTahunIni,
  indeksKepuasanMitra,
  animationTrigger = 0,
}: DashboardChartsSectionProps) {
  const [activeMetric, setActiveMetric] = useState<'RKA' | 'PUBLIKASI'>('RKA');
  const [hoveredIdx, setHoveredIdx] = useState<number>(2); // Default highlight TW III (On-Track 75%)
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const centerAvgRef = useRef<HTMLSpanElement>(null);

  // 4 Segmen Proporsi Mutu & Operasional (Standar Donut Chart: maksimal 4–5 segmen)
  const mitraPersen = Math.round((indeksKepuasanMitra / 5) * 100);
  const qualitySegments: QualitySegment[] = [
    {
      id: 'rps',
      label: 'Pengesahan RPS & Kurikulum',
      sublabel: '18/19 MK Siap Kuliah',
      value: rpsTuntasPersen,
      targetText: 'Target 90%',
      strokeColor: '#4F46E5', // indigo-600
      barClass: 'bg-indigo-600',
      dotClass: 'bg-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      href: '/dashboard/rps/rekap',
    },
    {
      id: 'mitra',
      label: 'Indeks Kepuasan Mitra',
      sublabel: `Skor ${indeksKepuasanMitra.toFixed(2)} / 5.00`,
      value: mitraPersen,
      targetText: 'Target 85%',
      strokeColor: '#10B981', // emerald-500
      barClass: 'bg-emerald-500',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      href: '/dashboard/kepuasan-mitra',
    },
    {
      id: 'evaluasi',
      label: 'Evaluasi Perkuliahan & CPMK',
      sublabel: '21/24 Kelas Terverifikasi',
      value: evaluasiTerkirimPersen,
      targetText: 'Target 85%',
      strokeColor: '#0284C7', // sky-600
      barClass: 'bg-sky-600',
      dotClass: 'bg-sky-600',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      href: '/dashboard/evaluasi-perkuliahan',
    },
    {
      id: 'rka',
      label: 'Realisasi Serapan RKA',
      sublabel: 'TW III On-Track (+15%)',
      value: serapanRkaPersen,
      targetText: 'Target 75%',
      strokeColor: '#F59E0B', // amber-500
      barClass: 'bg-amber-500',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      href: '/dashboard/rka/2025/serapan',
    },
  ];

  const averageMutuPersen = Math.round(
    qualitySegments.reduce((acc, s) => acc + s.value, 0) / qualitySegments.length
  );

  // Koordinat SVG Area/Line Chart (viewBox 520 x 190)
  const chartWidth = 520;
  const chartHeight = 190;
  const padLeft = 44;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 34;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxY = activeMetric === 'RKA' ? 100 : 28;

  const points = QUARTERLY_TREND_DATA.map((d, i) => {
    const x = padLeft + (i / (QUARTERLY_TREND_DATA.length - 1)) * plotWidth;
    const rawVal =
      activeMetric === 'RKA'
        ? i === 2
          ? serapanRkaPersen
          : d.rkaRealisasi
        : i === 3
        ? totalPublikasiTahunIni
        : d.publikasiKumulatif;
    const targetVal = activeMetric === 'RKA' ? d.rkaTarget : d.publikasiTarget;
    const y = padTop + plotHeight - (Math.min(rawVal, maxY) / maxY) * plotHeight;
    const targetY = padTop + plotHeight - (Math.min(targetVal, maxY) / maxY) * plotHeight;
    return {
      ...d,
      x,
      y,
      targetY,
      rawVal,
      targetVal,
    };
  });

  // Buat kurva kubik Bezier halus untuk garis realisasi & target
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cpx1 = prev.x + (pt.x - prev.x) * 0.45;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (pt.x - prev.x) * 0.55;
      const cpy2 = pt.y;
      return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
    }, '');
  };

  const mainLinePath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.y })));
  const targetLinePath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.targetY })));
  const areaPath = `${mainLinePath} L ${points[points.length - 1].x} ${
    padTop + plotHeight
  } L ${points[0].x} ${padTop + plotHeight} Z`;

  // Perhitungan Donut Chart SVG (4 Segmen Proporsional)
  const donutRadius = 56;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const totalSegmentScore = qualitySegments.reduce((sum, s) => sum + s.value, 0);
  const gapLength = 5; // Jarak antar segmen donut
  let cumulativeArc = 0;

  const donutArcs = qualitySegments.map((seg) => {
    const share = seg.value / totalSegmentScore;
    const arcLength = Math.max(12, share * donutCircumference - gapLength);
    const dashArray = `${arcLength} ${donutCircumference - arcLength}`;
    const dashOffset = -cumulativeArc;
    cumulativeArc += share * donutCircumference;
    return {
      ...seg,
      arcLength,
      dashArray,
      dashOffset,
    };
  });

  // Orkestrasi Animasi Anime.js saat mount, ganti tab metrik, atau refresh data
  useEffect(() => {
    if (!rootRef.current) return;

    scopeRef.current = createScope({ root: rootRef }).add(() => {
      // 1. Animasi garis kurva utama (Stroke Draw)
      remove('.anime-trend-line');
      animate('.anime-trend-line', {
        strokeDashoffset: [650, 0],
        opacity: [0.3, 1],
        duration: 850,
        ease: 'outExpo',
      });

      // 2. Animasi area bawah kurva
      remove('.anime-trend-area');
      animate('.anime-trend-area', {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 700,
        ease: 'outCubic',
      });

      // 3. Animasi titik data (staggered pop-in)
      remove('.anime-trend-point');
      animate('.anime-trend-point', {
        scale: [0, 1],
        opacity: [0, 1],
        delay: stagger(90, { start: 160 }),
        duration: 450,
        ease: 'outBack(1.6)',
      });

      // 4. Animasi bar komparatif di bawah grafik
      remove('.anime-quarter-bar');
      const quarterBars = rootRef.current?.querySelectorAll('.anime-quarter-bar');
      quarterBars?.forEach((el) => {
        const targetW = (el as HTMLElement).dataset.targetWidth || '0%';
        animate(el, {
          width: ['0%', targetW],
          duration: 750,
          delay: 150,
          ease: 'outExpo',
        });
      });

      // 5. Animasi segmen Donut Chart & Horizontal Progress Bars
      remove('.anime-donut-segment');
      animate('.anime-donut-segment', {
        opacity: [0, 1],
        scale: [0.92, 1],
        delay: stagger(80, { start: 100 }),
        duration: 600,
        ease: 'outExpo',
      });

      remove('.anime-quality-bar');
      const qualityBars = rootRef.current?.querySelectorAll('.anime-quality-bar');
      qualityBars?.forEach((el, idx) => {
        const targetW = (el as HTMLElement).dataset.targetWidth || '0%';
        animate(el, {
          width: ['0%', targetW],
          duration: 850,
          delay: 140 + idx * 80,
          ease: 'outExpo',
        });
      });
    });

    // 6. Count-Up angka rata-rata di tengah Donut Chart
    if (centerAvgRef.current) {
      const el = centerAvgRef.current;
      const counter = { val: 0 };
      animate(counter, {
        val: averageMutuPersen,
        duration: 900,
        ease: 'outExpo',
        onUpdate: () => {
          el.textContent = `${Math.round(counter.val)}%`;
        },
      });
    }

    return () => {
      scopeRef.current?.revert();
    };
  }, [activeMetric, animationTrigger, averageMutuPersen, serapanRkaPersen, totalPublikasiTahunIni]);

  const activePoint = points[hoveredIdx] || points[2];

  return (
    <section
      ref={rootRef}
      aria-label="Zona Tengah: Tren dan Visualisasi Utama"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
    >
      {/* GRAFIK 1 (7 Kolom): Area/Line Chart Tren Kinerja Triwulanan */}
      <div className="lg:col-span-7 min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-4">
        {/* Header Grafik 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 truncate">
                Tren Kinerja &amp; Serapan Triwulanan (2025)
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {activeMetric === 'RKA'
                ? 'Perbandingan realisasi serapan anggaran RKA terhadap target pagu per triwulan'
                : 'Pertumbuhan kumulatif publikasi dosen & mahasiswa terhadap target IKU tahunan'}
            </p>
          </div>

          {/* Filter Tab Switcher (Anime.js Re-trigger) */}
          <div
            role="tablist"
            aria-label="Pilih Metrik Grafik Tren"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200/80 self-start sm:self-auto shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMetric === 'RKA'}
              onClick={() => setActiveMetric('RKA')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'RKA'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serapan RKA
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMetric === 'PUBLIKASI'}
              onClick={() => setActiveMetric('PUBLIKASI')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'PUBLIKASI'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Publikasi IKU
            </button>
          </div>
        </div>

        {/* Kanvas SVG Line/Area Chart + Interactive Highlight Bar */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                {activeMetric === 'RKA' ? 'Realisasi Serapan (%)' : 'Capaian Karya Ilmiah'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
                {activeMetric === 'RKA' ? 'Target Triwulan (%)' : 'Target IKU Prodi'}
              </span>
            </div>

            {/* Info Point Aktif (Tabular-Nums & Right-Aligned) */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-700">{activePoint.quarter}:</span>
              <span className="font-bold text-indigo-700 tabular-nums">
                {activeMetric === 'RKA'
                  ? `${activePoint.rawVal}% (Rp ${activePoint.nominalJuta.toFixed(1)} Jt)`
                  : `${activePoint.rawVal} Karya (Target ${activePoint.targetVal})`}
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 sm:h-48 select-none overflow-visible"
              role="img"
              aria-label="Grafik garis tren triwulanan"
            >
              <defs>
                <linearGradient id="simproTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.24" />
                  <stop offset="85%" stopColor="#4F46E5" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Garis Grid Horizontal & Label Sumbu Y (WCAG AA #64748B) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yPos = padTop + plotHeight - ratio * plotHeight;
                const yLabel =
                  activeMetric === 'RKA'
                    ? `${Math.round(ratio * 100)}%`
                    : `${Math.round(ratio * maxY)}`;
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={chartWidth - padRight}
                      y2={yPos}
                      stroke="#E2E8F0"
                      strokeDasharray={idx === 0 ? undefined : '4 4'}
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="11"
                      fontWeight="600"
                      className="tabular-nums"
                    >
                      {yLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient di bawah kurva */}
              <path
                className="anime-trend-area"
                d={areaPath}
                fill="url(#simproTrendAreaGrad)"
              />

              {/* Garis Target (Putus-putus Hijau Emerald) */}
              <path
                d={targetLinePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeLinecap="round"
              />

              {/* Garis Utama Realisasi (Dianimasikan dengan strokeDashoffset Anime.js) */}
              <path
                className="anime-trend-line"
                d={mainLinePath}
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="650"
                strokeDashoffset="0"
              />

              {/* Titik Data Interaktif per Triwulan */}
              {points.map((pt, i) => {
                const isSelected = hoveredIdx === i;
                return (
                  <g
                    key={pt.quarter}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onClick={() => setHoveredIdx(i)}
                  >
                    {/* Garis bantu vertikal saat titik dipilih */}
                    {isSelected && (
                      <line
                        x1={pt.x}
                        y1={padTop}
                        x2={pt.x}
                        y2={padTop + plotHeight}
                        stroke="#6366F1"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Lingkaran luar aktif */}
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill="#4F46E5"
                        fillOpacity="0.16"
                      />
                    )}

                    {/* Titik utama */}
                    <circle
                      className="anime-trend-point"
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? '5.5' : '4.5'}
                      fill="#FFFFFF"
                      stroke="#4F46E5"
                      strokeWidth={isSelected ? '3' : '2.5'}
                    />

                    {/* Label Nilai di atas titik */}
                    <text
                      x={pt.x}
                      y={pt.y - 11}
                      textAnchor="middle"
                      fill={isSelected ? '#312E81' : '#475569'}
                      fontSize="11.5"
                      fontWeight="700"
                      className="tabular-nums"
                    >
                      {activeMetric === 'RKA' ? `${pt.rawVal}%` : pt.rawVal}
                    </text>

                    {/* Label Sumbu X (TW I - TW IV) */}
                    <text
                      x={pt.x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fill={isSelected ? '#1E293B' : '#64748B'}
                      fontSize="12"
                      fontWeight={isSelected ? '700' : '600'}
                    >
                      {pt.quarter}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Ringkasan Komparatif 4 Triwulan (Alignment: Label Kiri, Angka Kanan Tabular-Nums) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {points.map((pt, idx) => {
            const isSelected = hoveredIdx === idx;
            const pctWidth = Math.min(100, Math.round((pt.rawVal / maxY) * 100));
            return (
              <button
                key={pt.quarter}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
                className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-700">{pt.quarter}</span>
                  <span className="text-xs font-extrabold text-slate-900 tabular-nums text-right">
                    {activeMetric === 'RKA' ? `${pt.rawVal}%` : `${pt.rawVal} karya`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="anime-quarter-bar h-full bg-indigo-600 rounded-full"
                    data-target-width={`${pctWidth}%`}
                    style={{ width: `${pctWidth}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1 truncate">
                  {pt.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRAFIK 2 (5 Kolom): Donut Chart & Horizontal Bar Proporsi Mutu Prodi (4 Segmen) */}
      <div className="lg:col-span-5 min-w-0 rounded-[20px] border border-slate-200/85 bg-white p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-4">
        {/* Header Grafik 2 */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 truncate">
                Proporsi Capaian Mutu &amp; SPMI
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Distribusi 4 indikator penjaminan mutu utama semester berjalan
            </p>
          </div>

          <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            On-Track
          </span>
        </div>

        {/* Visualisasi Donut Chart 4 Segmen + Ringkasan Tengah */}
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 140 140"
              className="w-32 h-32 -rotate-90 overflow-visible"
              role="img"
              aria-label="Donut chart proporsi mutu program studi"
            >
              {/* Lingkaran dasar */}
              <circle
                cx="70"
                cy="70"
                r={donutRadius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="14"
              />
              {/* 4 Segmen Donut */}
              {donutArcs.map((arc) => (
                <circle
                  key={arc.id}
                  className="anime-donut-segment origin-center"
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="none"
                  stroke={arc.strokeColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                ref={centerAvgRef}
                className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none"
              >
                {averageMutuPersen}%
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1">
                Rata-rata
              </span>
            </div>
          </div>

          {/* Legenda Ringkas 4 Segmen (Alignment: Teks Kiri, Angka Kanan Tabular-Nums) */}
          <div className="flex-1 w-full space-y-2 min-w-0">
            {qualitySegments.map((seg) => (
              <div
                key={seg.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.dotClass}`} />
                  <span className="font-semibold text-slate-700 truncate">
                    {seg.label}
                  </span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums text-right shrink-0">
                  {seg.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Bar Chart Perbandingan Antar Kategori Indikator */}
        <div className="space-y-2.5">
          {qualitySegments.map((seg) => (
            <Link
              key={seg.id}
              href={seg.href}
              className="group block rounded-xl border border-slate-200/70 bg-white p-2.5 hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                    {seg.label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                </div>
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-xs font-medium text-slate-500">
                    {seg.sublabel}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 tabular-nums w-10 text-right">
                    {seg.value}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`anime-quality-bar h-full rounded-full ${seg.barClass}`}
                  data-target-width={`${seg.value}%`}
                  style={{ width: `${seg.value}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

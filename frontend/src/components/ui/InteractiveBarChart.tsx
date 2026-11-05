'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TrendingUp, BarChart2, Check } from 'lucide-react';
import { animate } from 'animejs';

export interface BarSeriesConfig {
  dataKey: string;
  name: string;
  fill: string;
  /** Optional key in each data item to override color per row */
  colorKey?: string;
}

export interface InteractiveBarChartProps<T extends Record<string, any>> {
  data: T[];
  xKey: string;
  series: BarSeriesConfig[];
  domain?: [number, number];
  ticks?: number[];
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, seriesName: string) => string;
  showLegend?: boolean;
  defaultChartType?: 'line' | 'bar';
}

// Professional Sypher / Corporate Academic palette conforming to DESIGN.md
const DEFAULT_PALETTE = [
  '#10B981', // Emerald / Mint (Revenue green in Sypher)
  '#2563EB', // SIMPRO Primary Blue
  '#F43F5E', // Rose / Red (Costs in Sypher)
  '#1E293B', // Dark Slate (Net profit in Sypher)
  '#8B5CF6', // Soft Violet / Indigo
  '#F59E0B', // Amber
];

export default function InteractiveBarChart<T extends Record<string, any>>({
  data,
  xKey,
  series,
  domain,
  ticks,
  yAxisFormatter = (val) => String(val),
  tooltipFormatter = (val) => String(val),
  showLegend = true,
  defaultChartType = 'line',
}: InteractiveBarChartProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 640, height: 260 });
  const [chartType, setChartType] = useState<'line' | 'bar'>(defaultChartType);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  // Interactive hover state - tooltip ONLY appears when cursor hovers on chart
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  // ResizeObserver to track container width/height smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDims({
          width: Math.max(320, clientWidth || 640),
          height: Math.max(200, clientHeight || 260),
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute maximum and minimum values across active series
  const visibleSeries = useMemo(() => {
    return series.filter((s) => !hiddenSeries.has(s.dataKey));
  }, [series, hiddenSeries]);

  const { minVal, maxVal, range } = useMemo(() => {
    if (domain) {
      const min = domain[0];
      const max = Math.max(domain[1], min + 1);
      return { minVal: min, maxVal: max, range: max - min };
    }
    let max = 0;
    let min = 0;
    for (const row of data) {
      for (const s of series) {
        const val = Number(row[s.dataKey]) || 0;
        if (val > max) max = val;
        if (val < min) min = val;
      }
    }
    if (max <= min) max = min + 10;
    // Round max up to a friendly number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max - min || 1)));
    const roundedMax = Math.ceil(max / magnitude) * magnitude;
    return { minVal: min, maxVal: roundedMax, range: roundedMax - min };
  }, [data, series, domain]);

  // Y-axis tick values (5 grid lines)
  const yTicks = useMemo(() => {
    if (ticks && ticks.length > 0) {
      return [...ticks].sort((a, b) => b - a);
    }
    const step = range / 4;
    return [maxVal, minVal + step * 3, minVal + step * 2, minVal + step, minVal];
  }, [ticks, minVal, maxVal, range]);

  // Layout Paddings
  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 38;

  const plotWidth = Math.max(50, dims.width - paddingLeft - paddingRight);
  const plotHeight = Math.max(50, dims.height - paddingTop - paddingBottom);
  const baselineY = paddingTop + plotHeight;

  // Resolve series color
  const getSeriesColor = (sIdx: number, baseFill?: string) => {
    if (baseFill && baseFill !== '#2563EB' && baseFill !== '#94A3B8') {
      return baseFill;
    }
    return DEFAULT_PALETTE[sIdx % DEFAULT_PALETTE.length];
  };

  // Compute coordinate mapping for points
  const getPointX = (index: number) => {
    if (data.length <= 1) return paddingLeft + plotWidth / 2;
    const colWidth = plotWidth / data.length;
    return paddingLeft + (index + 0.5) * colWidth;
  };

  const getPointY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return baselineY - ((clamped - minVal) / range) * plotHeight;
  };

  // Catmull-Rom to Cubic Bézier spline converter for silky smooth curves
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // Mouse Move Handler to track hovered column & trigger anime.js morphing entry
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const colWidth = plotWidth / data.length;
    const relativeX = mouseX - paddingLeft;

    // Check if within the plot canvas area
    if (relativeX < -15 || relativeX > plotWidth + 15) {
      handleMouseLeave();
      return;
    }

    const idx = Math.max(0, Math.min(data.length - 1, Math.floor(relativeX / colWidth)));
    setHoveredIdx(idx);

    if (!isHovering) {
      setIsHovering(true);
      setShowTooltip(true);
    }
  };

  // Mouse Leave Handler with anime.js disappearing / morphing exit animation
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (tooltipRef.current) {
      if (animRef.current) animRef.current.pause();
      animRef.current = animate(tooltipRef.current, {
        opacity: [1, 0],
        scale: [1, 0.86],
        translateY: [0, 8],
        duration: 200,
        ease: 'inCubic',
        onComplete: () => {
          setShowTooltip(false);
          setHoveredIdx(null);
        },
      });
    } else {
      setShowTooltip(false);
      setHoveredIdx(null);
    }
  };

  // Anime.js entry animation when tooltip becomes visible
  useEffect(() => {
    if (showTooltip && isHovering && tooltipRef.current) {
      if (animRef.current) animRef.current.pause();
      animRef.current = animate(tooltipRef.current, {
        opacity: [0, 1],
        scale: [0.86, 1],
        translateY: [8, 0],
        duration: 240,
        ease: 'outBack',
      });
    }
  }, [showTooltip, isHovering]);

  // Active hover data
  const activeIdx = hoveredIdx !== null && hoveredIdx < data.length ? hoveredIdx : null;
  const activeRow = activeIdx !== null ? data[activeIdx] : null;
  const activeX = activeIdx !== null ? getPointX(activeIdx) : null;

  // Toggle series visibility
  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Prevent hiding all series
        if (next.size < series.length - 1) {
          next.add(key);
        }
      }
      return next;
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col select-none font-sans">
      {/* 1. Header Toolbar (View Mode Switcher: Line / Bar) */}
      <div className="flex items-center justify-between pb-2 px-1">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Grafik Analitik
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setChartType('line')}
            title="Tampilan Garis Tren (Sypher Spline)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'line'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={14} />
            <span className="hidden sm:inline">Garis Tren</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            title="Tampilan Batang Balok"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'bar'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">Batang</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 w-full min-h-[190px] cursor-crosshair overflow-visible"
      >
        <svg
          width={dims.width}
          height={dims.height}
          className="overflow-visible block"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {/* Soft Gradient fills beneath curves (Sypher style) */}
            {series.map((s, sIdx) => {
              const color = getSeriesColor(sIdx, s.fill);
              return (
                <linearGradient
                  key={s.dataKey}
                  id={`area-grad-${s.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                  <stop offset="85%" stopColor={color} stopOpacity="0.02" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((t, idx) => {
            const y = getPointY(t);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={dims.width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="600"
                  fill="#94A3B8"
                >
                  {yAxisFormatter(t)}
                </text>
              </g>
            );
          })}

          {/* Sumbu X Baseline */}
          <line
            x1={paddingLeft}
            y1={baselineY}
            x2={dims.width - paddingRight}
            y2={baselineY}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* X-Axis Labels */}
          {data.map((row, idx) => {
            const x = getPointX(idx);
            const isHovered = activeIdx === idx;
            const labelText = String(row[xKey]);

            return (
              <text
                key={idx}
                x={x}
                y={baselineY + 20}
                textAnchor="middle"
                fontSize={isHovered ? '12' : '11'}
                fontWeight={isHovered ? '700' : '600'}
                fill={isHovered ? '#1E293B' : '#94A3B8'}
                className="transition-colors duration-150"
              >
                {labelText}
              </text>
            );
          })}

          {/* Line Mode: Smooth Curves & Area Gradients (Sypher Reference) */}
          {chartType === 'line' && (
            <>
              {/* Area Fills under curves */}
              {visibleSeries.map((s, sIdx) => {
                const points = data.map((row, idx) => ({
                  x: getPointX(idx),
                  y: getPointY(Number(row[s.dataKey]) || 0),
                }));
                const curvePath = buildSmoothPath(points);
                if (!curvePath) return null;

                const firstX = points[0].x.toFixed(1);
                const lastX = points[points.length - 1].x.toFixed(1);
                const areaPath = `${curvePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

                return (
                  <path
                    key={`area-${s.dataKey}`}
                    d={areaPath}
                    fill={`url(#area-grad-${s.dataKey})`}
                    className="transition-opacity duration-300"
                  />
                );
              })}

              {/* Stroke Lines */}
              {visibleSeries.map((s, sIdx) => {
                const color = getSeriesColor(sIdx, s.fill);
                const points = data.map((row, idx) => ({
                  x: getPointX(idx),
                  y: getPointY(Number(row[s.dataKey]) || 0),
                }));
                const curvePath = buildSmoothPath(points);
                if (!curvePath) return null;

                return (
                  <path
                    key={`line-${s.dataKey}`}
                    d={curvePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  />
                );
              })}
            </>
          )}

          {/* Bar Mode: Modern Rounded Columns */}
          {chartType === 'bar' && (
            <>
              {data.map((row, idx) => {
                const colCenter = getPointX(idx);
                const colWidth = plotWidth / data.length;
                const totalBarWidth = Math.min(colWidth * 0.72, 64);
                const barWidth = Math.max(6, totalBarWidth / visibleSeries.length);
                const startX = colCenter - (visibleSeries.length * barWidth) / 2;

                return (
                  <g key={idx}>
                    {visibleSeries.map((s, sIdx) => {
                      const color = getSeriesColor(sIdx, s.fill);
                      const rawVal = Number(row[s.dataKey]) || 0;
                      const y = getPointY(rawVal);
                      const barHeight = Math.max(3, baselineY - y);
                      const barX = startX + sIdx * barWidth + 1;
                      const isHovered = activeIdx === idx;

                      return (
                        <rect
                          key={s.dataKey}
                          x={barX}
                          y={y}
                          width={Math.max(4, barWidth - 2)}
                          height={barHeight}
                          rx={4}
                          ry={4}
                          fill={color}
                          fillOpacity={isHovered ? 1 : 0.85}
                          className="transition-all duration-150"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </>
          )}

          {/* Active Vertical Crosshair & Intersection Dots (Sypher Style) */}
          {isHovering && activeX !== null && activeRow && (
            <g className="transition-all duration-100 ease-out">
              {/* Vertical Dashed Crosshair Line */}
              <line
                x1={activeX}
                y1={paddingTop - 6}
                x2={activeX}
                y2={baselineY}
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Intersection Dots on each line */}
              {chartType === 'line' &&
                visibleSeries.map((s, sIdx) => {
                  const color = getSeriesColor(sIdx, s.fill);
                  const val = Number(activeRow[s.dataKey]) || 0;
                  const y = getPointY(val);

                  return (
                    <g key={s.dataKey}>
                      {/* Outer translucent halo */}
                      <circle cx={activeX} cy={y} r="8" fill={color} fillOpacity="0.25" />
                      {/* Inner crisp dot */}
                      <circle
                        cx={activeX}
                        cy={y}
                        r="4.5"
                        fill={color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                    </g>
                  );
                })}
            </g>
          )}
        </svg>

        {/* 3. Floating Tooltip Card (Glassmorphism with Anime.js) */}
        {showTooltip && activeRow && activeX !== null && (
          <div
            ref={tooltipRef}
            className="glass-tooltip absolute z-30 pointer-events-none p-4 min-w-[190px] max-w-[270px] will-change-transform"
            style={{
              top: `${paddingTop + 6}px`,
              left:
                activeIdx !== null && activeIdx >= data.length / 2
                  ? Math.max(10, activeX - 220)
                  : Math.min(dims.width - 230, activeX + 16),
              transition: 'left 0.12s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            {/* Tooltip Header (e.g. AUG 6, 2025 / 24/25 GANJIL) */}
            <div className="border-b border-white/50 pb-1.5 mb-2.5">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider drop-shadow-2xs">
                {String(activeRow[xKey])}
              </p>
            </div>

            {/* Series rows with square color chips and bold values */}
            <div className="space-y-2">
              {visibleSeries.map((s, sIdx) => {
                const color = getSeriesColor(sIdx, s.fill);
                const val = Number(activeRow[s.dataKey]) || 0;

                return (
                  <div
                    key={s.dataKey}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex items-center gap-2 text-slate-800 font-bold truncate">
                      {/* Square color chip with subtle glass border */}
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs border border-white/70"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="font-black text-slate-950 whitespace-nowrap pl-2">
                      {tooltipFormatter(val, s.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Legend Chips with Toggle Checkboxes (Sypher Style) */}
      {showLegend && series.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2 text-xs">
          {/* Series Toggle Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {series.map((s, idx) => {
              const color = getSeriesColor(idx, s.fill);
              const isVisible = !hiddenSeries.has(s.dataKey);

              return (
                <button
                  key={s.dataKey}
                  type="button"
                  onClick={() => toggleSeries(s.dataKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                    isVisible
                      ? 'bg-slate-50/80 border-slate-300 text-slate-800 shadow-2xs hover:bg-slate-100'
                      : 'bg-white border-dashed border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                  title={`Klik untuk ${isVisible ? 'sembunyikan' : 'tampilkan'} ${s.name}`}
                >
                  {/* Square Checkbox (Sypher reference) */}
                  <span
                    className="w-3.5 h-3.5 rounded-xs flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isVisible ? color : 'transparent',
                      border: isVisible ? `1px solid ${color}` : '1px solid #CBD5E1',
                    }}
                  >
                    {isVisible && <Check size={10} className="text-white stroke-[3]" />}
                  </span>
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Helper Subtitle */}
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            Arahkan kursor untuk melihat garis pandu & rincian nilai
          </span>
        </div>
      )}
    </div>
  );
}

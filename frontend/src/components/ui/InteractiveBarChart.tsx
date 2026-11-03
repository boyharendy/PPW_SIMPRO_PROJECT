'use client';

import React, { useState } from 'react';

export interface BarSeriesConfig {
  dataKey: string;
  name: string;
  fill: string;
  /** Optional key in each data item to override bar color per row */
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
}

export default function InteractiveBarChart<T extends Record<string, any>>({
  data,
  xKey,
  series,
  domain,
  ticks,
  yAxisFormatter = (val) => String(val),
  tooltipFormatter = (val) => String(val),
  showLegend = true,
}: InteractiveBarChartProps<T>) {
  // Default highlight on the last or peak column for the LoopAI look
  const defaultHighlight = data.length > 1 ? data.length - 1 : 0;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const activeIdx = hoveredIdx !== null ? hoveredIdx : defaultHighlight;

  // Compute max value if domain is not explicitly provided
  const computedMax = React.useMemo(() => {
    if (domain) return domain[1];
    let max = 0;
    for (const row of data) {
      for (const s of series) {
        const val = Number(row[s.dataKey]) || 0;
        if (val > max) max = val;
      }
    }
    if (max <= 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [data, series, domain]);

  const minVal = domain ? domain[0] : 0;
  const maxVal = computedMax;
  const range = Math.max(maxVal - minVal, 1);

  const yTicks = React.useMemo(() => {
    if (ticks && ticks.length > 0) {
      return [...ticks].sort((a, b) => b - a);
    }
    const step = range / 4;
    return [maxVal, minVal + step * 3, minVal + step * 2, minVal + step, minVal];
  }, [ticks, minVal, maxVal, range]);

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      {/* Main Plot Area */}
      <div className="relative flex flex-1 min-h-0 w-full">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between pr-3 pb-8 text-right text-xs font-medium text-slate-400 shrink-0">
          {yTicks.map((t, idx) => (
            <span key={idx} className="leading-none">
              {yAxisFormatter(t)}
            </span>
          ))}
        </div>

        {/* Chart Canvas */}
        <div className="relative flex-1 flex flex-col min-w-0">
          {/* Plot Grid + LoopAI Bead/Capsule Columns */}
          <div className="relative flex-1 w-full border-b border-slate-100">
            {/* Horizontal Subtle Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, idx) => (
                <div
                  key={idx}
                  className="w-full border-t border-dashed border-slate-100 last:border-t-0"
                />
              ))}
            </div>

            {/* Category Columns */}
            <div className="relative z-10 flex h-full w-full items-end justify-around px-2">
              {data.map((row, rowIdx) => {
                const isActive = activeIdx === rowIdx;
                const isHovered = hoveredIdx === rowIdx;
                const primarySeries = series[0];
                const primaryVal = primarySeries ? Number(row[primarySeries.dataKey]) || 0 : 0;

                return (
                  <div
                    key={rowIdx}
                    onMouseEnter={() => setHoveredIdx(rowIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`relative flex h-full flex-1 items-end justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 transition-all rounded-2xl cursor-pointer ${
                      isActive ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* Active Highlight Pill Badge at Top of Column (LoopAI $220 style) */}
                    {isActive && primarySeries && (
                      <div className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 z-20">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs whitespace-nowrap">
                          {tooltipFormatter(primaryVal, primarySeries.name)}
                        </span>
                      </div>
                    )}

                    {series.map((s, sIdx) => {
                      const rawValue = Number(row[s.dataKey]) || 0;
                      const pct = Math.max(
                        6,
                        Math.min(100, ((rawValue - minVal) / range) * 100)
                      );
                      // LoopAI signature colors: active column uses indigo/purple, others use mint/teal or configured color
                      const baseColor =
                        (s.colorKey && row[s.colorKey]) || s.fill;
                      const barColor =
                        isActive && sIdx === 0
                          ? '#6366F1'
                          : sIdx === 0 && baseColor === '#2563EB'
                          ? '#6EE7B7'
                          : baseColor;

                      // Number of visual beads based on percentage (up to 9 beads)
                      const beadCount = Math.max(2, Math.round((pct / 100) * 8));

                      return (
                        <div
                          key={s.dataKey}
                          className="h-full flex-1 max-w-8 flex flex-col items-center justify-end pb-1"
                        >
                          <div
                            className="w-full rounded-full transition-all duration-300 flex flex-col justify-between items-center p-0.5 overflow-hidden shadow-2xs"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: isActive && sIdx === 0 ? '#6366F1' : barColor,
                              opacity: isActive ? 1 : 0.85,
                            }}
                          >
                            {Array.from({ length: beadCount }).map((_, bIdx) => (
                              <span
                                key={bIdx}
                                className="w-2 h-2 rounded-full bg-white/35 shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Floating Detailed Tooltip on Hover */}
                    {isHovered && (
                      <div
                        className={`pointer-events-none absolute bottom-full mb-2 z-30 min-w-[175px] rounded-2xl border border-slate-200/90 bg-white p-3.5 text-xs shadow-xl ${
                          rowIdx === 0
                            ? 'left-0'
                            : rowIdx === data.length - 1
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2'
                        }`}
                      >
                        <p className="mb-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1">
                          {String(row[xKey])}
                        </p>
                        <div className="space-y-1.5">
                          {series.map((s) => {
                            const val = Number(row[s.dataKey]) || 0;
                            const barColor =
                              (s.colorKey && row[s.colorKey]) || s.fill;
                            return (
                              <div
                                key={s.dataKey}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: barColor }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </span>
                                <span className="font-bold text-slate-900 whitespace-nowrap">
                                  {tooltipFormatter(val, s.name)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-Axis Labels (with LoopAI Indigo Pill on Active Column) */}
          <div className="flex h-8 w-full items-center justify-around px-2 pt-1.5">
            {data.map((row, rowIdx) => {
              const isActive = activeIdx === rowIdx;
              return (
                <div
                  key={rowIdx}
                  className="flex-1 flex justify-center px-1 min-w-0"
                  title={String(row[xKey])}
                >
                  <span
                    className={`truncate text-xs transition-all ${
                      isActive
                        ? 'rounded-full bg-indigo-500 px-2.5 py-0.5 font-bold text-white shadow-2xs'
                        : 'font-medium text-slate-500'
                    }`}
                  >
                    {String(row[xKey])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && series.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2.5 text-xs">
          {series.map((s, idx) => (
            <div key={s.dataKey} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: idx === 0 && s.fill === '#2563EB' ? '#10B981' : s.fill }}
              />
              <span className="font-semibold text-slate-600">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

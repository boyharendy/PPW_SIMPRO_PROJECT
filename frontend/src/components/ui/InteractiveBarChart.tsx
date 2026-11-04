'use client';

import React, { useState } from 'react';

export interface BarSeriesConfig {
  dataKey: string;
  name: string;
  fill: string;
  /** Optional key in each data item to override bar color per row (like Recharts <Cell />) */
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
    // Round up nicely
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
        <div className="flex flex-col justify-between pr-3 pb-7 text-right text-[11px] text-slate-500 shrink-0">
          {yTicks.map((t, idx) => (
            <span key={idx} className="leading-none">
              {yAxisFormatter(t)}
            </span>
          ))}
        </div>

        {/* Chart Canvas */}
        <div className="relative flex-1 flex flex-col min-w-0">
          {/* Plot Grid + Bars */}
          <div className="relative flex-1 w-full border-b border-slate-200">
            {/* Horizontal Dashed Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, idx) => (
                <div
                  key={idx}
                  className="w-full border-t border-dashed border-slate-200 first:border-t-slate-200/70 last:border-t-0"
                />
              ))}
            </div>

            {/* Category Columns */}
            <div className="relative z-10 flex h-full w-full items-end justify-around px-2">
              {data.map((row, rowIdx) => {
                const isHovered = hoveredIdx === rowIdx;
                return (
                  <div
                    key={rowIdx}
                    onMouseEnter={() => setHoveredIdx(rowIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`relative flex h-full flex-1 items-end justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 transition-colors rounded-t-lg cursor-pointer ${
                      isHovered ? 'bg-slate-100/70' : ''
                    }`}
                  >
                    {series.map((s) => {
                      const rawValue = Number(row[s.dataKey]) || 0;
                      const pct = Math.max(
                        0,
                        Math.min(100, ((rawValue - minVal) / range) * 100)
                      );
                      const barColor =
                        (s.colorKey && row[s.colorKey]) || s.fill;

                      return (
                        <div
                          key={s.dataKey}
                          className="h-full flex-1 max-w-9 flex items-end justify-center"
                        >
                          <div
                            className="w-full rounded-t-[4px] transition-all duration-300"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: barColor,
                              opacity: isHovered ? 0.92 : 1,
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Floating Tooltip */}
                    {isHovered && (
                      <div
                        className={`pointer-events-none absolute bottom-full mb-2 z-30 min-w-[165px] rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg ${
                          rowIdx === 0
                            ? 'left-0'
                            : rowIdx === data.length - 1
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2'
                        }`}
                      >
                        <p className="mb-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1">
                          {String(row[xKey])}
                        </p>
                        <div className="space-y-1">
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
                                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                                    style={{ backgroundColor: barColor }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </span>
                                <span className="font-bold text-slate-800 whitespace-nowrap">
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

          {/* X-Axis Labels */}
          <div className="flex h-7 w-full items-center justify-around px-2 pt-1.5">
            {data.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex-1 text-center text-[11px] font-medium text-slate-500 truncate px-1"
                title={String(row[xKey])}
              >
                {String(row[xKey])}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && series.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2.5 text-xs">
          {series.map((s) => (
            <div key={s.dataKey} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-[3px] shrink-0"
                style={{ backgroundColor: s.fill }}
              />
              <span className="font-medium text-slate-600">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


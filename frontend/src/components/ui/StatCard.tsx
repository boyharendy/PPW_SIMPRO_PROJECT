import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  gradient?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = 'bg-slate-100 text-slate-700',
  color,
}: StatCardProps) {
  // Normalize icon container colors to clean solid palette (No neon/gradient)
  let iconColor = 'bg-slate-100 text-slate-700 border-slate-200';
  if (color === 'blue' || gradient.includes('blue') || gradient.includes('indigo')) {
    iconColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (color === 'emerald' || gradient.includes('emerald') || gradient.includes('green') || gradient.includes('teal')) {
    iconColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (color === 'amber' || gradient.includes('amber') || gradient.includes('orange') || gradient.includes('yellow')) {
    iconColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (color === 'rose' || gradient.includes('rose') || gradient.includes('red')) {
    iconColor = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (gradient.includes('purple') || gradient.includes('violet')) {
    iconColor = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-lg border ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {trend && (
            <span
              className={`text-xs font-semibold ${
                trend.value >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className="text-[11px] text-slate-400 mt-0.5">{trend.label}</p>
        )}
      </div>
    </div>
  );
}

export default StatCard;

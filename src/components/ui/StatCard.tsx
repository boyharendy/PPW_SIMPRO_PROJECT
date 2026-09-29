import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  gradient?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, gradient = 'bg-blue-50 text-blue-600' }: StatCardProps) {
  // Translate the old gradient prop to light mode bg/text color for the icon if needed
  let iconBgClass = gradient;
  if (gradient.includes('indigo')) iconBgClass = 'bg-indigo-50 text-indigo-600';
  if (gradient.includes('emerald')) iconBgClass = 'bg-emerald-50 text-emerald-600';
  if (gradient.includes('amber')) iconBgClass = 'bg-amber-50 text-amber-600';
  if (gradient.includes('rose')) iconBgClass = 'bg-rose-50 text-rose-600';
  if (gradient.includes('sky')) iconBgClass = 'bg-sky-50 text-sky-600';
  if (gradient.includes('cyan')) iconBgClass = 'bg-cyan-50 text-cyan-600';
  if (gradient.includes('fuchsia')) iconBgClass = 'bg-fuchsia-50 text-fuchsia-600';
  if (gradient.includes('violet')) iconBgClass = 'bg-violet-50 text-violet-600';

  return (
    <div className="card hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {trend && (
            <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className="text-xs text-slate-400 mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  );
}

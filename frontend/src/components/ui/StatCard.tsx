import React, { ReactNode } from 'react';
import {
  Users, CheckCircle2, Clock, AlertTriangle, BookOpen, Award,
  ShieldAlert, Compass, Trophy, FileText, Calendar, Wallet,
  PieChart, FileBadge, FileCheck, SmilePlus, Building,
  Coins, TrendingUp, DollarSign, ShieldCheck, Sparkles, Layers
} from 'lucide-react';

const stringIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Users, CheckCircle2, Clock, AlertTriangle, BookOpen, Award,
  ShieldAlert, Compass, Trophy, FileText, Calendar, Wallet,
  PieChart, FileBadge, FileCheck, SmilePlus, Building,
  Coins, TrendingUp, DollarSign, ShieldCheck, Sparkles, Layers
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  badgeText?: string;
  badgeTone?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'slate';
  gradient?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export function StatCard({
  title,
  value,
  subtitle,
  description,
  icon,
  trend,
  badgeText,
  badgeTone,
  gradient = 'bg-slate-100 text-slate-700',
  color,
}: StatCardProps) {
  const descText = subtitle || description || trend?.label;

  let pillColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (badgeTone === 'rose' || color === 'rose' || gradient.includes('rose') || gradient.includes('red') || (trend && trend.value < 0)) {
    pillColor = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (badgeTone === 'amber' || color === 'amber' || gradient.includes('amber') || gradient.includes('orange') || gradient.includes('yellow')) {
    pillColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (badgeTone === 'indigo' || gradient.includes('purple') || gradient.includes('violet') || gradient.includes('indigo')) {
    pillColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (badgeTone === 'blue' || color === 'blue' || gradient.includes('blue')) {
    pillColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (badgeTone === 'slate' || color === 'slate') {
    pillColor = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const computedBadge =
    badgeText ||
    (trend ? `${trend.value >= 0 ? '+' : ''}${trend.value}%` : undefined);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      {/* Top Row: Clean Title + Badge / Icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>

        {computedBadge ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${pillColor}`}
          >
            {computedBadge}
          </span>
        ) : icon ? (
          <div
            className={`inline-flex items-center justify-center rounded-lg border p-1.5 text-xs font-semibold shrink-0 ${pillColor}`}
          >
            {typeof icon === 'string'
              ? stringIconMap[icon]
                ? React.createElement(stringIconMap[icon], { size: 16 })
                : null
              : icon}
          </div>
        ) : null}
      </div>

      {/* Bottom Row: Balanced Value + Subtitle */}
      <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </h3>

        {descText && (
          <p className="text-xs text-slate-500 font-medium truncate">
            {descText}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;

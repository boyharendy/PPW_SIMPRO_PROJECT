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

  // Determine LoopAI pill badge color
  let pillColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (badgeTone === 'rose' || color === 'rose' || gradient.includes('rose') || gradient.includes('red') || (trend && trend.value < 0)) {
    pillColor = 'bg-rose-50 text-rose-600 border-rose-200';
  } else if (badgeTone === 'amber' || color === 'amber' || gradient.includes('amber') || gradient.includes('orange') || gradient.includes('yellow')) {
    pillColor = 'bg-amber-50 text-amber-600 border-amber-200';
  } else if (badgeTone === 'indigo' || gradient.includes('purple') || gradient.includes('violet') || gradient.includes('indigo')) {
    pillColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
  } else if (badgeTone === 'blue' || color === 'blue' || gradient.includes('blue')) {
    pillColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  } else if (badgeTone === 'slate' || color === 'slate') {
    pillColor = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  // Derive default badge text if not explicitly passed
  const computedBadge =
    badgeText ||
    (trend ? `${trend.value >= 0 ? '+' : ''}${trend.value}%` : undefined);

  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-200/80 transition-all flex flex-col justify-between">
      {/* Top Row: Clean Title (Left) + LoopAI Pill Badge (Right) */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-slate-800 tracking-tight truncate">{title}</p>

        {computedBadge ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs sm:text-sm font-semibold shrink-0 ${pillColor}`}
          >
            {computedBadge}
          </span>
        ) : icon ? (
          <div
            className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0 ${pillColor}`}
          >
            {typeof icon === 'string'
              ? stringIconMap[icon]
                ? React.createElement(stringIconMap[icon], { size: 15 })
                : null
              : icon}
          </div>
        ) : null}
      </div>

      {/* Bottom Row: Big Bold Value (Left) + Contextual Comparison Label (Right) */}
      <div className="mt-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>

        {descText && (
          <p className="text-xs sm:text-sm text-slate-400 font-medium truncate">
            {descText}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;

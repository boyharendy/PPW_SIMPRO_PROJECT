import React from 'react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { CheckCircle2, Clock, CircleDashed, AlertCircle, Eye } from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  const s = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-xs sm:text-sm px-3.5 py-1',
    lg: 'text-sm sm:text-base px-4 py-1.5',
  }[size];

  // Pick LoopAI-style circular status icon
  let IconComponent = Clock;
  if (
    s.includes('SELESAI') ||
    s.includes('DISAHKAN') ||
    s.includes('DISETUJUI') ||
    s.includes('TERVERIFIKASI') ||
    s.includes('TERBIT') ||
    s.includes('AKTIF') ||
    s.includes('LULUS') ||
    s.includes('SUDAH')
  ) {
    IconComponent = CheckCircle2;
  } else if (s.includes('DRAF') || s.includes('IDE') || s.includes('BELUM')) {
    IconComponent = CircleDashed;
  } else if (s.includes('DIREVIEW') || s.includes('REVIEW') || s.includes('DITINDAKLANJUTI')) {
    IconComponent = Eye;
  } else if (s.includes('DITOLAK') || s.includes('REVISI') || s.includes('BATAL')) {
    IconComponent = AlertCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap transition-colors ${color} ${sizeClasses} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-85" />
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;

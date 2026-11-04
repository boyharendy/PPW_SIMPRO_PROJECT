'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  BookOpen,
  Plane,
  Coins,
  BookCheck,
  GraduationCap,
  MessageSquareHeart,
  Settings,
  Sparkles,
} from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}

interface SubNavItem {
  label: string;
  href: string;
}

interface ModuleConfig {
  code: string;
  shortBrand: string;
  tags: { text: string; bg: string }[];
  icon: React.ComponentType<{ className?: string }>;
  tabs: SubNavItem[];
}

function getModuleConfig(pathname: string): ModuleConfig | null {
  if (pathname.startsWith('/dashboard/kepuasan-mitra')) {
    return {
      code: 'M07',
      shortBrand: 'MitraAI',
      tags: [
        { text: 'KP', bg: 'bg-emerald-500' },
        { text: 'PSI', bg: 'bg-sky-500' },
        { text: 'PD', bg: 'bg-teal-600' },
      ],
      icon: Building2,
      tabs: [
        { label: 'Overview', href: '/dashboard/kepuasan-mitra' },
        { label: 'Instrumen', href: '/dashboard/kepuasan-mitra/instrumen' },
        { label: 'Pengiriman & Input', href: '/dashboard/kepuasan-mitra/pengiriman' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/publikasi')) {
    return {
      code: 'M08',
      shortBrand: 'Publikasi',
      tags: [
        { text: 'Q1', bg: 'bg-emerald-500' },
        { text: 'S2', bg: 'bg-sky-500' },
        { text: 'HKI', bg: 'bg-indigo-500' },
      ],
      icon: BookOpen,
      tabs: [
        { label: 'Overview', href: '/dashboard/publikasi' },
        { label: 'Analitik IKU', href: '/dashboard/publikasi/rekap' },
        { label: 'Verifikasi', href: '/dashboard/publikasi/verifikasi' },
        { label: 'Review Saya', href: '/dashboard/publikasi/review-saya' },
        { label: 'Publikasi Baru', href: '/dashboard/publikasi/baru' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/perjalanan-dinas')) {
    return {
      code: 'M09',
      shortBrand: 'DinasPro',
      tags: [
        { text: 'ST', bg: 'bg-emerald-500' },
        { text: 'SPJ', bg: 'bg-sky-500' },
        { text: 'RKA', bg: 'bg-teal-600' },
      ],
      icon: Plane,
      tabs: [
        { label: 'Overview', href: '/dashboard/perjalanan-dinas' },
        { label: 'Persetujuan', href: '/dashboard/perjalanan-dinas/persetujuan' },
        { label: 'Rekap & SPJ', href: '/dashboard/perjalanan-dinas/rekap' },
        { label: 'Ajukan Dinas', href: '/dashboard/perjalanan-dinas/baru' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/rka')) {
    return {
      code: 'M10',
      shortBrand: 'Anggaran',
      tags: [
        { text: '25', bg: 'bg-emerald-500' },
        { text: 'TW', bg: 'bg-sky-500' },
        { text: 'RP', bg: 'bg-teal-600' },
      ],
      icon: Coins,
      tabs: [
        { label: 'Dokumen RKA', href: '/dashboard/rka' },
        { label: 'Ringkasan 2025', href: '/dashboard/rka/2025' },
        { label: 'Versi Kerja', href: '/dashboard/rka/2025/versi-kerja' },
        { label: 'Realisasi', href: '/dashboard/rka/2025/realisasi' },
        { label: 'Analitik Serapan', href: '/dashboard/rka/2025/serapan' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/rps')) {
    return {
      code: 'M11',
      shortBrand: 'MutuRPS',
      tags: [
        { text: 'MK', bg: 'bg-emerald-500' },
        { text: 'peer', bg: 'bg-sky-500' },
        { text: 'SAH', bg: 'bg-teal-600' },
      ],
      icon: BookCheck,
      tabs: [
        { label: 'Overview', href: '/dashboard/rps' },
        { label: 'Review Saya', href: '/dashboard/rps/review-saya' },
        { label: 'Rekap Kepatuhan', href: '/dashboard/rps/rekap' },
        { label: 'Ajukan RPS', href: '/dashboard/rps/ajukan' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/evaluasi-perkuliahan')) {
    return {
      code: 'M12',
      shortBrand: 'EvalMK',
      tags: [
        { text: 'OB', bg: 'bg-emerald-500' },
        { text: 'CP', bg: 'bg-sky-500' },
        { text: 'ED', bg: 'bg-teal-600' },
      ],
      icon: GraduationCap,
      tabs: [
        { label: 'Evaluasi Kelas', href: '/dashboard/evaluasi-perkuliahan' },
        { label: 'Rekap Mutu & CPMK', href: '/dashboard/evaluasi-perkuliahan/rekap' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/kelola/aduan') || pathname.startsWith('/dashboard/aduan')) {
    return {
      code: 'M13',
      shortBrand: 'AduanCare',
      tags: [
        { text: 'SL', bg: 'bg-emerald-500' },
        { text: 'AN', bg: 'bg-sky-500' },
        { text: 'PK', bg: 'bg-rose-500' },
      ],
      icon: MessageSquareHeart,
      tabs: [
        { label: 'Antrean Aduan', href: '/dashboard/kelola/aduan' },
        { label: 'Disposisi Saya', href: '/dashboard/kelola/aduan/tugas-saya' },
        { label: 'Sensitif (Satgas)', href: '/dashboard/kelola/aduan/sensitif' },
        { label: 'Analitik & SLA', href: '/dashboard/kelola/aduan/rekap' },
        { label: 'Kirim Anonim', href: '/dashboard/aduan' },
      ],
    };
  }
  if (pathname.startsWith('/dashboard/pengaturan')) {
    return {
      code: 'CFG',
      shortBrand: 'TataKelola',
      tags: [
        { text: 'RB', bg: 'bg-emerald-500' },
        { text: 'SP', bg: 'bg-sky-500' },
      ],
      icon: Settings,
      tabs: [
        { label: 'Matriks Peran', href: '/dashboard/pengaturan/peran' },
        { label: 'Standar Mutu', href: '/dashboard/pengaturan/mutu' },
      ],
    };
  }
  return null;
}

export function PageHeader({
  title,
  description,
  subtitle,
  action,
  actions,
  badge,
}: PageHeaderProps) {
  const pathname = usePathname() || '';
  const descText = subtitle || description;
  const actionContent = actions || action;
  const modConfig = getModuleConfig(pathname);

  return (
    <div className="space-y-4 mb-5">
      {/* Top Bar: LoopAI Pill Navigation & Brand Clusters (for Modul 7-13) */}
      {modConfig && (
        <div className="rounded-[22px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Brand Pill + Overlapping Colored Avatar Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <modConfig.icon className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                {modConfig.shortBrand}
              </span>
            </div>

            {/* Overlapping Mini Badges (LoopAI style) */}
            <div className="hidden sm:flex items-center -space-x-2 ml-2">
              {modConfig.tags.map((t, idx) => (
                <span
                  key={idx}
                  className={`w-8 h-8 rounded-full ${t.bg} text-white text-xs font-bold flex items-center justify-center ring-2 ring-white shadow-2xs`}
                >
                  {t.text}
                </span>
              ))}
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center justify-center ring-2 ring-white">
                {modConfig.code}
              </span>
            </div>
          </div>

          {/* Center: LoopAI Pill Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 overflow-x-auto">
            {modConfig.tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 font-bold border border-indigo-900/25 shadow-xs'
                      : 'text-slate-600 font-medium hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {actionContent || (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SPMI Terintegrasi</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title & Subtitle Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {descText && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {descText}
            </p>
          )}
        </div>
        {!modConfig && actionContent && (
          <div className="flex-shrink-0 flex items-center gap-2.5">{actionContent}</div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;

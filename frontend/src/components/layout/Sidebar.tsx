'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS } from '@/lib/navigation';
import type { Role } from '@/lib/types';
import AnimatedSimproLogo from '@/components/Logo/AnimatedSimproLogo';
import {
  LayoutDashboard, FileCheck, Wallet, SmilePlus, FileText,
  GraduationCap, Users, BookOpen, Handshake, Settings,
  ChevronDown, LogOut, Plane, BookCheck, ClipboardCheck,
  MessageSquareHeart, ShieldAlert, FileSpreadsheet, PieChart,
  ExternalLink, Layers, Award, Clock, Compass, Calendar, FileBadge
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  SmilePlus,
  FileText,
  Handshake,
  BookOpen,
  FileCheck,
  ClipboardCheck,
  PieChart,
  Plane,
  FileSpreadsheet,
  Wallet,
  BookCheck,
  GraduationCap,
  MessageSquareHeart,
  ShieldAlert,
  Settings,
  Users,
  Award,
  Clock,
  Compass,
  Calendar,
  FileBadge,
  Layers,
};

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Utama': LayoutDashboard,
  'Laporan Perwalian': Users,
  'Beasiswa & Jam Karya': Clock,
  'Pelanggaran & Sanksi': ShieldAlert,
  'Unit Kegiatan Mahasiswa': Compass,
  'Program Kerja Himpunan': Calendar,
  'Sertifikat Mahasiswa': FileBadge,
  'Kepuasan Mitra': SmilePlus,
  'Publikasi': BookOpen,
  'Perjalanan Dinas': Plane,
  'Anggaran & RKA': Wallet,
  'Mutu Pembelajaran': BookCheck,
  'Layanan Aduan': MessageSquareHeart,
  'Pengaturan': Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useApp();

  // Check if role is authorized (including backward compatibility aliases)
  const isRoleAuthorized = (allowedRoles: Role[], currentRole: Role): boolean => {
    if (allowedRoles.includes(currentRole)) return true;
    if (currentRole === 'KOORDINATOR_KP_PSI_PDLK') {
      return allowedRoles.some(r => r === 'KOORDINATOR_KP' || r === 'KOORDINATOR_PSI' || r === 'KOORDINATOR_PDLK' || r === 'KOORDINATOR_KP_PSI_PDLK');
    }
    if (currentRole === 'KOORDINATOR_KP' || currentRole === 'KOORDINATOR_PSI' || currentRole === 'KOORDINATOR_PDLK') {
      return allowedRoles.includes('KOORDINATOR_KP_PSI_PDLK');
    }
    if (currentRole === 'MITRA') {
      return allowedRoles.includes('MITRA_EKSTERNAL');
    }
    if (currentRole === 'MITRA_EKSTERNAL') {
      return allowedRoles.includes('MITRA');
    }
    if (currentRole === 'PENGELOLA_ADUAN') {
      return allowedRoles.includes('PETUGAS_KEKERASAN');
    }
    if (currentRole === 'PETUGAS_KEKERASAN') {
      return allowedRoles.includes('PENGELOLA_ADUAN');
    }
    if (currentRole === 'PENGURUS_HIMPUNAN') {
      return allowedRoles.includes('HIMPUNAN');
    }
    if (currentRole === 'HIMPUNAN') {
      return allowedRoles.includes('PENGURUS_HIMPUNAN');
    }
    return false;
  };

  // Filter items visible to current user's active role or user's assigned roles
  const visibleItems = NAV_ITEMS.filter(item =>
    isRoleAuthorized(item.roles, user.activeRole)
  );

  // Group items by category
  const categories = Array.from(new Set(visibleItems.map(item => item.category || 'Lainnya')));

  // Determine the single active item with highest precedence (exact match or longest matching prefix)
  const activeItemHref = (() => {
    const exact = visibleItems.find((item) => item.href === pathname);
    if (exact) return exact.href;

    const prefixMatches = visibleItems.filter((item) => {
      if (item.href === '/dashboard') {
        return pathname === '/dashboard';
      }
      return pathname.startsWith(item.href + '/');
    });

    if (prefixMatches.length > 0) {
      prefixMatches.sort((a, b) => b.href.length - a.href.length);
      return prefixMatches[0].href;
    }

    return null;
  })();

  // State to track which categories are expanded in accordion/dropdown
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      const catItems = visibleItems.filter((i) => (i.category || 'Lainnya') === cat);
      if (catItems.some((item) => item.href === activeItemHref)) {
        initial[cat] = true;
      }
    });
    return initial;
  });

  // Automatically keep the category of the active page open
  useEffect(() => {
    categories.forEach((cat) => {
      const catItems = visibleItems.filter((i) => (i.category || 'Lainnya') === cat);
      if (catItems.some((item) => item.href === activeItemHref)) {
        setOpenCategories((prev) => ({ ...prev, [cat]: true }));
      }
    });
  }, [activeItemHref]);

  const toggleCategory = (cat: string) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setOpenCategories((prev) => ({ ...prev, [cat]: true }));
      return;
    }
    setOpenCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-blue-600
          transition-all duration-500 ease-out
          flex flex-col shadow-xl
          ${sidebarOpen ? 'w-64' : 'w-20'}
          lg:relative
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Animated SVG Logo & Blue Header Section (Anime.js createScope + SVG Morphing) */}
        <AnimatedSimproLogo
          collapsed={!sidebarOpen}
          onToggleCollapse={(nextCollapsed) => setSidebarOpen(!nextCollapsed)}
          onMobileClose={() => setSidebarOpen(false)}
        />

        {/* White Navigation Container with rounded-tr-[2rem] */}
        <div className="flex-1 bg-white rounded-tr-[2rem] flex flex-col pt-5 overflow-hidden relative shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)]">
          <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
            {categories.map((cat) => {
              const catItems = visibleItems.filter((i) => (i.category || 'Lainnya') === cat);
              if (catItems.length === 0) return null;

              // 1. Dashboard Utama (Standalone direct navigation)
              if (cat === 'Utama') {
                const mainItem = catItems[0];
                const isActive = mainItem.href === activeItemHref;
                const MainIcon = iconMap[mainItem.icon] || LayoutDashboard;

                return (
                  <Link
                    key={mainItem.href}
                    href={mainItem.href}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
                      transition-all duration-150 mb-1
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                      }
                    `}
                    title={!sidebarOpen ? mainItem.title : undefined}
                  >
                    <MainIcon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                      }`}
                    />
                    {sidebarOpen && <span>{mainItem.title}</span>}
                  </Link>
                );
              }

              // 2. Dropdown Category Accordion
              const CategoryIcon = categoryIconMap[cat] || Layers;
              const isCatOpen = !!openCategories[cat];
              const isChildActive = catItems.some((item) => item.href === activeItemHref);
              const totalCategoryBadge = catItems.reduce((sum, item) => sum + (item.badge || 0), 0);

              return (
                <div key={cat} className="space-y-0.5 mb-1">
                  {/* Category Header Button: Entire row toggles dropdown, does NOT navigate */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold
                      transition-all duration-150 text-left cursor-pointer
                      ${isChildActive
                        ? 'text-blue-700 bg-blue-50/70 font-bold'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                      }
                    `}
                    title={!sidebarOpen ? cat : undefined}
                    aria-expanded={isCatOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CategoryIcon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isChildActive ? 'text-blue-600' : 'text-slate-500'
                        }`}
                      />
                      {sidebarOpen && <span className="truncate">{cat}</span>}
                    </div>

                    {sidebarOpen && (
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {!isCatOpen && totalCategoryBadge > 0 && (
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {totalCategoryBadge}
                          </span>
                        )}
                        <ChevronDown
                          size={15}
                          className={`text-slate-400 transition-transform duration-200 ${
                            isCatOpen ? 'rotate-180 text-blue-600' : ''
                          }`}
                        />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Items: Direct vertical list matching Image 2 composition without truncation */}
                  {isCatOpen && sidebarOpen && (
                    <div className="mt-0.5 mb-1 space-y-0.5 pl-2 pr-0.5 py-0.5">
                      {catItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isExactActive = item.href === activeItemHref;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`
                              group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium
                              transition-all duration-150 cursor-pointer
                              ${isExactActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/70'
                              }
                            `}
                            title={item.title}
                          >
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                isExactActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                              }`}
                            />
                            <span className="leading-snug text-left flex-1 break-words">
                              {item.title}
                            </span>
                            {item.badge && item.badge > 0 && (
                              <span
                                className={`ml-1.5 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                                  isExactActive ? 'bg-white text-blue-600' : 'bg-red-600 text-white'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Public Links Shortcut */}
            {sidebarOpen && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <p className="px-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Akses Publik (Non-Login)
                </p>
                <Link
                  href="/mitra/isi/tok-telkom-2025"
                  className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Kuesioner Mitra (Demo)</span>
                </Link>
                <Link
                  href="/aduan/lacak"
                  className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Lacak Tiket Aduan</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors w-full font-semibold text-sm"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Keluar Sistem</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

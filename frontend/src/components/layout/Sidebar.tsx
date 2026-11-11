'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { animate, remove } from 'animejs';
import { NAV_ITEMS } from '@/lib/navigation';
import type { Role, NavItem, BusinessTrip, Complaint, RpsSubmission, Publication } from '@/lib/types';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import {
  mockBusinessTrips,
  mockComplaints,
  mockRpsSubmissions,
  mockPublications,
} from '@/lib/mock-data';
import AnimatedSimproLogo from '@/components/Logo/AnimatedSimproLogo';
import AnimatedCollapse from '@/components/ui/AnimatedCollapse';
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

  // State untuk menyimpan halaman yang sudah dikunjungi di sesi ini agar badge dismiss
  const [visitedPages, setVisitedPages] = useState<Set<string>>(new Set());
  const [, setStorageVersion] = useState(0);

  // Tandai halaman aktif sebagai sudah dibuka agar notifikasi hilang
  useEffect(() => {
    if (activeItemHref) {
      setVisitedPages((prev) => {
        if (prev.has(activeItemHref)) return prev;
        const next = new Set(prev);
        next.add(activeItemHref);
        return next;
      });
    }
  }, [activeItemHref]);

  // Listener perubahan storage antar tab atau aksi dalam aplikasi
  useEffect(() => {
    const handleStorageChange = () => setStorageVersion((v) => v + 1);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('simpro_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('simpro_storage_change', handleStorageChange);
    };
  }, []);

  // Menghitung jumlah tugas pending dinamis (hilang otomatis saat halaman dibuka)
  const getItemBadge = (item: NavItem): number => {
    // Jika halaman sedang dibuka pengguna atau sudah dikunjungi di sesi ini, sembunyikan notifikasi badge
    if (item.href === activeItemHref || visitedPages.has(item.href)) return 0;

    if (item.href === '/dashboard/perjalanan-dinas/persetujuan') {
      const trips = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
      return trips.filter((t) => t.status === 'DIAJUKAN').length;
    }
    if (item.href === '/dashboard/kelola/aduan') {
      const complaints = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
      return complaints.filter((c) => !c.is_sensitif && c.status === 'DITERIMA').length;
    }
    if (item.href === '/dashboard/kelola/aduan/sensitif') {
      const complaints = storageSync.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, mockComplaints);
      return complaints.filter((c) => c.is_sensitif && (c.status === 'DITERIMA' || c.status === 'DIVERIFIKASI')).length;
    }
    if (item.href === '/dashboard/rps/review-saya') {
      const rps = storageSync.get<RpsSubmission[]>(STORAGE_KEYS.RPS_SUBMISSIONS, mockRpsSubmissions);
      return rps.filter((r) => r.status === 'DIAJUKAN' || r.status === 'DIREVIEW').length;
    }
    if (item.href === '/dashboard/publikasi/verifikasi') {
      const pubs = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
      return pubs.filter((p) => p.status_verifikasi === 'MENUNGGU').length;
    }

    return item.badge || 0;
  };

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

  const isFirstRender = useRef(true);

  // Synchronized Anime.js transition for core navigation features & text containers
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (sidebarOpen) {
      remove('.simpro-nav-text-container');
      remove('.simpro-nav-badge');
      remove('.simpro-nav-public-block');

      animate('.simpro-nav-text-container', {
        maxWidth: [0, 180],
        opacity: [0, 1],
        translateX: [-6, 0],
        duration: 380,
        delay: 80,
        ease: 'outCubic',
      });

      animate('.simpro-nav-badge', {
        opacity: [0, 1],
        scale: [0.7, 1],
        duration: 250,
        delay: 180,
        ease: 'outBack(1.2)',
      });

      animate('.simpro-nav-public-block', {
        maxHeight: [0, 140],
        opacity: [0, 1],
        duration: 350,
        delay: 100,
        ease: 'outCubic',
      });
    } else {
      remove('.simpro-nav-text-container');
      remove('.simpro-nav-badge');
      remove('.simpro-nav-public-block');

      animate('.simpro-nav-text-container', {
        maxWidth: [180, 0],
        opacity: [1, 0],
        translateX: [0, -6],
        duration: 200,
        ease: 'outQuad',
      });

      animate('.simpro-nav-badge', {
        opacity: [1, 0],
        scale: [1, 0.7],
        duration: 150,
        ease: 'outQuad',
      });

      animate('.simpro-nav-public-block', {
        maxHeight: [140, 0],
        opacity: [1, 0],
        duration: 200,
        ease: 'outQuad',
      });
    }
  }, [sidebarOpen]);

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
          transition-[width,transform] duration-500 ease-out
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
                      group flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold
                      transition-colors duration-150 mb-1 overflow-hidden
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                      }
                    `}
                    title={!sidebarOpen ? mainItem.title : undefined}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <MainIcon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                        }`}
                      />
                    </div>
                    <div
                      className="simpro-nav-text-container flex-1 min-w-0 flex items-center justify-between ml-2.5 overflow-hidden whitespace-nowrap"
                      style={{
                        maxWidth: sidebarOpen ? '180px' : '0px',
                        opacity: sidebarOpen ? 1 : 0,
                      }}
                    >
                      <span className="truncate">{mainItem.title}</span>
                    </div>
                  </Link>
                );
              }

              // 2. Dropdown Category Accordion
              const CategoryIcon = categoryIconMap[cat] || Layers;
              const isCatOpen = !!openCategories[cat];
              const isChildActive = catItems.some((item) => item.href === activeItemHref);
              const totalCategoryBadge = catItems.reduce((sum, item) => sum + getItemBadge(item), 0);

              return (
                <div key={cat} className="space-y-0.5 mb-1">
                  {/* Category Header Button: Entire row toggles dropdown, does NOT navigate */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`
                      w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold
                      transition-colors duration-150 text-left cursor-pointer overflow-hidden
                      ${isChildActive
                        ? 'text-blue-700 bg-blue-50/70 font-bold'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                      }
                    `}
                    title={!sidebarOpen ? cat : undefined}
                    aria-expanded={isCatOpen}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon
                        className={`w-4 h-4 transition-colors ${
                          isChildActive ? 'text-blue-600' : 'text-slate-500'
                        }`}
                      />
                    </div>

                    <div
                      className="simpro-nav-text-container flex-1 min-w-0 flex items-center justify-between ml-2.5 overflow-hidden whitespace-nowrap"
                      style={{
                        maxWidth: sidebarOpen ? '180px' : '0px',
                        opacity: sidebarOpen ? 1 : 0,
                      }}
                    >
                      <span className="truncate">{cat}</span>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {!isCatOpen && totalCategoryBadge > 0 && (
                          <span className="simpro-nav-badge bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                    </div>
                  </button>

                  {/* Dropdown Items: Direct vertical list matching Image 2 composition without truncation */}
                  <AnimatedCollapse open={sidebarOpen && isCatOpen} duration={220}>
                    <div className="mt-0.5 mb-1 space-y-0.5 pl-2 pr-0.5 py-0.5">
                      {catItems.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isExactActive = item.href === activeItemHref;
                        const itemBadge = getItemBadge(item);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`
                              anime-collapse-item group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium
                              transition-colors duration-150 cursor-pointer overflow-hidden
                              ${isExactActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/70'
                              }
                            `}
                            title={item.title}
                          >
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                              <Icon
                                className={`w-4 h-4 transition-colors ${
                                  isExactActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0 ml-2.5 flex items-center justify-between overflow-hidden whitespace-nowrap">
                              <span className="leading-snug text-left truncate flex-1">
                                {item.title}
                              </span>
                              {itemBadge > 0 && (
                                <span
                                  className={`ml-1.5 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isExactActive ? 'bg-white text-blue-600' : 'bg-red-600 text-white'
                                  }`}
                                >
                                  {itemBadge}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </AnimatedCollapse>
                </div>
              );
            })}

            {/* Public Links Shortcut */}
            <div
              className="simpro-nav-public-block overflow-hidden transition-none border-t border-slate-100"
              style={{
                maxHeight: sidebarOpen ? '140px' : '0px',
                opacity: sidebarOpen ? 1 : 0,
                borderTopWidth: sidebarOpen ? '1px' : '0px',
              }}
            >
              <div className="pt-2 space-y-1">
                <p className="px-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 whitespace-nowrap overflow-hidden">
                  Akses Publik (Non-Login)
                </p>
                <Link
                  href="/mitra/isi/tok-telkom-2025"
                  className="flex items-center px-3.5 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors overflow-hidden whitespace-nowrap"
                  target="_blank"
                  title={!sidebarOpen ? 'Kuesioner Mitra (Demo)' : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="ml-2.5 truncate">Kuesioner Mitra (Demo)</span>
                </Link>
                <Link
                  href="/aduan/lacak"
                  className="flex items-center px-3.5 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors overflow-hidden whitespace-nowrap"
                  target="_blank"
                  title={!sidebarOpen ? 'Lacak Tiket Aduan' : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="ml-2.5 truncate">Lacak Tiket Aduan</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors w-full font-semibold text-sm overflow-hidden"
              title={!sidebarOpen ? 'Keluar Sistem' : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 flex-shrink-0" />
              </div>
              <div
                className="simpro-nav-text-container flex-1 min-w-0 ml-2.5 overflow-hidden whitespace-nowrap"
                style={{
                  maxWidth: sidebarOpen ? '180px' : '0px',
                  opacity: sidebarOpen ? 1 : 0,
                }}
              >
                <span className="truncate">Keluar Sistem</span>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

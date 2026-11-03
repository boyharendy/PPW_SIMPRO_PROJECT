'use client';

import { useApp } from '@/lib/context';
import { Bell, Menu, ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Role } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export const ROLE_LABELS: Record<Role, string> = {
  // 10 Peran Tetap (PRD Bab 8.1)
  KAPRODI: 'Kaprodi',
  GKM: 'GKM (Gugus Kendali Mutu)',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  DOSEN_WALI: 'Dosen Wali',
  DOSEN_PEMBINA: 'Dosen Pembina UKM / Himpunan',
  DOSEN_VERIFIKATOR: 'Dosen Verifikator',

  KETUA_KELAS: 'Ketua Kelas',
  PENGURUS_HIMPUNAN: 'Pengurus Himpunan',
  KOORDINATOR_KP: 'Koordinator KP',
  KOORDINATOR_PSI: 'Koordinator PSI',
  KOORDINATOR_PDLK: 'Koordinator PDLK',
  PENGELOLA_ADUAN: 'Pengelola Aduan',
  PETUGAS_KEKERASAN: 'Petugas Kekerasan (Satgas)',
  MAHASISWA: 'Mahasiswa',


  KOORD_KP: 'Koordinator KP',
  KOORD_TA: 'Koordinator TA',
  KOORD_MAGANG: 'Koordinator Magang',
  HIMPUNAN: 'Himpunan Mahasiswa',
=======
  // Peran Kompatibilitas Data Induk (PRD Bab 6.A poin 2)
  PENGURUS_HIMPUNAN: 'Pengurus Himpunan',
  DOSEN_WALI: 'Dosen Wali',
  DOSEN_PEMBINA: 'Dosen Pembina',
  KETUA_KELAS: 'Ketua Kelas',

};

export default function Header() {
  const { user, setActiveRole, notifications, unreadCount, markAsRead, setSidebarOpen } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (rolesRef.current && !rolesRef.current.contains(e.target as Node)) setShowRoles(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="sticky top-0 z-30 bg-blue-600">
      <header className="relative h-16 bg-white/95 backdrop-blur-xl rounded-tl-[2rem] border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.08)] text-slate-800">
        {/* Decorative Faded Glass & Glow Accent on the Left Curve */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-72 rounded-tl-[2rem] bg-gradient-to-r from-blue-500/15 via-blue-400/5 to-transparent overflow-hidden"
        >
          {/* Soft ambient glass orb */}
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-blue-500/20 blur-2xl" />
          {/* Specular glass rim highlight along top-left curve */}
          <div className="absolute inset-0 rounded-tl-[2rem] border-t border-l border-white/90 shadow-[inset_1px_1px_12px_rgba(37,99,235,0.12)]" />
        </div>

        {/* Left side: Mobile menu toggle and breadcrumb */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/80 text-slate-800 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden sm:flex items-center gap-2.5 text-sm font-medium pl-1">
            <span className="font-bold text-slate-800 text-base sm:text-lg tracking-tight">SIMPRO</span>
            <span className="text-slate-300 font-light text-base">/</span>
            <span className="text-slate-500 text-sm">Sistem Informasi Manajemen Program Studi</span>
          </div>
        </div>

        {/* Right side: Academic Period, Role Switcher, Notifications, User Profile */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-4 lg:gap-5">
          {/* Academic Period Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Semester Ganjil 2024/2025</span>
          </div>

          {/* Role Switcher */}
          <div className="relative" ref={rolesRef}>
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs sm:text-sm text-slate-800 transition-colors border border-slate-200 font-semibold shadow-xs"
              title="Ganti Peran Aktif"
            >
              <span className="text-slate-500 font-normal">Peran:</span>
              <span className="hidden sm:inline max-w-[150px] truncate">{ROLE_LABELS[user.activeRole] || user.activeRole}</span>
              <span className="sm:hidden text-xs">{user.activeRole}</span>
              <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />
            </button>
            {showRoles && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-800">
                <p className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Ganti Peran Pengguna
                </p>
                <div className="max-h-72 overflow-y-auto">
                  {Array.from(new Set(user.roles)).map(role => (
                    <button
                      key={role}
                      onClick={() => { setActiveRole(role); setShowRoles(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                        user.activeRole === role
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{ROLE_LABELS[role] || role}</span>
                      {user.activeRole === role && (
                        <span className="text-xs text-blue-600 font-bold ml-2">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors"
              aria-label="Lihat Notifikasi"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 text-slate-800">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Notifikasi</h3>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {unreadCount} baru
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-slate-500">Tidak ada notifikasi baru</p>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          n.is_dibaca ? 'opacity-60 bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {!n.is_dibaca && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">{n.judul}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.isi}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Group */}
          <div className="flex items-center gap-3 pl-3 sm:pl-5 sm:border-l sm:border-slate-200">
            <div className="hidden md:flex flex-col items-end justify-center">
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                {user.nama_lengkap.split(',')[0]}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {ROLE_LABELS[user.activeRole] || user.activeRole}
              </span>
            </div>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
              <span>{user.nama_lengkap.charAt(0)}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

'use client';

import { useApp } from '@/lib/context';
import { Bell, Menu, ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Role } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const ROLE_LABELS: Record<Role, string> = {
  KAPRODI: 'Kaprodi',
  GKM: 'GKM (Gugus Kendali Mutu)',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  KOORDINATOR_KP: 'Koordinator KP',
  KOORDINATOR_PSI: 'Koordinator PSI',
  KOORDINATOR_PDLK: 'Koordinator PDLK',
  PENGELOLA_ADUAN: 'Pengelola Aduan',
  PETUGAS_KEKERASAN: 'Petugas Khusus Kekerasan (Satgas)',
  MAHASISWA: 'Mahasiswa',
  DOSEN_VERIFIKATOR: 'Dosen Verifikator',
  KOORD_KP: 'Koordinator KP',
  KOORD_TA: 'Koordinator TA',
  KOORD_MAGANG: 'Koordinator Magang',
  HIMPUNAN: 'Himpunan Mahasiswa',
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
    <header className="h-20 bg-blue-600 border-b border-blue-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-sm text-white">
      {/* Left side: Mobile menu toggle and breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-sm font-medium">
          <span className="font-bold text-white text-base sm:text-lg tracking-tight">SIMPRO</span>
          <span className="text-blue-300/80 font-light text-base">/</span>
          <span className="text-blue-100 text-sm">Sistem Informasi Manajemen Program Studi</span>
        </div>
      </div>

      {/* Right side: Academic Period, Role Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
        {/* Academic Period Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-blue-700/60 border border-blue-500/60 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Semester Ganjil 2024/2025</span>
        </div>

        {/* Role Switcher */}
        <div className="relative" ref={rolesRef}>
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm text-white transition-colors border border-white/20 font-semibold shadow-xs"
            title="Ganti Peran Aktif"
          >
            <span className="text-blue-200 font-normal">Peran:</span>
            <span className="hidden sm:inline max-w-[150px] truncate">{ROLE_LABELS[user.activeRole] || user.activeRole}</span>
            <span className="sm:hidden text-xs">{user.activeRole}</span>
            <ChevronDown size={15} className="text-blue-200 flex-shrink-0" />
          </button>
          {showRoles && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-800">
              <p className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Ganti Peran Pengguna
              </p>
              <div className="max-h-72 overflow-y-auto">
                {user.roles.map(role => (
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
            className="relative p-2.5 rounded-xl hover:bg-white/10 text-white transition-colors"
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
        <div className="flex items-center gap-3 pl-3 sm:pl-5 sm:border-l sm:border-blue-500/50">
          <div className="hidden md:flex flex-col items-end justify-center">
            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
              {user.nama_lengkap.split(',')[0]}
            </span>
            <span className="text-[11px] text-blue-100 font-medium leading-tight mt-0.5">
              {ROLE_LABELS[user.activeRole] || user.activeRole}
            </span>
          </div>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-white text-blue-700 border-2 border-blue-200 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
            <span>{user.nama_lengkap.charAt(0)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useApp } from '@/lib/context';
import { Bell, Menu, ChevronDown, Search } from 'lucide-react';
import { useState, useRef } from 'react';
import { CANONICAL_ROLES, type Role } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import AnimatedDropdown from '@/components/ui/AnimatedDropdown';

export { CANONICAL_ROLES };

export const ROLE_LABELS: Record<Role, string> = {
  KAPRODI: 'Kaprodi',
  GKM: 'GKM',
  ADMIN_PRODI: 'Admin Prodi',
  DOSEN: 'Dosen',
  DOSEN_VERIFIKATOR: 'Dosen Verifikator',
  DOSEN_WALI: 'Dosen Wali',
  DOSEN_PEMBINA: 'Dosen Pembina Himpunan / UKM',
  KETUA_KELAS: 'Ketua Kelas',
  MAHASISWA: 'Mahasiswa',
  PENGURUS_HIMPUNAN: 'Pengurus Himpunan',
  KOORDINATOR_KP_PSI_PDLK: 'Koordinator KP / PSI / PDLK',
  PENGELOLA_ADUAN: 'Pengelola Aduan',
  MITRA: 'Mitra (eksternal)',
  KOORDINATOR_KP: 'Koordinator KP',
  KOORDINATOR_PSI: 'Koordinator PSI',
  KOORDINATOR_PDLK: 'Koordinator PDLK',
  PETUGAS_KEKERASAN: 'Petugas Kekerasan (Satgas)',
  KOORD_KP: 'Koordinator KP',
  KOORD_TA: 'Koordinator TA',
  KOORD_MAGANG: 'Koordinator Magang',
  HIMPUNAN: 'Himpunan Mahasiswa',
  MITRA_EKSTERNAL: 'Mitra (eksternal)',
};

export default function Header() {
  const { user, setActiveRole, notifications, unreadCount, markAsRead, setMobileSidebarOpen } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const rolesBtnRef = useRef<HTMLButtonElement>(null);

  const availableRoles = (user?.roles && user.roles.length > 0)
    ? CANONICAL_ROLES.filter((r) => user.roles.includes(r))
    : [user.activeRole];

  return (
    <div className="sticky top-0 z-30 bg-white lg:bg-blue-600">
      <header className="relative h-16 bg-white/95 backdrop-blur-xl lg:rounded-tl-[2rem] border-b border-slate-200 flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.08)] text-slate-800">
        {/* Decorative Faded Glass & Glow Accent on the Left Curve */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-44 sm:w-72 lg:rounded-tl-[2rem] bg-gradient-to-r from-blue-500/15 via-blue-400/5 to-transparent overflow-hidden"
        >
          {/* Soft ambient glass orb */}
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-blue-500/20 blur-2xl" />
          {/* Specular glass rim highlight along top-left curve */}
          <div className="absolute inset-0 lg:rounded-tl-[2rem] border-t border-l border-white/90 shadow-[inset_1px_1px_12px_rgba(37,99,235,0.12)]" />
        </div>

        {/* Left side: Mobile menu toggle and breadcrumb */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 -ml-1.5 rounded-xl hover:bg-white/80 text-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 text-sm font-medium pl-0.5 sm:pl-1 min-w-0">
            <span className="font-bold text-slate-800 text-base sm:text-xl tracking-tight shrink-0">SIMPRO</span>
            <span className="hidden lg:inline text-slate-300 font-light text-base shrink-0">/</span>
            <span className="hidden lg:inline text-slate-500 text-sm sm:text-base truncate">Sistem Informasi Manajemen Program Studi</span>
          </div>
        </div>

        {/* Right side: Academic Period, Role Switcher, Notifications, User Profile */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-3 lg:gap-5 shrink-0">
          {/* Academic Period Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 lg:px-3.5 py-1.5 text-xs lg:text-sm font-semibold text-slate-800 shadow-xs shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Semester Ganjil 2024/2025</span>
          </div>

          {/* Role Switcher (Desktop >= 1024px; mobile/tablet menggunakan pemilih peran di Sidebar drawer) */}
          <div className="hidden lg:block relative">
            <button
              type="button"
              ref={rolesBtnRef}
              onClick={() => setShowRoles((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-sm sm:text-base text-slate-800 transition-colors border border-slate-200 font-semibold shadow-xs cursor-pointer"
              title="Ganti Peran Aktif"
              aria-haspopup="true"
              aria-expanded={showRoles}
            >
              <span className="text-slate-500 font-normal">Peran:</span>
              <span className="max-w-[150px] truncate">
                {ROLE_LABELS[user.activeRole] || user.activeRole}
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-500 flex-shrink-0 transition-transform duration-250 ease-out ${
                  showRoles ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>
            <AnimatedDropdown
              open={showRoles}
              onClose={() => setShowRoles(false)}
              triggerRef={rolesBtnRef}
              className="w-64 py-2"
            >
              <p className="px-4 py-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                Ganti Peran Pengguna
              </p>
              <div className="max-h-72 overflow-y-auto">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setActiveRole(role);
                      setShowRoles(false);
                    }}
                    className={`anime-dropdown-item w-full text-left px-4 py-2.5 text-sm sm:text-base transition-colors flex items-center justify-between ${
                      user.activeRole === role
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{ROLE_LABELS[role] || role}</span>
                    {user.activeRole === role && (
                      <span className="text-sm text-blue-600 font-bold ml-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </AnimatedDropdown>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              ref={notifBtnRef}
              onClick={() => setShowNotif((prev) => !prev)}
              className="relative p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
              aria-label="Lihat Notifikasi"
              aria-haspopup="true"
              aria-expanded={showNotif}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4.5 h-4.5 bg-rose-500 border border-white rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatedDropdown
              open={showNotif}
              onClose={() => setShowNotif(false)}
              triggerRef={notifBtnRef}
              className="w-[min(19.5rem,calc(100vw-4.25rem))] sm:w-96 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Notifikasi</h3>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {unreadCount} baru
                  </span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada notifikasi baru</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className={`anime-dropdown-item w-full text-left px-4 py-3 transition-colors ${
                        n.is_dibaca ? 'opacity-60 bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.is_dibaca && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{n.judul}</p>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.isi}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </AnimatedDropdown>
          </div>

          {/* Profile Group */}
          <div className="flex items-center gap-3 pl-0.5 sm:pl-3 lg:pl-5 sm:border-l sm:border-slate-200">
            <div className="hidden lg:flex flex-col items-end justify-center">
              <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                {user.nama_lengkap.split(',')[0]}
              </span>
              <span className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                {ROLE_LABELS[user.activeRole] || user.activeRole}
              </span>
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 shadow-xs">
              <span>{user.nama_lengkap.charAt(0)}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

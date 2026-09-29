'use client';

import { useApp } from '@/lib/context';
import { Bell, Menu, ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Role } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const ROLE_LABELS: Record<Role, string> = {
  KAPRODI: 'Kaprodi',
  GKM: 'GKM',
  KOORD_KP: 'Koordinator KP',
  KOORD_TA: 'Koordinator TA',
  KOORD_MAGANG: 'Koordinator Magang',
  HIMPUNAN: 'Himpunan',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl w-64 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400" />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* Role Switcher */}
        <div className="relative" ref={rolesRef}>
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors border border-slate-200 font-medium"
          >
            <span className="hidden sm:inline">{ROLE_LABELS[user.activeRole]}</span>
            <span className="sm:hidden text-xs">{user.activeRole}</span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>
          {showRoles && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <p className="px-4 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider">Ganti Peran Aktif</p>
              {user.roles.map(role => (
                <button
                  key={role}
                  onClick={() => { setActiveRole(role); setShowRoles(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    user.activeRole === role
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {ROLE_LABELS[role]}
                  {user.activeRole === role && (
                    <span className="ml-2 text-xs text-indigo-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-800 text-sm">Notifikasi</h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{unreadCount} baru</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada notifikasi</p>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                        n.is_dibaca ? 'opacity-60 bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.is_dibaca && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{n.judul}</p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.isi}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{formatDateTime(n.created_at)}</p>
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
        <div className="flex items-center gap-4 pl-4 sm:pl-6 sm:border-l sm:border-slate-200">
          <div className="hidden md:flex flex-col items-end justify-center">
            <span className="text-sm font-bold text-slate-800">{user.nama_lengkap.split(',')[0]}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5">NIP: 198001012005011002</span>
          </div>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center cursor-pointer text-blue-600 flex-shrink-0">
            <span className="font-bold text-sm">{user.nama_lengkap.charAt(0)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

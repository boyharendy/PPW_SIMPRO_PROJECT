'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS } from '@/lib/navigation';
import {
  LayoutDashboard, UserPlus, FileCheck, Briefcase, Trophy, Wallet,
  SmilePlus, Search, FileText, Package, Building, GraduationCap,
  Laptop, Users, BookOpen, Handshake, Settings, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, UserPlus, FileCheck, Briefcase, Trophy, Wallet,
  SmilePlus, Search, FileText, Package, Building, GraduationCap,
  Laptop, Users, BookOpen, Handshake, Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useApp();

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.some(r => user.roles.includes(r))
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          border-r border-white/5
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'w-72' : 'w-20'}
          lg:relative
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base tracking-tight">SIMPRO</span>
                <span className="text-[10px] text-slate-500 truncate">Manajemen Program Studi</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
          {visibleItems.map(item => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white shadow-sm border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
                title={!sidebarOpen ? item.title : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
                {sidebarOpen && item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user.nama_lengkap.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.nama_lengkap}</p>
                <p className="text-xs text-slate-500 truncate">{user.activeRole}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

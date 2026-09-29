'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NAV_ITEMS } from '@/lib/navigation';
import Image from 'next/image';
import LogoImage from '@/components/Logo/Logos.png';
import {
  LayoutDashboard, UserPlus, FileCheck, Briefcase, Trophy, Wallet,
  SmilePlus, Search, FileText, Package, Building, GraduationCap,
  Laptop, Users, BookOpen, Handshake, Settings, ChevronLeft, ChevronRight, X, LogOut
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
          bg-blue-600
          transition-all duration-300 ease-in-out
          flex flex-col shadow-xl
          ${sidebarOpen ? 'w-64' : 'w-20'}
          lg:relative
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Blue Header Section */}
        <div className="flex flex-col items-center justify-center pt-6 pb-6 px-4 relative flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex absolute top-4 -right-3 items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 transition-colors z-10"
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {sidebarOpen ? (
            <div className="flex flex-col items-center w-full relative">
              <div className="w-32 h-32 -mb-2 relative z-10">
                <Image src={LogoImage} alt="SIMPRO Logo" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
              <h2 className="font-bold text-white text-2xl tracking-tight leading-tight relative z-20 drop-shadow-md">SIMPRO</h2>
              <p className="text-[11px] text-blue-100 text-center mt-1 font-medium px-2 leading-snug relative z-20">
                Sistem Informasi<br/>Manajemen Program Studi
              </p>
            </div>
          ) : (
            <div className="w-14 h-14 relative z-10 mt-1">
              <Image src={LogoImage} alt="SIMPRO Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          )}
        </div>

        {/* White Navigation Container */}
        <div className="flex-1 bg-white rounded-tr-[2rem] flex flex-col pt-6 overflow-hidden relative shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)]">
          <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
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
                    group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                    }
                  `}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'
                    }`}
                  />
                  {sidebarOpen && <span className="truncate">{item.title}</span>}
                  {sidebarOpen && item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 mt-2 mb-2 bg-white">
            <button className="flex items-center gap-4 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors w-full font-bold text-sm">
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

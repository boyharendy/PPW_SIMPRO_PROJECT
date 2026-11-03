'use client';

import React from 'react';
import Image from 'next/image';
import LogoImage from '@/components/Logo/Logos.png';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PublicShellProps {
  children: React.ReactNode;
  title?: string;
  badgeText?: string;
  showBackToPortal?: boolean;
}

export default function PublicShell({
  children,
  title,
  badgeText = 'Portal Publik Akademik',
  showBackToPortal = true,
}: PublicShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Banner Header */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src={LogoImage}
              alt="SIMPRO Logo"
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-lg tracking-tight">SIMPRO</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hidden sm:inline">
                {badgeText}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Sistem Informasi Manajemen Program Studi
            </p>
          </div>
        </div>

        {showBackToPortal && (
          <Link
            href="/dashboard"
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            <span>Ke Dashboard</span>
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {title && (
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        © 2025–2026 SIMPRO — Program Studi Sarjana Sistem Informasi. Akses Terbuka Aman.
      </footer>
    </div>
  );
}


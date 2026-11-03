'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

export interface ExportMenuProps {
  onExport?: (format: 'xlsx' | 'pdf') => void;
  title?: string;
  filename?: string;
  className?: string;
}

export function ExportMenu({ onExport, title = 'Ekspor Laporan', filename, className = '' }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<'xlsx' | 'pdf' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'xlsx' | 'pdf') => {
    setDownloading(format);
    onExport?.(format);
    setTimeout(() => {
      setDownloading(null);
      setOpen(false);
    }, 1200);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-2"
      >
        <Download size={14} className="text-slate-500" />
        <span className="font-semibold">{title}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-md py-1.5 z-40">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={16} className="text-emerald-700" />
              <span>Format Excel (.xlsx)</span>
            </div>
            {downloading === 'xlsx' && <Check size={14} className="text-emerald-700" />}
          </button>

          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-rose-700" />
              <span>Format PDF (.pdf)</span>
            </div>
            {downloading === 'pdf' && <Check size={14} className="text-rose-700" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;

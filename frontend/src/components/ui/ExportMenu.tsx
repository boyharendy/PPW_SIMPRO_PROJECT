'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

export interface ExportMenuProps {
  onExport?: (format: 'xlsx' | 'pdf') => void;
  title?: string;
  filename?: string;
  className?: string;
}

export function ExportMenu({ onExport, title = 'Ekspor Laporan', filename = 'rekap-laporan-simpro', className = '' }: ExportMenuProps) {
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

  const triggerTableCsvDownload = (baseFilename: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const rows: string[][] = [];
    const pageTitle = document.querySelector('h1')?.textContent?.trim() || 'Laporan Rekapitulasi SIMPRO';
    rows.push([pageTitle]);
    rows.push([`Diekspor pada: ${new Date().toLocaleString('id-ID')}`]);
    rows.push([]);

    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      tables.forEach((table) => {
        const trs = table.querySelectorAll('tr');
        trs.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) => {
            const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
            return `"${text.replace(/"/g, '""')}"`;
          });
          if (cells.length > 0) {
            rows.push(cells);
          }
        });
        rows.push([]);
      });
    } else {
      // Fallback: collect stat cards / summary items on the page
      const cards = document.querySelectorAll('.card');
      cards.forEach((card) => {
        const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
        if (text) {
          rows.push([`"${text.replace(/"/g, '""')}"`]);
        }
      });
    }

    const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${baseFilename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'xlsx' | 'pdf') => {
    setDownloading(format);
    if (onExport) {
      onExport(format);
    } else if (format === 'xlsx') {
      triggerTableCsvDownload(filename);
    } else if (format === 'pdf') {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
    setTimeout(() => {
      setDownloading(null);
      setOpen(false);
    }, 900);
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
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-md py-1.5 z-40">
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet size={16} className="text-emerald-700" />
              <span>Format Spreadsheet (.csv/.xlsx)</span>
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
              <span>Format Dokumen (.pdf)</span>
            </div>
            {downloading === 'pdf' && <Check size={14} className="text-rose-700" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;

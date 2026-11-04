'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Koordinat atribut SVG untuk state EXPANDED (w-64 / 256px) dan COLLAPSED (w-20 / 80px).
 * Setiap pasangan expanded & collapsed memiliki jumlah titik (<polygon points>)
 * dan urutan instruksi (<path d>) yang identik agar interpolasi morphing presisi.
 */
export const SIMPRO_SVG_SHAPES = {
  // 1. Area Latar Belakang Biru pada Header Sidebar (<path>) — menyatu mulus dengan bg-blue-600 (#2563EB)
  bgBox: {
    expanded:
      'M 0 0 L 256 0 Q 256 0 256 0 L 256 184 Q 256 184 256 184 L 0 184 Q 0 184 0 184 L 0 0 Q 0 0 0 0 Z',
    collapsed:
      'M 0 0 L 80 0 Q 80 0 80 0 L 80 80 Q 80 80 80 80 L 0 80 Q 0 80 0 80 L 0 0 Q 0 0 0 0 Z',
  },

  // 2. Sayap Kiri Atap Topi Toga (<polygon points>)
  togaLeftWing: {
    expanded: '128,14 135,18 130,23 128,22 88,45 128,65 128,75 73,45',
    collapsed: '40,16 43,18 41,20 40,20 22,30 40,39 40,44 16,30',
  },

  // 3. Sayap Kanan Atap Topi Toga (<polygon points>)
  togaRightWing: {
    expanded: '128,65 168,45 158,39 165,35 183,45 128,75',
    collapsed: '40,39 58,30 53,27 56,25 64,30 40,44',
  },

  // 4. Tali / Kuncir Topi Toga di Sisi Kiri (<polygon points>)
  togaTassel: {
    expanded: '81,49 85,51 85,71 88,75 86,87 80,87 78,75 81,71',
    collapsed: '19,32 21,33 21,42 23,44 22,49 18,49 17,44 19,42',
  },

  // 5. Lembaran Buku Terbuka di Dalam Topi Toga (<path d>)
  bookPages: {
    expanded:
      'M 98 43 Q 115 45 126 59 Q 113 50 98 48 Z M 103 37 Q 117 40 126 55 Q 115 44 103 42 Z M 109 31 Q 120 35 126 50 Q 117 39 109 36 Z',
    collapsed:
      'M 26 29 Q 34 30 39 36 Q 33 32 26 31 Z M 29 26 Q 35 28 39 34 Q 34 30 29 29 Z M 31 24 Q 36 25 39 32 Q 35 27 31 26 Z',
  },

  // 6. Awan Digital di Kanan Atas Topi Toga (<path d>)
  cloudOutline: {
    expanded:
      'M 126 40 C 119 40 117 31 124 28 C 126 18 141 18 145 27 C 154 26 157 38 148 40 L 142 40',
    collapsed:
      'M 39 28 C 36 28 35 24 38 22 C 39 18 46 18 48 22 C 52 21 53 27 49 28 L 46 28',
  },

  // 7. Jalur Sirkuit di Dalam Awan (<path d>)
  circuitLines: {
    expanded:
      'M 131 32 L 135 35 L 135 44 L 129 52 M 138 27 L 138 46 L 129 56 M 146 32 L 141 36 L 141 48 L 129 60',
    collapsed:
      'M 41 24 L 43 26 L 43 30 L 40 33 M 45 22 L 45 31 L 40 35 M 48 24 L 46 26 L 46 31 L 40 37',
  },

  // 8. Perisai Huruf "S" di Bagian Bawah Kiri (<path d>)
  shieldS: {
    expanded:
      'M 90 57 L 128 78 L 128 68 L 100 52 L 100 63 L 134 83 C 143 88 143 105 128 113 L 105 100 C 94 93 90 84 90 71 L 100 76 C 100 84 103 89 109 93 L 128 104 C 132 101 132 92 128 89 L 90 68 Z',
    collapsed:
      'M 23 35 L 40 45 L 40 40 L 27 33 L 27 38 L 43 47 C 47 49 47 57 40 61 L 30 55 C 25 52 23 48 23 42 L 27 44 C 27 48 29 50 32 52 L 40 57 C 42 55 42 51 40 50 L 23 40 Z',
  },

  // 9. Perisai Huruf "i" di Bagian Bawah Kanan (<path d>)
  shieldI: {
    expanded:
      'M 142 67 L 152 62 L 152 70 L 142 75 Z M 142 79 L 152 74 L 152 95 L 157 91 C 161 87 163 81 163 71 L 163 55 L 172 50 L 172 73 C 172 86 165 96 155 103 L 142 111 Z',
    collapsed:
      'M 46 40 L 51 38 L 51 41 L 46 44 Z M 46 45 L 51 43 L 51 53 L 53 51 C 55 49 56 46 56 42 L 56 35 L 60 32 L 60 43 C 60 49 57 53 52 56 L 46 60 Z',
  },

  // 10. Ikon Segitiga Kecil pada Tombol Toggle (<polygon points>)
  toggleTriangle: {
    expanded: '7,2 2,5 7,8',
    collapsed: '3,2 8,5 3,8',
  },
};

interface AnimatedSimproLogoProps {
  /** Opsional: sinkronisasi state dengan parent Sidebar */
  collapsed?: boolean;
  /** Opsional: callback saat tombol segitiga diklik */
  onToggleCollapse?: (nextCollapsed: boolean) => void;
  /** Opsional: tombol tutup sidebar pada tampilan mobile */
  onMobileClose?: () => void;
}

export default function AnimatedSimproLogo({
  collapsed,
  onToggleCollapse,
  onMobileClose,
}: AnimatedSimproLogoProps) {
  // Support controlled (dari Sidebar parent) maupun uncontrolled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = typeof collapsed === 'boolean' ? collapsed : internalCollapsed;

  const handleToggleClick = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    onToggleCollapse?.(nextState);
  };

  return (
    <div
      className={`relative w-full flex-shrink-0 select-none transition-[height] duration-500 ease-out ${
        isCollapsed ? 'h-20' : 'h-48'
      }`}
    >
      {/* Tombol Tutup khusus Mobile */}
      {onMobileClose && (
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Tutup Menu"
          className="lg:hidden absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white transition-colors"
        >
          <X size={18} />
        </button>
      )}

      {/* Tombol Toggle Segitiga Kecil (Desktop) */}
      <button
        type="button"
        onClick={handleToggleClick}
        aria-label={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
        title={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
        className="hidden lg:flex absolute top-4 -right-3 z-20 items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current">
          <polygon
            className="simpro-toggle-triangle transition-all duration-300 ease-out"
            points={
              isCollapsed
                ? SIMPRO_SVG_SHAPES.toggleTriangle.collapsed
                : SIMPRO_SVG_SHAPES.toggleTriangle.expanded
            }
          />
        </svg>
      </button>

      {/* Kanvas SVG Utama untuk Morphing Logo Topi Toga SIMPRO & Area Latar Biru */}
      <div className="w-full h-full overflow-hidden">
        <svg
          width="256"
          height="192"
          viewBox="0 0 256 192"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block"
        >
          <defs>
            <filter id="simproDropShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* 1. Latar Belakang Biru Menyatu Mulus (#2563EB / bg-blue-600) */}
          <path
            className="simpro-bg-box transition-all duration-500 ease-out"
            d={isCollapsed ? SIMPRO_SVG_SHAPES.bgBox.collapsed : SIMPRO_SVG_SHAPES.bgBox.expanded}
            fill="#2563EB"
          />

          {/* Grup Ikon Topi Toga SIMPRO */}
          <g filter="url(#simproDropShadow)" className="transition-all duration-500 ease-out">
            {/* 2. Sayap Kiri Atap Topi Toga (<polygon>) */}
            <polygon
              className="simpro-toga-left transition-all duration-500 ease-out"
              points={
                isCollapsed
                  ? SIMPRO_SVG_SHAPES.togaLeftWing.collapsed
                  : SIMPRO_SVG_SHAPES.togaLeftWing.expanded
              }
              fill="#7CC4FA"
            />

            {/* 3. Sayap Kanan Atap Topi Toga (<polygon>) */}
            <polygon
              className="simpro-toga-right transition-all duration-500 ease-out"
              points={
                isCollapsed
                  ? SIMPRO_SVG_SHAPES.togaRightWing.collapsed
                  : SIMPRO_SVG_SHAPES.togaRightWing.expanded
              }
              fill="#3898EC"
            />

            {/* 4. Tali / Kuncir Toga (<polygon>) */}
            <polygon
              className="simpro-toga-tassel transition-all duration-500 ease-out"
              points={
                isCollapsed
                  ? SIMPRO_SVG_SHAPES.togaTassel.collapsed
                  : SIMPRO_SVG_SHAPES.togaTassel.expanded
              }
              fill="#7CC4FA"
            />

            {/* 5. Lembaran Buku (<path>) */}
            <path
              className="simpro-book-pages transition-all duration-500 ease-out"
              d={isCollapsed ? SIMPRO_SVG_SHAPES.bookPages.collapsed : SIMPRO_SVG_SHAPES.bookPages.expanded}
              fill="#BAE6FD"
            />

            {/* 6. Awan Digital (<path>) */}
            <path
              className="simpro-cloud transition-all duration-500 ease-out"
              d={
                isCollapsed
                  ? SIMPRO_SVG_SHAPES.cloudOutline.collapsed
                  : SIMPRO_SVG_SHAPES.cloudOutline.expanded
              }
              stroke="#BAE6FD"
              strokeWidth={isCollapsed ? 2.2 : 4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 7. Jalur Sirkuit (<path>) */}
            <path
              className="simpro-circuit transition-all duration-500 ease-out"
              d={
                isCollapsed
                  ? SIMPRO_SVG_SHAPES.circuitLines.collapsed
                  : SIMPRO_SVG_SHAPES.circuitLines.expanded
              }
              stroke="#E0F2FE"
              strokeWidth={isCollapsed ? 1.4 : 2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 8. Perisai Huruf "S" (<path>) */}
            <path
              className="simpro-shield-s transition-all duration-500 ease-out"
              d={isCollapsed ? SIMPRO_SVG_SHAPES.shieldS.collapsed : SIMPRO_SVG_SHAPES.shieldS.expanded}
              fill="#7CC4FA"
            />

            {/* 9. Perisai Huruf "i" (<path>) */}
            <path
              className="simpro-shield-i transition-all duration-500 ease-out"
              d={isCollapsed ? SIMPRO_SVG_SHAPES.shieldI.collapsed : SIMPRO_SVG_SHAPES.shieldI.expanded}
              fill="#3898EC"
            />
          </g>

          {/* 10. Teks Judul & Subjudul SIMPRO (Hanya terlihat saat Expanded) */}
          <g
            className="simpro-brand-text transition-opacity duration-300 ease-out"
            style={{ opacity: isCollapsed ? 0 : 1 }}
          >
            <text
              x="128"
              y="140"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="24"
              fontWeight="800"
              letterSpacing="-0.02em"
            >
              SIMPRO
            </text>
            <text x="128" y="158" textAnchor="middle" fill="#DBEAFE" fontSize="11" fontWeight="500">
              Sistem Informasi Manajemen
            </text>
            <text x="128" y="172" textAnchor="middle" fill="#DBEAFE" fontSize="11" fontWeight="500">
              Program Studi
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

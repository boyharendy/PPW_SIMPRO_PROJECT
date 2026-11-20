import React from 'react';

export const TRIP_TABS = [
  'Semua',
  'DRAF',
  'DIAJUKAN',
  'PERLU_REVISI',
  'DISETUJUI',
  'DILAPORKAN',
  'SELESAI',
  'DITOLAK',
] as const;

const TAB_LABELS: Record<string, string> = {
  Semua: 'Semua',
  DRAF: 'Draf',
  DIAJUKAN: 'Menunggu Persetujuan',
  PERLU_REVISI: 'Perlu Revisi',
  DISETUJUI: 'Disetujui',
  DILAPORKAN: 'Dilaporkan',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

interface TripFilterBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  countsByStatus: Record<string, number>;
  isKaprodi: boolean;
  isAdminProdi: boolean;
  isDosen: boolean;
  dosenScope: 'MINE' | 'ALL';
  onDosenScopeChange: (scope: 'MINE' | 'ALL') => void;
}

/**
 * Renders the status filter pills with role-highlighted badges and the Dosen scope toggle.
 */
export default function TripFilterBar({
  activeTab,
  onTabChange,
  countsByStatus,
  isKaprodi,
  isAdminProdi,
  isDosen,
  dosenScope,
  onDosenScopeChange,
}: TripFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {TRIP_TABS.map((tab) => {
          const count = countsByStatus[tab] || 0;
          const highlightTab =
            (isKaprodi && tab === 'DIAJUKAN') ||
            (isAdminProdi && tab === 'DILAPORKAN') ||
            (isDosen && (tab === 'PERLU_REVISI' || tab === 'DISETUJUI'));
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{TAB_LABELS[tab]}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    highlightTab
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isDosen && (
        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit shrink-0">
          <button
            type="button"
            onClick={() => onDosenScopeChange('MINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dosenScope === 'MINE'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Perjalanan Saya
          </button>
          <button
            type="button"
            onClick={() => onDosenScopeChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              dosenScope === 'ALL'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Semua Perjalanan Prodi
          </button>
        </div>
      )}
    </div>
  );
}

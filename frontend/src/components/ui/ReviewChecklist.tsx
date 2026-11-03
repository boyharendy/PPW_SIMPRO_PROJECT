'use client';

import React from 'react';
import type { RpsReviewComponent, RpsItemResult } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export interface ChecklistState {
  komponen: RpsReviewComponent;
  hasil: RpsItemResult;
  catatan: string;
}

const RPS_COMPONENTS: { key: RpsReviewComponent; title: string; description: string }[] = [
  {
    key: 'KESELARASAN_CPL_CPMK',
    title: '1. Keselarasan CPL – CPMK – Sub CPMK',
    description: 'Keterkaitan capaian pembelajaran lulusan dengan indikator mingguan mata kuliah.',
  },
  {
    key: 'BAHAN_KAJIAN',
    title: '2. Bahan Kajian & Pokok Bahasan',
    description: 'Keluasan dan kedalaman materi ajar sesuai jenjang pendidikan SI.',
  },
  {
    key: 'METODE_PEMBELAJARAN',
    title: '3. Metode Pembelajaran (Student-Centered)',
    description: 'Penerapan Problem-Based Learning, Project-Based Learning, atau metode interaktif lainnya.',
  },
  {
    key: 'BENTUK_BOBOT_PENILAIAN',
    title: '4. Bentuk & Bobot Penilaian',
    description: 'Kesesuaian instrumen asesmen, rubrik penilaian, dan proporsi bobot CPMK.',
  },
  {
    key: 'REFERENSI',
    title: '5. Referensi & Pustaka',
    description: 'Pustaka primer terkini (5 tahun terakhir) dan artikel jurnal yang relevan.',
  },
];

interface ReviewChecklistProps {
  items: ChecklistState[];
  onChange: (items: ChecklistState[]) => void;
  disabled?: boolean;
}

export default function ReviewChecklist({ items, onChange, disabled = false }: ReviewChecklistProps) {
  const handleResultChange = (key: RpsReviewComponent, hasil: RpsItemResult) => {
    const updated = items.map((it) => (it.komponen === key ? { ...it, hasil } : it));
    onChange(updated);
  };

  const handleNotesChange = (key: RpsReviewComponent, catatan: string) => {
    const updated = items.map((it) => (it.komponen === key ? { ...it, catatan } : it));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {RPS_COMPONENTS.map((comp) => {
        const item = items.find((i) => i.komponen === comp.key) || {
          komponen: comp.key,
          hasil: 'SESUAI' as RpsItemResult,
          catatan: '',
        };

        return (
          <div
            key={comp.key}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">{comp.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{comp.description}</p>
              </div>

              {/* Status Radio Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleResultChange(comp.key, 'SESUAI')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    item.hasil === 'SESUAI'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  Sesuai
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleResultChange(comp.key, 'PERLU_PERBAIKAN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    item.hasil === 'PERLU_PERBAIKAN'
                      ? 'bg-amber-50 text-amber-800 border-amber-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle size={13} />
                  Perlu Perbaikan
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleResultChange(comp.key, 'TIDAK_SESUAI')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    item.hasil === 'TIDAK_SESUAI'
                      ? 'bg-rose-50 text-rose-800 border-rose-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <XCircle size={13} />
                  Tidak Sesuai
                </button>
              </div>
            </div>

            {/* Catatan Per Komponen */}
            <input
              type="text"
              disabled={disabled}
              value={item.catatan}
              onChange={(e) => handleNotesChange(comp.key, e.target.value)}
              placeholder="Catatan telaah atau rekomendasi perbaikan untuk komponen ini..."
              className="input-field text-xs py-2"
            />
          </div>
        );
      })}
    </div>
  );
}


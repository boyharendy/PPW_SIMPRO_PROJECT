'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';
import type { TripFundingSource } from '@/lib/types';

export interface TripLecturerOption {
  id: string;
  nama_lengkap: string;
}

export interface TripRkaBudgetOption {
  id: string;
  kode_pos: string;
  nama_pos: string;
  sisa_anggaran?: number;
}

export const TRIP_SUMBER_DANA: Array<{ value: TripFundingSource; label: string }> = [
  { value: 'RKA_PRODI', label: 'RKA Prodi' },
  { value: 'FAKULTAS', label: 'Fakultas' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'MANDIRI', label: 'Mandiri' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

interface TripInfoSectionProps {
  inputCls: string;
  dosenProfiles: TripLecturerOption[];
  pelaksanaId: string;
  anggotaIds: string[];
  tujuan: string;
  maksud: string;
  tglBerangkat: string;
  tglKembali: string;
  sumberDana: TripFundingSource | '';
  showPosRka: boolean;
  posRkaId: string;
  rkaBudgetItems: TripRkaBudgetOption[];
  onChangePelaksana: (val: string) => void;
  onToggleAnggota: (id: string) => void;
  onChangeTujuan: (val: string) => void;
  onChangeMaksud: (val: string) => void;
  onChangeTglBerangkat: (val: string) => void;
  onChangeTglKembali: (val: string) => void;
  onChangeSumberDana: (val: TripFundingSource | '') => void;
  onChangePosRka: (val: string) => void;
}

/**
 * Renders the core itinerary, participant selection, and funding source fields for a trip request.
 */
export default function TripInfoSection({
  inputCls,
  dosenProfiles,
  pelaksanaId,
  anggotaIds,
  tujuan,
  maksud,
  tglBerangkat,
  tglKembali,
  sumberDana,
  showPosRka,
  posRkaId,
  rkaBudgetItems,
  onChangePelaksana,
  onToggleAnggota,
  onChangeTujuan,
  onChangeMaksud,
  onChangeTglBerangkat,
  onChangeTglKembali,
  onChangeSumberDana,
  onChangePosRka,
}: TripInfoSectionProps) {
  return (
    <MotionCard
      index={0}
      interactive={false}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
    >
      <WordRevealHeading
        as="h2"
        text="Informasi Perjalanan"
        className="text-lg font-semibold text-slate-800"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pelaksana Utama (Ketua Rombongan)
          </label>
          <select
            value={pelaksanaId}
            onChange={(e) => onChangePelaksana(e.target.value)}
            className={inputCls}
          >
            <option value="">Pilih pelaksana utama</option>
            {dosenProfiles.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama_lengkap}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Anggota Rombongan (Opsional)
          </label>
          <div className="flex flex-wrap gap-2">
            {dosenProfiles
              .filter((d) => d.id !== pelaksanaId)
              .map((d) => {
                const selected = anggotaIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onToggleAnggota(d.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                      selected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {selected && <CheckCircle2 size={12} />}
                    {d.nama_lengkap}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tujuan
          </label>
          <input
            value={tujuan}
            onChange={(e) => onChangeTujuan(e.target.value)}
            placeholder="Kota / Instansi tujuan"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Maksud Kegiatan
          </label>
          <textarea
            value={maksud}
            onChange={(e) => onChangeMaksud(e.target.value)}
            rows={3}
            placeholder="Jelaskan maksud perjalanan dinas…"
            className={inputCls + ' resize-none'}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tanggal Berangkat
          </label>
          <input
            type="date"
            value={tglBerangkat}
            onChange={(e) => onChangeTglBerangkat(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tanggal Kembali
          </label>
          <input
            type="date"
            value={tglKembali}
            onChange={(e) => onChangeTglKembali(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Sumber Dana
          </label>
          <select
            value={sumberDana}
            onChange={(e) => onChangeSumberDana(e.target.value as TripFundingSource | '')}
            className={inputCls}
          >
            <option value="">Pilih sumber dana</option>
            {TRIP_SUMBER_DANA.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {showPosRka && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pos RKA
            </label>
            <select
              value={posRkaId}
              onChange={(e) => onChangePosRka(e.target.value)}
              className={inputCls}
            >
              <option value="">Pilih pos RKA</option>
              {rkaBudgetItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.kode_pos} — {p.nama_pos}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </MotionCard>
  );
}

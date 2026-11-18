'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { mockProfiles } from '@/lib/mock-data';
import {
  computeActivityTotal,
  quartersToDateRange,
  RKA_CATEGORY_OPTIONS,
  RKA_QUARTERS,
  RKA_SOURCE_OPTIONS,
} from '@/lib/rka-utils';
import type {
  RkaActivity,
  RkaActivityExecutionStatus,
  RkaBudgetCategory,
  RkaBudgetItem,
  RkaBudgetSource,
  RkaQuarter,
} from '@/lib/types';
import { formatRupiah } from '@/lib/utils';

interface RkaActivityFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (activity: RkaActivity) => void;
  rkaId: string;
  tahun: number;
  initialActivity?: RkaActivity | null;
  nextIndex: number;
}

function createEmptyBudgetItem(activityId: string, kodeKegiatan: string, idx: number): RkaBudgetItem {
  return {
    id: `pos-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
    activity_id: activityId,
    kode_pos: `POS-${kodeKegiatan.replace(/\D/g, '') || '01'}-0${idx}`,
    nama_pos: '',
    kategori_pos: 'BELANJA_BARANG',
    volume: 1,
    satuan: 'Paket',
    harga_satuan: 0,
    nominal_anggaran: 0,
    sumber_dana: 'DANA_RUTIN_PRODI',
    is_active: true,
  };
}

export default function RkaActivityFormModal({
  open,
  onClose,
  onSave,
  rkaId,
  tahun,
  initialActivity,
  nextIndex,
}: RkaActivityFormModalProps) {
  const [kodeKegiatan, setKodeKegiatan] = useState('');
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [indikatorKinerja, setIndikatorKinerja] = useState('');
  const [targetIndikator, setTargetIndikator] = useState('');
  const [quarters, setQuarters] = useState<RkaQuarter[]>(['TW1']);
  const [jadwalMulai, setJadwalMulai] = useState('');
  const [jadwalSelesai, setJadwalSelesai] = useState('');
  const [picId, setPicId] = useState('u-kaprodi');
  const [statusPelaksanaan, setStatusPelaksanaan] =
    useState<RkaActivityExecutionStatus>('BELUM_DILAKSANAKAN');
  const [budgetItems, setBudgetItems] = useState<RkaBudgetItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (initialActivity) {
      setKodeKegiatan(initialActivity.kode_kegiatan);
      setNamaKegiatan(initialActivity.nama_kegiatan);
      setIndikatorKinerja(initialActivity.indikator_kinerja);
      setTargetIndikator(initialActivity.target_indikator || '');
      const qs =
        initialActivity.jadwal_triwulan && initialActivity.jadwal_triwulan.length > 0
          ? initialActivity.jadwal_triwulan
          : (['TW1'] as RkaQuarter[]);
      setQuarters(qs);
      const range = quartersToDateRange(tahun, qs);
      setJadwalMulai(initialActivity.jadwal_mulai || range.start);
      setJadwalSelesai(initialActivity.jadwal_selesai || range.end);
      setPicId(initialActivity.penanggung_jawab_id || 'u-kaprodi');
      setStatusPelaksanaan(initialActivity.status_pelaksanaan || 'BELUM_DILAKSANAKAN');
      setBudgetItems(
        (initialActivity.budget_items || []).length > 0
          ? JSON.parse(JSON.stringify(initialActivity.budget_items))
          : [createEmptyBudgetItem(initialActivity.id, initialActivity.kode_kegiatan, 1)]
      );
    } else {
      const actId = `act-${Date.now()}`;
      const defaultCode = `KG-${String(nextIndex).padStart(2, '0')}`;
      const defaultQs: RkaQuarter[] = ['TW1', 'TW2'];
      const range = quartersToDateRange(tahun, defaultQs);
      setKodeKegiatan(defaultCode);
      setNamaKegiatan('');
      setIndikatorKinerja('');
      setTargetIndikator('');
      setQuarters(defaultQs);
      setJadwalMulai(range.start);
      setJadwalSelesai(range.end);
      setPicId('u-kaprodi');
      setStatusPelaksanaan('BELUM_DILAKSANAKAN');
      setBudgetItems([createEmptyBudgetItem(actId, defaultCode, 1)]);
    }
  }, [open, initialActivity, nextIndex, tahun]);

  const toggleQuarter = (q: RkaQuarter) => {
    setQuarters((prev) => {
      const exists = prev.includes(q);
      const next = exists ? prev.filter((item) => item !== q) : [...prev, q];
      if (next.length === 0) return prev;
      const sorted = next.sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
      const range = quartersToDateRange(tahun, sorted);
      setJadwalMulai(range.start);
      setJadwalSelesai(range.end);
      return sorted;
    });
  };

  const handleAddItem = () => {
    const actId = initialActivity?.id || `act-${Date.now()}`;
    setBudgetItems((prev) => [...prev, createEmptyBudgetItem(actId, kodeKegiatan, prev.length + 1)]);
  };

  const handleRemoveItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateItem = (id: string, patch: Partial<RkaBudgetItem>) => {
    setBudgetItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...patch };
        if ('volume' in patch || 'harga_satuan' in patch) {
          merged.nominal_anggaran = (Number(merged.volume) || 0) * (Number(merged.harga_satuan) || 0);
        }
        return merged;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!kodeKegiatan.trim() || !namaKegiatan.trim() || !indikatorKinerja.trim()) {
      setErrorMsg('Kode kegiatan, nama kegiatan, dan indikator kinerja wajib diisi (FR-36).');
      return;
    }

    if (budgetItems.length === 0) {
      setErrorMsg('Tambahkan minimal 1 pos anggaran untuk butir kegiatan ini.');
      return;
    }

    for (let i = 0; i < budgetItems.length; i++) {
      const b = budgetItems[i];
      if (!b.nama_pos.trim()) {
        setErrorMsg(`Pos anggaran #${i + 1}: Nama pos wajib diisi.`);
        return;
      }
      if (b.nominal_anggaran < 0 || Number.isNaN(b.nominal_anggaran)) {
        setErrorMsg(`Pos anggaran "${b.nama_pos}": Nominal anggaran harus bernilai >= 0.`);
        return;
      }
    }

    const actId = initialActivity?.id || `act-${Date.now()}`;
    const picProfile = mockProfiles.find((p) => p.id === picId);
    const cleanedItems = budgetItems.map((b) => ({
      ...b,
      activity_id: actId,
      is_active: true,
    }));

    const result: RkaActivity = {
      id: actId,
      rka_id: rkaId,
      kode_kegiatan: kodeKegiatan.trim(),
      nama_kegiatan: namaKegiatan.trim(),
      indikator_kinerja: indikatorKinerja.trim(),
      target_indikator: targetIndikator.trim() || '100% Terlaksana',
      jadwal_mulai: jadwalMulai,
      jadwal_selesai: jadwalSelesai,
      jadwal_triwulan: quarters,
      penanggung_jawab_id: picId,
      penanggung_jawab_nama: picProfile?.nama_lengkap,
      status_pelaksanaan: statusPelaksanaan,
      is_active: true,
      budget_items: cleanedItems,
      total_anggaran: computeActivityTotal({ budget_items: cleanedItems }),
    };

    onSave(result);
    onClose();
  };

  const subtotal = budgetItems.reduce((sum, b) => sum + (Number(b.nominal_anggaran) || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialActivity ? `Edit Butir Kegiatan (${initialActivity.kode_kegiatan})` : 'Tambah Butir Kegiatan RKA'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Kode Kegiatan *</label>
            <input
              type="text"
              value={kodeKegiatan}
              onChange={(e) => setKodeKegiatan(e.target.value)}
              placeholder="KG-01"
              className="input-field text-xs font-mono"
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label className="font-semibold text-slate-700 block mb-1">Nama Kegiatan *</label>
            <input
              type="text"
              value={namaKegiatan}
              onChange={(e) => setNamaKegiatan(e.target.value)}
              placeholder="Contoh: Seminar Nasional Teknologi Informasi & Konferensi"
              className="input-field text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Indikator Kinerja *</label>
            <input
              type="text"
              value={indikatorKinerja}
              onChange={(e) => setIndikatorKinerja(e.target.value)}
              placeholder="Contoh: Jumlah dosen mengikuti sertifikasi kompetensi"
              className="input-field text-xs"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Kinerja</label>
            <input
              type="text"
              value={targetIndikator}
              onChange={(e) => setTargetIndikator(e.target.value)}
              placeholder="Contoh: 10 Dosen"
              className="input-field text-xs"
            />
          </div>
        </div>

        {/* Jadwal Pelaksanaan (TW1-TW4 & Rentang Tanggal) + PIC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Jadwal Pelaksanaan (TW1–TW4) *
            </label>
            <div className="flex items-center gap-1.5 mb-2">
              {RKA_QUARTERS.map((q) => {
                const active = quarters.includes(q);
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleQuarter(q)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={jadwalMulai}
                onChange={(e) => setJadwalMulai(e.target.value)}
                className="input-field text-[11px] py-1"
              />
              <input
                type="date"
                value={jadwalSelesai}
                onChange={(e) => setJadwalSelesai(e.target.value)}
                className="input-field text-[11px] py-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Penanggung Jawab (PIC) *
              </label>
              <select
                value={picId}
                onChange={(e) => setPicId(e.target.value)}
                className="select-field text-xs"
              >
                {mockProfiles
                  .filter((p) => p.tipe_pengguna !== 'MAHASISWA')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_lengkap}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status Pelaksanaan</label>
              <select
                value={statusPelaksanaan}
                onChange={(e) => setStatusPelaksanaan(e.target.value as RkaActivityExecutionStatus)}
                className="select-field text-xs"
              >
                <option value="BELUM_DILAKSANAKAN">Belum Terlaksana</option>
                <option value="BERJALAN">Berjalan</option>
                <option value="TERLAKSANA">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rincian Pos Anggaran */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Rincian Pos Anggaran (FR-36)
              </h4>
              <p className="text-[11px] text-slate-400">
                Total pagu kegiatan &amp; RKA dihitung otomatis dari seluruh nominal pos di bawah.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1"
            >
              <Plus size={13} /> Tambah Pos
            </button>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {budgetItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 bg-white space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Pos #{idx + 1}</span>
                  {budgetItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Hapus Pos"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      value={item.kode_pos}
                      onChange={(e) => handleUpdateItem(item.id, { kode_pos: e.target.value })}
                      className="input-field text-xs py-1 px-2 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Nama / Uraian Pos *
                    </label>
                    <input
                      type="text"
                      value={item.nama_pos}
                      onChange={(e) => handleUpdateItem(item.id, { nama_pos: e.target.value })}
                      placeholder="Contoh: Biaya Perjalanan Dinas Dosen"
                      className="input-field text-xs py-1 px-2"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Kategori Pos *
                    </label>
                    <select
                      value={item.kategori_pos}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { kategori_pos: e.target.value as RkaBudgetCategory })
                      }
                      className="select-field text-xs py-1 px-2"
                    >
                      {RKA_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Volume
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.volume}
                      onChange={(e) => handleUpdateItem(item.id, { volume: Number(e.target.value) })}
                      className="input-field text-xs py-1 px-2 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={item.satuan}
                      onChange={(e) => handleUpdateItem(item.id, { satuan: e.target.value })}
                      className="input-field text-xs py-1 px-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Harga Satuan (Rp) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={item.harga_satuan}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { harga_satuan: Number(e.target.value) })
                      }
                      className="input-field text-xs py-1 px-2 font-mono text-right"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      Sumber Dana *
                    </label>
                    <select
                      value={item.sumber_dana}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { sumber_dana: e.target.value as RkaBudgetSource })
                      }
                      className="select-field text-xs py-1 px-2"
                    >
                      {RKA_SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 mr-2">Nominal Pos Otomatis:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(item.nominal_anggaran)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 block">Subtotal Pagu Kegiatan</span>
            <span className="text-base font-bold text-blue-700 font-mono">
              {formatRupiah(subtotal)}
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs px-4 py-2">
              Simpan Butir Kegiatan
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

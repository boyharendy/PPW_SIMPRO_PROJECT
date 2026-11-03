'use client';

import React, { useState } from 'react';
import type { RkaActivity, RkaBudgetItem, RkaBudgetCategory, RkaBudgetSource } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface BudgetTableEditorProps {
  activities: RkaActivity[];
  onChange: (updated: RkaActivity[]) => void;
  disabled?: boolean;
}

export default function BudgetTableEditor({
  activities,
  onChange,
  disabled = false,
}: BudgetTableEditorProps) {
  const [expandedActs, setExpandedActs] = useState<Record<string, boolean>>({
    [activities[0]?.id || '']: true,
  });

  const toggleExpand = (actId: string) => {
    setExpandedActs((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  // Add new Activity
  const handleAddActivity = () => {
    const newId = `act-new-${Date.now()}`;
    const newAct: RkaActivity = {
      id: newId,
      rka_id: activities[0]?.rka_id || 'rka-current',
      kode_kegiatan: `KEG-0${activities.length + 1}`,
      nama_kegiatan: 'Kegiatan Baru',
      indikator_kinerja: 'Indikator Kinerja Baru',
      target_indikator: '100%',
      jadwal_mulai: '2025-01-01',
      jadwal_selesai: '2025-12-31',
      penanggung_jawab_id: 'u-kaprodi',
      status_pelaksanaan: 'BELUM_DILAKSANAKAN',
      is_active: true,
      budget_items: [
        {
          id: `pos-new-${Date.now()}`,
          activity_id: newId,
          kode_pos: '5.2.2.01',
          nama_pos: 'Pos Belanja Utama',
          kategori_pos: 'BELANJA_BARANG',
          volume: 1,
          satuan: 'Paket',
          harga_satuan: 1000000,
          nominal_anggaran: 1000000,
          sumber_dana: 'DANA_UNIVERSITAS',
          is_active: true,
        },
      ],
    };

    const next = [...activities, newAct];
    onChange(next);
    setExpandedActs((prev) => ({ ...prev, [newId]: true }));
  };

  // Remove Activity
  const handleRemoveActivity = (actId: string) => {
    const next = activities.filter((a) => a.id !== actId);
    onChange(next);
  };

  // Add Item to Activity
  const handleAddItem = (actId: string) => {
    const next = activities.map((act) => {
      if (act.id !== actId) return act;
      const newItem: RkaBudgetItem = {
        id: `pos-new-${Date.now()}`,
        activity_id: actId,
        kode_pos: `5.2.${act.budget_items.length + 1}.01`,
        nama_pos: 'Pos Belanja Baru',
        kategori_pos: 'BELANJA_JASA',
        volume: 1,
        satuan: 'Kegiatan',
        harga_satuan: 500000,
        nominal_anggaran: 500000,
        sumber_dana: 'DANA_UNIVERSITAS',
        is_active: true,
      };
      return {
        ...act,
        budget_items: [...act.budget_items, newItem],
      };
    });
    onChange(next);
  };

  // Update Item in Activity
  const handleUpdateItem = (
    actId: string,
    itemId: string,
    field: keyof RkaBudgetItem,
    val: unknown
  ) => {
    const next = activities.map((act) => {
      if (act.id !== actId) return act;
      const updatedItems = act.budget_items.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: val };
        // compute nominal automatically
        if (field === 'volume' || field === 'harga_satuan') {
          updated.nominal_anggaran = (Number(updated.volume) || 0) * (Number(updated.harga_satuan) || 0);
        }
        return updated;
      });
      return { ...act, budget_items: updatedItems };
    });
    onChange(next);
  };

  // Remove Item
  const handleRemoveItem = (actId: string, itemId: string) => {
    const next = activities.map((act) => {
      if (act.id !== actId) return act;
      return {
        ...act,
        budget_items: act.budget_items.filter((i) => i.id !== itemId),
      };
    });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {activities.map((act, actIdx) => {
        const isExpanded = !!expandedActs[act.id];
        const actTotal = act.budget_items.reduce((acc, it) => acc + (it.nominal_anggaran || 0), 0);

        return (
          <div
            key={act.id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
          >
            {/* Activity Header */}
            <div
              onClick={() => toggleExpand(act.id)}
              className="p-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {act.kode_kegiatan}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{act.nama_kegiatan}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal Anggaran</p>
                  <p className="text-xs font-bold text-slate-800">{formatRupiah(actTotal)}</p>
                </div>
                {!disabled && activities.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveActivity(act.id);
                    }}
                    className="w-7 h-7 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                    title="Hapus Kegiatan"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Activity Body / Budget Items Table */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                {/* Activity fields editor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <label className="label text-[11px]">Nama Kegiatan</label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={act.nama_kegiatan}
                      onChange={(e) => {
                        const next = activities.map((a, i) =>
                          i === actIdx ? { ...a, nama_kegiatan: e.target.value } : a
                        );
                        onChange(next);
                      }}
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="label text-[11px]">Indikator Kinerja</label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={act.indikator_kinerja}
                      onChange={(e) => {
                        const next = activities.map((a, i) =>
                          i === actIdx ? { ...a, indikator_kinerja: e.target.value } : a
                        );
                        onChange(next);
                      }}
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                  <div>
                    <label className="label text-[11px]">Target Indikator</label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={act.target_indikator}
                      onChange={(e) => {
                        const next = activities.map((a, i) =>
                          i === actIdx ? { ...a, target_indikator: e.target.value } : a
                        );
                        onChange(next);
                      }}
                      className="input-field text-xs py-1.5"
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left w-24">Kode Pos</th>
                        <th className="px-3 py-2 text-left">Nama Pos Anggaran</th>
                        <th className="px-3 py-2 text-left w-32">Kategori</th>
                        <th className="px-3 py-2 text-right w-20">Volume</th>
                        <th className="px-3 py-2 text-left w-20">Satuan</th>
                        <th className="px-3 py-2 text-right w-36">Harga Satuan</th>
                        <th className="px-3 py-2 text-right w-36">Subtotal</th>
                        {!disabled && <th className="px-2 py-2 text-center w-10">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {act.budget_items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={disabled}
                              value={item.kode_pos}
                              onChange={(e) => handleUpdateItem(act.id, item.id, 'kode_pos', e.target.value)}
                              className="input-field text-xs py-1 font-mono"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={disabled}
                              value={item.nama_pos}
                              onChange={(e) => handleUpdateItem(act.id, item.id, 'nama_pos', e.target.value)}
                              className="input-field text-xs py-1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              disabled={disabled}
                              value={item.kategori_pos}
                              onChange={(e) => handleUpdateItem(act.id, item.id, 'kategori_pos', e.target.value as RkaBudgetCategory)}
                              className="select-field text-xs py-1"
                            >
                              <option value="BELANJA_BARANG">Belanja Barang</option>
                              <option value="BELANJA_JASA">Belanja Jasa</option>
                              <option value="HONOR">Honor</option>
                              <option value="PERJALANAN_DINAS">Perjalanan Dinas</option>
                              <option value="LAINNYA">Lainnya</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              disabled={disabled}
                              min={1}
                              value={item.volume}
                              onChange={(e) => handleUpdateItem(act.id, item.id, 'volume', Number(e.target.value) || 0)}
                              className="input-field text-xs py-1 text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={disabled}
                              value={item.satuan}
                              onChange={(e) => handleUpdateItem(act.id, item.id, 'satuan', e.target.value)}
                              className="input-field text-xs py-1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <CurrencyInput
                              disabled={disabled}
                              value={item.harga_satuan}
                              onChange={(val) => handleUpdateItem(act.id, item.id, 'harga_satuan', val)}
                              className="text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">
                            {formatRupiah(item.nominal_anggaran)}
                          </td>
                          {!disabled && (
                            <td className="px-2 py-2 text-center">
                              {act.budget_items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(act.id, item.id)}
                                  className="w-6 h-6 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 inline-flex items-center justify-center transition-colors"
                                  title="Hapus Pos"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleAddItem(act.id)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus size={14} />
                    <span>Tambah Pos Anggaran</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          type="button"
          onClick={handleAddActivity}
          className="w-full py-3 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Layers size={16} />
          <span>Tambah Kegiatan Baru</span>
        </button>
      )}
    </div>
  );
}


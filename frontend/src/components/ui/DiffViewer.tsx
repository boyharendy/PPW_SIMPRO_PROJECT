'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';

export interface DiffItem {
  id: string;
  type: 'ADDED' | 'MODIFIED' | 'REMOVED';
  kegiatan: string;
  kode_pos: string;
  nama_pos: string;
  old_nominal?: number;
  new_nominal?: number;
  keterangan?: string;
}

interface DiffViewerProps {
  diffs: DiffItem[];
}

export default function DiffViewer({ diffs }: DiffViewerProps) {
  if (diffs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
        Tidak ada perbedaan antara versi ini dengan data aktif.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
          <tr>
            <th className="px-3 py-2.5 text-left w-24">Tipe Aksi</th>
            <th className="px-3 py-2.5 text-left">Kegiatan & Pos Anggaran</th>
            <th className="px-3 py-2.5 text-right w-36">Anggaran Lama</th>
            <th className="px-3 py-2.5 text-right w-36">Anggaran Baru</th>
            <th className="px-3 py-2.5 text-right w-36">Selisih</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {diffs.map((d) => {
            const oldNom = d.old_nominal || 0;
            const newNom = d.new_nominal || 0;
            const delta = newNom - oldNom;

            return (
              <tr
                key={d.id}
                className={
                  d.type === 'ADDED'
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    : d.type === 'REMOVED'
                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                    : 'bg-amber-50/40 hover:bg-amber-50/70'
                }
              >
                <td className="px-3 py-3 font-semibold">
                  {d.type === 'ADDED' && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[10px]">
                      <PlusCircle size={11} /> Tambah
                    </span>
                  )}
                  {d.type === 'MODIFIED' && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[10px]">
                      <Edit3 size={11} /> Ubah
                    </span>
                  )}
                  {d.type === 'REMOVED' && (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded text-[10px]">
                      <Trash2 size={11} /> Hapus
                    </span>
                  )}
                </td>

                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-800">{d.nama_pos}</p>
                  <p className="text-[11px] text-slate-500">
                    <span className="font-mono text-slate-400 mr-1.5">{d.kode_pos}</span>
                    <span>{d.kegiatan}</span>
                  </p>
                  {d.keterangan && (
                    <p className="text-[10px] text-slate-400 mt-0.5 italic">{d.keterangan}</p>
                  )}
                </td>

                <td className="px-3 py-3 text-right font-medium text-slate-500">
                  {d.type === 'ADDED' ? '-' : formatRupiah(oldNom)}
                </td>

                <td className="px-3 py-3 text-right font-semibold text-slate-800">
                  {d.type === 'REMOVED' ? '-' : formatRupiah(newNom)}
                </td>

                <td className="px-3 py-3 text-right font-bold">
                  {delta > 0 && <span className="text-emerald-600">+{formatRupiah(delta)}</span>}
                  {delta < 0 && <span className="text-rose-600">{formatRupiah(delta)}</span>}
                  {delta === 0 && <span className="text-slate-400">Rp 0</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


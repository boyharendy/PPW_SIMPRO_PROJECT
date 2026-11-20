import React from 'react';
import { ChevronDown, ChevronRight, Edit3, GitBranch, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  computeActivityTotal,
  formatActivityQuarters,
  resolveActivityPicName,
} from '@/lib/rka-utils';
import type { RkaActivity, RkaVersion } from '@/lib/types';
import {
  calculateAbsorptionPercentage,
  formatDateShort,
  formatRupiah,
  getStatusLabel,
} from '@/lib/utils';

interface RkaActivityAccordionListProps {
  activities: RkaActivity[];
  expandedIds: Record<string, boolean>;
  isEditable: boolean;
  isArchived: boolean;
  onToggleExpand: (id: string) => void;
  onAddActivity: () => void;
  onEditActivity: (act: RkaActivity) => void;
  onDeleteActivity: (act: RkaActivity) => void;
}

/**
 * Renders the expandable list of RKA activities along with itemized budget sub-tables.
 */
export function RkaActivityAccordionList({
  activities,
  expandedIds,
  isEditable,
  isArchived,
  onToggleExpand,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}: RkaActivityAccordionListProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Daftar Butir Kegiatan &amp; Pos Anggaran
          </h2>
          <p className="text-xs text-slate-500">
            Klik baris kegiatan untuk melihat rincian Pos Anggaran, Sumber Dana, Indikator Kinerja, PIC, dan Jadwal Pelaksanaan.
          </p>
        </div>
        {isEditable && (
          <button
            type="button"
            onClick={onAddActivity}
            className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} /> Tambah Kegiatan
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-sm font-medium text-slate-600">
            Belum ada butir kegiatan pada RKA ini.
          </p>
          {isEditable && (
            <button
              type="button"
              onClick={onAddActivity}
              className="btn-secondary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5"
            >
              <Plus size={13} /> Tambah Butir Kegiatan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const isExpanded = expandedIds[act.id] ?? true;
            const actPagu = computeActivityTotal(act);
            const actReal = act.total_realisasi ?? 0;
            const actPct = calculateAbsorptionPercentage(actReal, actPagu);
            const isOver = actReal > actPagu;

            return (
              <div
                key={act.id}
                className="rounded-xl border border-slate-200 overflow-hidden bg-white"
              >
                <div
                  onClick={() => onToggleExpand(act.id)}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 text-slate-400">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {act.kode_kegiatan}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800">{act.nama_kegiatan}</h3>
                        <StatusBadge status={act.status_pelaksanaan} size="sm" />
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Indikator:</strong> {act.indikator_kinerja} ({act.target_indikator})
                        </span>
                        <span>
                          <strong>Jadwal:</strong> {formatActivityQuarters(act)}
                        </span>
                        <span>
                          <strong>PIC:</strong> {resolveActivityPicName(act)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-4 shrink-0 self-end lg:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                        Pagu Kegiatan
                      </span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {formatRupiah(actPagu)}
                      </span>
                      {!isArchived && (
                        <span
                          className={`text-[11px] block font-semibold ${
                            isOver ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          Realisasi: {formatRupiah(actReal)} ({actPct}%)
                        </span>
                      )}
                    </div>

                    {isEditable && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditActivity(act)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200"
                          title="Edit Kegiatan & Pos Anggaran"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteActivity(act)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-left text-[11px] text-slate-400 font-semibold uppercase">
                          <th className="py-2.5 px-4">Kode Pos</th>
                          <th className="py-2.5 px-3">Nama Pos Anggaran</th>
                          <th className="py-2.5 px-3">Kategori Pos</th>
                          <th className="py-2.5 px-3">Sumber Dana</th>
                          <th className="py-2.5 px-3 text-center">Vol &amp; Satuan</th>
                          <th className="py-2.5 px-3 text-right">Nominal Pagu</th>
                          {!isArchived && <th className="py-2.5 px-4 text-right">Realisasi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(act.budget_items || []).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-3 px-4 text-center text-rose-600 font-medium">
                              Belum ada pos anggaran pada kegiatan ini (wajib minimal 1 pos sebelum pengesahan).
                            </td>
                          </tr>
                        ) : (
                          (act.budget_items || []).map((pos) => {
                            const posReal = pos.realisasi_total ?? 0;
                            const posOver = posReal > pos.nominal_anggaran;
                            return (
                              <tr key={pos.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-mono text-slate-500 font-semibold">
                                  {pos.kode_pos}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                  {pos.nama_pos}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                                    {getStatusLabel(pos.kategori_pos)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {getStatusLabel(pos.sumber_dana)}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-600">
                                  {pos.volume} {pos.satuan}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                                  {formatRupiah(pos.nominal_anggaran)}
                                </td>
                                {!isArchived && (
                                  <td
                                    className={`py-2.5 px-4 text-right font-mono font-semibold ${
                                      posOver ? 'text-rose-600' : 'text-slate-600'
                                    }`}
                                  >
                                    {formatRupiah(posReal)}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RkaVersionSummaryCardProps {
  versions: RkaVersion[];
  selectedVersionNum?: number;
  onSelectVersion: (num: number) => void;
  onOpenHistory: () => void;
}

/**
 * Renders the document version history summary card below the activity list.
 */
export function RkaVersionSummaryCard({
  versions,
  selectedVersionNum,
  onSelectVersion,
  onOpenHistory,
}: RkaVersionSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch size={18} className="text-slate-400" />
          <h2 className="text-base font-semibold text-slate-800">Riwayat Versi Dokumen</h2>
        </div>
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Bandingkan Versi &amp; Audit Log →
        </button>
      </div>
      <div className="space-y-2.5">
        {versions.map((v) => {
          const isSelected = v.nomor_versi === selectedVersionNum;
          return (
            <div
              key={v.id}
              onClick={() => onSelectVersion(v.nomor_versi)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-blue-300 bg-blue-50/40'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  v{v.nomor_versi}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Versi {v.nomor_versi} • {formatRupiah(v.total_anggaran)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {v.alasan_revisi || 'Penyusunan RKA'} • {formatDateShort(v.diterapkan_at || v.created_at)}
                  </p>
                </div>
              </div>
              <StatusBadge status={v.status} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RkaRevisionModalProps {
  open: boolean;
  tahunAnggaran: number;
  nextVersionNum: number;
  alasanRevisi: string;
  onChangeAlasan: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Renders the modal prompting Kaprodi for justification when initiating a new RKA revision.
 */
export function RkaRevisionModal({
  open,
  tahunAnggaran,
  nextVersionNum,
  alasanRevisi,
  onChangeAlasan,
  onClose,
  onSubmit,
}: RkaRevisionModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Buat Revisi RKA TA ${tahunAnggaran}`} size="sm">
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-800 leading-relaxed">
          Membuat revisi akan mengarsipkan versi aktif saat ini sebagai snapshot <strong>read-only</strong> dan
          membuka draf versi baru (<strong>v{nextVersionNum}</strong>) untuk disunting dan disahkan.
        </div>
        <div>
          <label className="font-semibold text-slate-700 block mb-1.5">
            Alasan / Justifikasi Revisi *
          </label>
          <textarea
            rows={3}
            value={alasanRevisi}
            onChange={(e) => onChangeAlasan(e.target.value)}
            placeholder="Contoh: Pergeseran pagu perjalanan dinas & penambahan alokasi lab..."
            className="input-field text-xs resize-none"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Batal
          </button>
          <button type="submit" className="btn-primary text-xs px-4 py-2">
            Buka Draf Revisi
          </button>
        </div>
      </form>
    </Modal>
  );
}

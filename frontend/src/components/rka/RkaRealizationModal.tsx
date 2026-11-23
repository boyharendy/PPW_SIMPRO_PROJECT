import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatFileSize } from '@/lib/rka-utils';
import type { RkaActivity, RkaActivityExecutionStatus, RkaBudgetItem } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';

interface ProofFileMeta {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

interface RkaRealizationModalProps {
  open: boolean;
  tahunLabel: string | number;
  formError: string | null;
  tanggalRealisasi: string;
  statusPelaksanaan: RkaActivityExecutionStatus;
  activities: RkaActivity[];
  selectedActivityId: string;
  availablePosItems: RkaBudgetItem[];
  selectedPosItem?: RkaBudgetItem;
  nominal: string;
  uraian: string;
  proofFileMeta: ProofFileMeta | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChangeTanggal: (val: string) => void;
  onChangeStatus: (val: RkaActivityExecutionStatus) => void;
  onChangeActivity: (actId: string) => void;
  onChangePos: (posId: string) => void;
  onChangeNominal: (val: string) => void;
  onChangeUraian: (val: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Renders the modal form for recording a manual RKA realization with mandatory expenditure proof.
 */
export default function RkaRealizationModal({
  open,
  tahunLabel,
  formError,
  tanggalRealisasi,
  statusPelaksanaan,
  activities,
  selectedActivityId,
  availablePosItems,
  selectedPosItem,
  nominal,
  uraian,
  proofFileMeta,
  isSubmitting,
  onClose,
  onSubmit,
  onChangeTanggal,
  onChangeStatus,
  onChangeActivity,
  onChangePos,
  onChangeNominal,
  onChangeUraian,
  onFileChange,
}: RkaRealizationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Catat Realisasi Anggaran — RKA ${tahunLabel}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tanggal Realisasi *
            </label>
            <input
              type="date"
              value={tanggalRealisasi}
              onChange={(e) => onChangeTanggal(e.target.value)}
              className="input-field text-xs"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Status Pelaksanaan Kegiatan *
            </label>
            <select
              value={statusPelaksanaan}
              onChange={(e) => onChangeStatus(e.target.value as RkaActivityExecutionStatus)}
              className="select-field text-xs"
            >
              <option value="BELUM_DILAKSANAKAN">Belum Terlaksana</option>
              <option value="BERJALAN">Berjalan</option>
              <option value="TERLAKSANA">Selesai</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Butir Kegiatan RKA *</label>
          <select
            value={selectedActivityId}
            onChange={(e) => onChangeActivity(e.target.value)}
            className="select-field text-xs"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.kode_kegiatan} — {a.nama_kegiatan}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Pos Anggaran *</label>
          <select
            value={selectedPosItem?.id || ''}
            onChange={(e) => onChangePos(e.target.value)}
            className="select-field text-xs"
          >
            {availablePosItems.map((b) => (
              <option key={b.id} value={b.id}>
                {b.kode_pos} — {b.nama_pos} (Sisa: {formatRupiah(b.sisa_anggaran ?? b.nominal_anggaran)})
              </option>
            ))}
          </select>
          {selectedPosItem && (
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Pagu Pos: {formatRupiah(selectedPosItem.nominal_anggaran)}</span>
              <span>
                Terpakai: {formatRupiah(selectedPosItem.realisasi_total ?? 0)} • Sisa:{' '}
                <strong
                  className={
                    (selectedPosItem.sisa_anggaran ?? 0) < 0 ? 'text-rose-600' : 'text-slate-700'
                  }
                >
                  {formatRupiah(selectedPosItem.sisa_anggaran ?? selectedPosItem.nominal_anggaran)}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Nominal Biaya Terpakai (Rp) *
          </label>
          <input
            type="number"
            min={1}
            step={1000}
            value={nominal}
            onChange={(e) => onChangeNominal(e.target.value)}
            placeholder="Contoh: 2500000"
            className="input-field text-xs font-mono"
            required
          />
          {selectedPosItem &&
            Number(nominal) >
              (selectedPosItem.sisa_anggaran ?? selectedPosItem.nominal_anggaran) && (
              <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Perhatian: Nominal melebihi sisa pagu pos ini dan akan ditandai Over-Pagu di Monitoring Serapan.
              </p>
            )}
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Uraian Pengeluaran *</label>
          <textarea
            rows={2}
            value={uraian}
            onChange={(e) => onChangeUraian(e.target.value)}
            placeholder="Contoh: Pembayaran invoice narasumber / pengadaan perlengkapan..."
            className="input-field resize-none text-xs"
            required
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">
            Unggah Bukti Pengeluaran (PDF, JPG, PNG, DOCX, XLSX) *
          </label>
          <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              onChange={onFileChange}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {proofFileMeta ? (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 size={13} />
                <span>
                  {proofFileMeta.name} ({formatFileSize(proofFileMeta.size)})
                </span>
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] text-slate-400">
                Format yang diizinkan: PDF, JPG, PNG, DOCX, XLSX (Maks. 10 MB).
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Realisasi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  computeActivityTotal,
  computeDocumentTotalPagu,
  RKA_CATEGORY_OPTIONS,
  RKA_SOURCE_OPTIONS,
} from '@/lib/rka-utils';
import type {
  RkaActivity,
  RkaBudgetCategory,
  RkaBudgetItem,
  RkaBudgetSource,
  RkaDocument,
} from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import MotionCard from '@/components/motion/MotionCard';

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();
  const { user, currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [doc, setDoc] = useState<RkaDocument | null>(null);
  const [kegiatan, setKegiatan] = useState<RkaActivity[]>([]);
  const [alasanRevisi, setAlasanRevisi] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await rkaService.getRkaByYear(tahun || '2025');
      if (res.data) {
        setDoc(res.data);
        const working = (res.data.versions || []).find(
          (v) => v.id === res.data?.versi_kerja_id || v.status === 'DRAF'
        );
        const acts =
          (working?.draft_payload?.activities as RkaActivity[] | undefined) ||
          res.data.activities ||
          [];
        setKegiatan(JSON.parse(JSON.stringify(acts)));
        setAlasanRevisi(working?.alasan_revisi || '');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPagu = computeDocumentTotalPagu(kegiatan);

  const handleAddPos = (kegId: string) => {
    setKegiatan((prev) =>
      prev.map((k) => {
        if (k.id !== kegId) return k;
        const newPos: RkaBudgetItem = {
          id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          activity_id: k.id,
          kode_pos: `POS-${k.kode_kegiatan.replace(/\D/g, '') || '01'}-0${(k.budget_items || []).length + 1}`,
          nama_pos: 'Pos Anggaran Baru',
          kategori_pos: 'BELANJA_BARANG',
          volume: 1,
          satuan: 'Paket',
          harga_satuan: 0,
          nominal_anggaran: 0,
          sumber_dana: 'DANA_RUTIN_PRODI',
          is_active: true,
        };
        return { ...k, budget_items: [...(k.budget_items || []), newPos] };
      })
    );
  };

  const handleUpdatePos = (
    kegId: string,
    posId: string,
    patch: Partial<RkaBudgetItem>
  ) => {
    setKegiatan((prev) =>
      prev.map((k) => {
        if (k.id !== kegId) return k;
        return {
          ...k,
          budget_items: (k.budget_items || []).map((p) => {
            if (p.id !== posId) return p;
            const merged = { ...p, ...patch };
            if ('volume' in patch || 'harga_satuan' in patch) {
              merged.nominal_anggaran =
                (Number(merged.volume) || 0) * (Number(merged.harga_satuan) || 0);
            }
            return merged;
          }),
        };
      })
    );
  };

  const handleDeletePos = (kegId: string, posId: string) => {
    setKegiatan((prev) =>
      prev.map((k) =>
        k.id === kegId
          ? { ...k, budget_items: (k.budget_items || []).filter((p) => p.id !== posId) }
          : k
      )
    );
  };

  const handleSaveAndRatify = async (approveImmediately: boolean) => {
    if (!doc || !isKaprodi) return;
    setErrorMsg(null);

    if (doc.status === 'AKTIF' && !doc.versi_kerja_id) {
      const rev = await rkaService.startRevision(
        doc.tahun_anggaran,
        alasanRevisi.trim() || 'Revisi RKA melalui editor versi kerja',
        user.id,
        user.name
      );
      if (!rev.success) {
        setErrorMsg(rev.message);
        return;
      }
    }

    const saveRes = await rkaService.saveDraftActivities(doc.tahun_anggaran, kegiatan, {
      alasanRevisi,
      actorName: user.name,
    });
    if (!saveRes.success) {
      setErrorMsg(saveRes.message);
      return;
    }

    if (approveImmediately) {
      const appRes = await rkaService.approveRka(doc.tahun_anggaran, user.id, user.name);
      if (!appRes.success) {
        setErrorMsg(appRes.message);
        return;
      }
    }

    router.push(`/dashboard/rka/${doc.tahun_anggaran}`);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Memuat editor versi kerja...</div>;
  }

  if (!isKaprodi) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
        <div className="card p-8 text-center space-y-2">
          <Lock className="mx-auto text-slate-400" size={28} />
          <h2 className="text-base font-bold text-slate-800">Akses Terbatas (Kaprodi)</h2>
          <p className="text-xs text-slate-500">
            Hanya Kaprodi yang dapat menyusun, merevisi, dan mengesahkan pagu utama RKA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/rka/${tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {tahun || '2025'}
        </Link>
      </div>

      <PageHeader
        title={`Penyusunan Versi Kerja RKA ${tahun || '2025'}`}
        description="Penyusunan dan pengeditan draf pagu RKA. Total pagu dihitung otomatis dari seluruh pos anggaran."
        actions={
          <span className="text-xs text-slate-500">
            Total Pagu Otomatis:{' '}
            <strong className="text-blue-700 font-mono text-sm">{formatRupiah(totalPagu)}</strong>
          </span>
        }
      />

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <MotionCard index={0} interactive={false} className="card space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Alasan Revisi / Catatan Versi
        </label>
        <textarea
          rows={2}
          value={alasanRevisi}
          onChange={(e) => setAlasanRevisi(e.target.value)}
          placeholder="Tuliskan justifikasi perubahan kegiatan atau pos anggaran..."
          className="input-field text-xs resize-none"
        />
      </MotionCard>

      <div className="space-y-4">
        {kegiatan.map((k, idx) => {
          const subtotal = computeActivityTotal(k);
          return (
            <MotionCard key={k.id} index={idx} interactive={false} className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {k.kode_kegiatan}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{k.nama_kegiatan}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Indikator: {k.indikator_kinerja}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Subtotal Kegiatan</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-400 font-semibold uppercase">
                      <th className="py-2 px-2">Kode Pos</th>
                      <th className="py-2 px-2">Nama Pos</th>
                      <th className="py-2 px-2">Kategori</th>
                      <th className="py-2 px-2">Sumber Dana</th>
                      <th className="py-2 px-2 w-16">Vol</th>
                      <th className="py-2 px-2 w-20">Satuan</th>
                      <th className="py-2 px-2 w-28">Harga (Rp)</th>
                      <th className="py-2 px-2 text-right">Nominal</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(k.budget_items || []).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={p.kode_pos}
                            onChange={(e) => handleUpdatePos(k.id, p.id, { kode_pos: e.target.value })}
                            className="input-field py-1 px-2 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={p.nama_pos}
                            onChange={(e) => handleUpdatePos(k.id, p.id, { nama_pos: e.target.value })}
                            className="input-field py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={p.kategori_pos}
                            onChange={(e) =>
                              handleUpdatePos(k.id, p.id, {
                                kategori_pos: e.target.value as RkaBudgetCategory,
                              })
                            }
                            className="select-field py-1 px-2 text-xs"
                          >
                            {RKA_CATEGORY_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={p.sumber_dana}
                            onChange={(e) =>
                              handleUpdatePos(k.id, p.id, {
                                sumber_dana: e.target.value as RkaBudgetSource,
                              })
                            }
                            className="select-field py-1 px-2 text-xs"
                          >
                            {RKA_SOURCE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={1}
                            value={p.volume}
                            onChange={(e) =>
                              handleUpdatePos(k.id, p.id, { volume: Number(e.target.value) })
                            }
                            className="input-field py-1 px-2 text-xs text-center"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={p.satuan}
                            onChange={(e) => handleUpdatePos(k.id, p.id, { satuan: e.target.value })}
                            className="input-field py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            step={50000}
                            value={p.harga_satuan}
                            onChange={(e) =>
                              handleUpdatePos(k.id, p.id, { harga_satuan: Number(e.target.value) })
                            }
                            className="input-field py-1 px-2 text-xs font-mono text-right"
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                          {formatRupiah(p.nominal_anggaran)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePos(k.id, p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => handleAddPos(k.id)}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <Plus size={13} /> Tambah Pos Anggaran
              </button>
            </MotionCard>
          );
        })}
      </div>

      <MotionCard index={1} interactive={false} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
        <div>
          <div className="text-xs text-slate-500">Total Akumulasi Pagu RKA (Otomatis):</div>
          <div className="text-xl font-bold text-blue-700 font-mono">
            {formatRupiah(totalPagu)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSaveAndRatify(false)}
            className="btn-secondary text-xs px-4 py-2"
          >
            Simpan Sebagai Draf
          </button>
          <button
            type="button"
            onClick={() => handleSaveAndRatify(true)}
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Sahkan &amp; Aktifkan Versi
          </button>
        </div>
      </MotionCard>
    </div>
  );
}

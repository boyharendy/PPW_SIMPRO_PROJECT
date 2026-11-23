'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { tripService } from '@/lib/api';
import { useUser } from '@/lib/context';
import { useLecturers } from '@/lib/hooks/useLecturers';
import { apiClient } from '@/lib/api/client';
import { useBusinessTrips } from '@/lib/use-business-trips';
import type { BusinessTripCost, BusinessTripParticipant, TripCostComponent, TripFundingSource } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Save, Send } from 'lucide-react';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

const SUMBER_DANA: Array<{ value: TripFundingSource; label: string }> = [
  { value: 'RKA_PRODI', label: 'RKA Prodi' },
  { value: 'FAKULTAS', label: 'Fakultas' },
  { value: 'HIBAH', label: 'Hibah' },
  { value: 'MANDIRI', label: 'Mandiri' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const COST_LABELS: Array<{ key: TripCostComponent; label: string }> = [
  { key: 'TRANSPORTASI', label: 'Transportasi' },
  { key: 'AKOMODASI', label: 'Akomodasi' },
  { key: 'UANG_HARIAN', label: 'Uang Harian' },
  { key: 'LAINNYA', label: 'Lain-lain' },
];

function TripFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { user, currentRole } = useUser();
  const { trips } = useBusinessTrips(editId);

  const dosenProfiles = useLecturers();
  const [rkaBudgetItems, setRkaBudgetItems] = useState<{ id: string; kode_pos: string; nama_pos: string; sisa_anggaran: number }[]>([]);
  useEffect(() => {
    let active = true;
    apiClient.get<typeof rkaBudgetItems>('/trips/budget-options')
      .then(res => { if (active) setRkaBudgetItems(res.data ?? []); })
      .catch(() => { if (active) setErrorMsg('Daftar pos RKA belum tersedia.'); });
    return () => { active = false; };
  }, []);

  const editingTrip = useMemo(
    () => (editId ? trips.find((t) => t.id === editId) : undefined),
    [editId, trips]
  );

  const [pelaksanaId, setPelaksanaId] = useState('');
  const [anggotaIds, setAnggotaIds] = useState<string[]>([]);
  const [tujuan, setTujuan] = useState('');
  const [maksud, setMaksud] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState('');
  const [tglKembali, setTglKembali] = useState('');
  const [sumberDana, setSumberDana] = useState<TripFundingSource | ''>('');
  const [posRkaId, setPosRkaId] = useState('');
  const [biaya, setBiaya] = useState<Partial<Record<TripCostComponent, number>>>({});
  const [keteranganBiaya, setKeteranganBiaya] = useState<Record<TripCostComponent, string>>({
    TRANSPORTASI: '',
    AKOMODASI: '',
    UANG_HARIAN: '',
    LAINNYA: '',
  });

  const [initializedEditId, setInitializedEditId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default pelaksana untuk mode Dosen saat membuat pengajuan baru
  useEffect(() => {
    if (editId) return;
    if (!pelaksanaId && currentRole === 'DOSEN') {
      const matched = dosenProfiles.find((p) => p.id === user.id);
      if (matched) setPelaksanaId(matched.id);
    }
  }, [editId, currentRole, user.id, dosenProfiles, pelaksanaId]);

  // Isi form saat mode edit Draf / Perlu Revisi
  useEffect(() => {
    if (!editingTrip || initializedEditId === editingTrip.id) return;

    const lead = editingTrip.participants?.find((p) => p.peran === 'KETUA_ROMBONGAN');
    setPelaksanaId(lead?.user_id || editingTrip.diajukan_oleh || '');
    setAnggotaIds(
      (editingTrip.participants || [])
        .filter((p) => p.peran === 'ANGGOTA')
        .map((p) => p.user_id)
    );
    setTujuan(editingTrip.tujuan || '');
    setMaksud(editingTrip.maksud_kegiatan || '');
    setTglBerangkat(editingTrip.tanggal_berangkat || '');
    setTglKembali(editingTrip.tanggal_kembali || '');
    setSumberDana(editingTrip.sumber_dana || '');
    setPosRkaId(editingTrip.rka_budget_item_id || '');

    const nextBiaya: Partial<Record<TripCostComponent, number>> = {};
    const nextKet: Record<TripCostComponent, string> = {
      TRANSPORTASI: '',
      AKOMODASI: '',
      UANG_HARIAN: '',
      LAINNYA: '',
    };
    for (const c of editingTrip.costs || []) {
      nextBiaya[c.komponen] = c.estimasi_biaya || 0;
      nextKet[c.komponen] = c.keterangan || '';
    }
    setBiaya(nextBiaya);
    setKeteranganBiaya(nextKet);
    setInitializedEditId(editingTrip.id);
  }, [editingTrip, initializedEditId]);

  const totalBiaya = useMemo(
    () => Object.values(biaya).reduce<number>((sum, value) => sum + (value ?? 0), 0),
    [biaya]
  );

  const showPosRka = sumberDana === 'RKA_PRODI';
  const selectedBudgetItem = useMemo(
    () => rkaBudgetItems.find((b) => b.id === posRkaId),
    [rkaBudgetItems, posRkaId]
  );
  const sisaAnggaran = selectedBudgetItem?.sisa_anggaran ?? 0;
  const overBudget =
    showPosRka && Boolean(selectedBudgetItem) && totalBiaya > sisaAnggaran;

  const tooSoon = useMemo(() => {
    if (!tglBerangkat) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depart = new Date(tglBerangkat);
    depart.setHours(0, 0, 0, 0);
    return (depart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 3;
  }, [tglBerangkat]);

  const toggleAnggota = (id: string) => {
    setAnggotaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async (targetStatus: 'DRAF' | 'DIAJUKAN') => {
    setErrorMsg(null);

    if (!tujuan.trim() || !maksud.trim()) {
      setErrorMsg('Tujuan dan maksud kegiatan wajib diisi.');
      return;
    }

    if (targetStatus === 'DIAJUKAN') {
      if (!pelaksanaId) {
        setErrorMsg('Pelaksana utama perjalanan dinas wajib dipilih.');
        return;
      }
      if (!tglBerangkat || !tglKembali) {
        setErrorMsg('Tanggal berangkat dan tanggal kembali wajib diisi.');
        return;
      }
      if (new Date(tglKembali) < new Date(tglBerangkat)) {
        setErrorMsg('Tanggal kembali tidak boleh lebih awal dari tanggal berangkat.');
        return;
      }
      if (!sumberDana) {
        setErrorMsg('Sumber dana wajib dipilih sebelum mengajukan ke Kaprodi.');
        return;
      }
      if (sumberDana === 'RKA_PRODI' && !posRkaId) {
        setErrorMsg('Pos RKA wajib dipilih jika sumber dana berasal dari RKA Prodi.');
        return;
      }
      if (COST_LABELS.some(({ key }) => key !== 'LAINNYA' && biaya[key] === undefined)) {
        setErrorMsg('Isi setiap komponen biaya wajib. Masukkan 0 bila tidak ada biaya.');
        return;
      }
    }

    const tripId = editingTrip?.id || `trip-${Date.now()}`;
    const leadId = pelaksanaId || user.id;

    const participants: BusinessTripParticipant[] = [
      {
        id: `tp-${Date.now()}-lead`,
        trip_id: tripId,
        user_id: leadId,
        peran: 'KETUA_ROMBONGAN',
      },
      ...anggotaIds
        .filter((aid) => aid !== leadId)
        .map((aid, idx) => ({
          id: `tp-${Date.now()}-${idx}`,
          trip_id: tripId,
          user_id: aid,
          peran: 'ANGGOTA' as const,
        })),
    ];

    const costs: BusinessTripCost[] = COST_LABELS.filter(({ key }) => biaya[key] !== undefined).map((item, idx) => ({
      id: `tc-${Date.now()}-${idx}`,
      trip_id: tripId,
      komponen: item.key,
      keterangan: keteranganBiaya[item.key]?.trim() || undefined,
      estimasi_biaya: biaya[item.key] || 0,
    }));

    setIsSubmitting(true);
    try {
      const payload = {
        diajukan_oleh: leadId,
        tujuan: tujuan.trim(),
        maksud_kegiatan: maksud.trim(),
        tanggal_berangkat: tglBerangkat,
        tanggal_kembali: tglKembali,
        sumber_dana: (sumberDana || 'RKA_PRODI') as TripFundingSource,
        rka_budget_item_id: sumberDana === 'RKA_PRODI' ? posRkaId : undefined,
        status: targetStatus,
        participants,
        costs,
        updated_at: new Date().toISOString(),
      };

      if (editingTrip) {
        await tripService.updateTrip(editingTrip.id, payload);
      } else {
        await tripService.createTrip({ id: tripId, ...payload });
      }

      router.push('/dashboard/perjalanan-dinas');
    } catch {
      setErrorMsg('Gagal menyimpan rencana perjalanan dinas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/perjalanan-dinas"
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Daftar Perjalanan Dinas
        </Link>
      </div>

      <PageHeader
        title={editingTrip ? 'Perbarui Pengajuan Perjalanan Dinas' : 'Pengajuan Perjalanan Dinas'}
        description={
          currentRole === 'ADMIN_PRODI'
            ? 'Buat atau lengkapi pengajuan perjalanan dinas dosen untuk diajukan ke Kaprodi.'
            : 'Isi formulir rencana perjalanan dinas dan rincian estimasi biaya (FR-33).'
        }
      />

      {editingTrip?.status === 'PERLU_REVISI' && editingTrip.catatan_keputusan && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Catatan Revisi dari Kaprodi:</strong>
            <p className="mt-0.5">{editingTrip.catatan_keputusan}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Informasi Perjalanan */}
      <MotionCard index={0} interactive={false} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <WordRevealHeading as="h2" text="Informasi Perjalanan" className="text-lg font-semibold text-slate-800" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pelaksana Utama (Ketua Rombongan)
            </label>
            <select
              value={pelaksanaId}
              onChange={(e) => setPelaksanaId(e.target.value)}
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
                      onClick={() => toggleAnggota(d.id)}
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
              onChange={(e) => setTujuan(e.target.value)}
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
              onChange={(e) => setMaksud(e.target.value)}
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
              onChange={(e) => setTglBerangkat(e.target.value)}
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
              onChange={(e) => setTglKembali(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sumber Dana
            </label>
            <select
              value={sumberDana}
              onChange={(e) => setSumberDana(e.target.value as TripFundingSource | '')}
              className={inputCls}
            >
              <option value="">Pilih sumber dana</option>
              {SUMBER_DANA.map((s) => (
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
                onChange={(e) => setPosRkaId(e.target.value)}
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

      {/* Estimasi Biaya */}
      <MotionCard index={1} interactive={false} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <WordRevealHeading as="h2" text="Estimasi Biaya per Komponen" className="text-lg font-semibold text-slate-800" />
          <span className="text-xs text-slate-400">Wajib diisi ≥ 0 (NF-07)</span>
        </div>

        <div className="space-y-3">
          {COST_LABELS.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
            >
              <span className="text-sm font-medium text-slate-700 sm:col-span-3">
                {item.label}
              </span>
              <div className="sm:col-span-5">
                <input type="number" min="0" step="0.01" className="input-field" aria-label={'Estimasi ' + item.label}
                  value={biaya[item.key] ?? ''} placeholder="Rp"
                  onChange={e => {
                    const amount = e.target.valueAsNumber;
                    setBiaya(prev => ({ ...prev, [item.key]: Number.isFinite(amount) ? amount : undefined }));
                  }}
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={keteranganBiaya[item.key]}
                  onChange={(e) =>
                    setKeteranganBiaya((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  placeholder="Keterangan (opsional)"
                  className="input-field text-xs py-2"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-800">Total Estimasi</span>
          <span className="text-lg font-bold text-blue-700">{formatRupiah(totalBiaya)}</span>
        </div>

        {showPosRka && selectedBudgetItem && (
          <p className="text-xs text-slate-500">
            Sisa anggaran pos RKA ({selectedBudgetItem.kode_pos}):{' '}
            <span className={`font-semibold ${overBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatRupiah(sisaAnggaran)}
            </span>
          </p>
        )}
      </MotionCard>

      {/* Peringatan Kebijakan */}
      {(overBudget || tooSoon) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          {overBudget && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Total estimasi biaya <span className="font-semibold">melebihi sisa anggaran</span> pos RKA ({formatRupiah(sisaAnggaran)}).
              </p>
            </div>
          )}
          {tooSoon && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Tanggal keberangkatan <span className="font-semibold">kurang dari 3 hari</span> dari sekarang.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.back()}
          className="btn-secondary text-sm px-4 py-2"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave('DRAF')}
          className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-2"
        >
          <Save size={14} /> Simpan Draf
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave('DIAJUKAN')}
          className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
        >
          <Send size={14} /> Ajukan ke Kaprodi
        </button>
      </div>
    </div>
  );
}

export default function PengajuanPerjalananDinasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          Memuat formulir perjalanan dinas...
        </div>
      }
    >
      <TripFormContent />
    </Suspense>
  );
}

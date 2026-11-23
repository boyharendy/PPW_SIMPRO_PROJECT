'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import TripInfoSection from '@/components/perjalanan-dinas/TripInfoSection';
import TripCostEstimateSection, { TRIP_COST_LABELS } from '@/components/perjalanan-dinas/TripCostEstimateSection';
import { tripService } from '@/lib/api';
import { useUser } from '@/lib/context';
import { useLecturers } from '@/lib/hooks/useLecturers';
import { apiClient } from '@/lib/api/client';
import { useBusinessTrips } from '@/lib/use-business-trips';
import type { BusinessTripCost, BusinessTripParticipant, TripCostComponent, TripFundingSource } from '@/lib/types';
import { AlertCircle, AlertTriangle, ArrowLeft, Save, Send } from 'lucide-react';

const COST_LABELS = TRIP_COST_LABELS;

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
            : 'Isi formulir rencana perjalanan dinas dan rincian estimasi biaya.'
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

      <TripInfoSection
        inputCls={inputCls}
        dosenProfiles={dosenProfiles}
        pelaksanaId={pelaksanaId}
        anggotaIds={anggotaIds}
        tujuan={tujuan}
        maksud={maksud}
        tglBerangkat={tglBerangkat}
        tglKembali={tglKembali}
        sumberDana={sumberDana}
        showPosRka={showPosRka}
        posRkaId={posRkaId}
        rkaBudgetItems={rkaBudgetItems}
        onChangePelaksana={setPelaksanaId}
        onToggleAnggota={toggleAnggota}
        onChangeTujuan={setTujuan}
        onChangeMaksud={setMaksud}
        onChangeTglBerangkat={setTglBerangkat}
        onChangeTglKembali={setTglKembali}
        onChangeSumberDana={setSumberDana}
        onChangePosRka={setPosRkaId}
      />

      <TripCostEstimateSection
        biaya={biaya}
        keteranganBiaya={keteranganBiaya}
        onChangeBiaya={(key, val) => setBiaya((prev) => ({ ...prev, [key]: val }))}
        onChangeKeterangan={(key, val) =>
          setKeteranganBiaya((prev) => ({ ...prev, [key]: val }))
        }
        totalBiaya={totalBiaya}
        showPosRka={showPosRka}
        selectedBudgetItem={selectedBudgetItem}
        sisaAnggaran={sisaAnggaran}
        overBudget={overBudget}
        tooSoon={tooSoon}
      />

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

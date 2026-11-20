'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Lock, Plane, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import RkaRealizationModal from '@/components/rka/RkaRealizationModal';
import {
  buildRkaRealizationColumns,
  RkaRealizationSummaryCards,
} from '@/components/rka/RkaRealizationOverview';
import { rkaService, tripService } from '@/lib/api';
import { useUser } from '@/lib/context';
import { validateProofFile } from '@/lib/rka-utils';
import { getTripLeadName, getTripTotalRealisasi } from '@/lib/trip-utils';
import type {
  BusinessTrip,
  RkaActivity,
  RkaActivityExecutionStatus,
  RkaBudgetItem,
  RkaDocument,
  RkaRealization,
} from '@/lib/types';
import { formatRupiah, getStatusLabel } from '@/lib/utils';

type RealizationTab = 'ALL' | 'MANUAL' | 'PERJALANAN_DINAS';

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();
  const { user, currentRole } = useUser();

  const [allDocs, setAllDocs] = useState<RkaDocument[]>([]);
  const [doc, setDoc] = useState<RkaDocument | null>(null);
  const [realizations, setRealizations] = useState<RkaRealization[]>([]);
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RealizationTab>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [tanggalRealisasi, setTanggalRealisasi] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [nominal, setNominal] = useState<string>('1000000');
  const [statusPelaksanaan, setStatusPelaksanaan] =
    useState<RkaActivityExecutionStatus>('BERJALAN');
  const [uraian, setUraian] = useState('');
  const [proofFileMeta, setProofFileMeta] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [listRes, docRes, tripRes] = await Promise.all([
        rkaService.getRkaList(),
        rkaService.getRkaByYear(tahun || '2025'),
        tripService.getTrips(),
      ]);
      const docs = listRes.data || [];
      setAllDocs(docs);
      const currentDoc = docRes.data || docs[0] || null;
      setDoc(currentDoc);
      const loadedTrips = tripRes.data || [];
      setTrips(loadedTrips);

      if (currentDoc) {
        const realRes = await rkaService.getRealizationsByYear(currentDoc.tahun_anggaran);
        setRealizations(realRes.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('simpro_storage_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('simpro_storage_change', handleSync);
    };
  }, [loadData]);

  const activities = useMemo(() => doc?.activities || [], [doc]);

  const posLookup = useMemo(() => {
    const map = new Map<string, { activity: RkaActivity; item: RkaBudgetItem }>();
    for (const act of activities) {
      for (const item of act.budget_items || []) {
        map.set(item.id, { activity: act, item });
      }
    }
    return map;
  }, [activities]);

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActivityId) || activities[0],
    [activities, selectedActivityId]
  );

  const availablePosItems = useMemo(
    () => selectedActivity?.budget_items || [],
    [selectedActivity]
  );

  const selectedPosItem = useMemo(
    () => availablePosItems.find((b) => b.id === selectedPosId) || availablePosItems[0],
    [availablePosItems, selectedPosId]
  );

  const openAddModal = () => {
    const firstAct = activities[0];
    setSelectedActivityId(firstAct?.id || '');
    setSelectedPosId(firstAct?.budget_items?.[0]?.id || '');
    setStatusPelaksanaan(
      firstAct?.status_pelaksanaan === 'TERLAKSANA'
        ? 'TERLAKSANA'
        : 'BERJALAN'
    );
    setTanggalRealisasi(new Date().toISOString().split('T')[0]);
    setNominal('');
    setUraian('');
    setProofFileMeta(null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleActivityChange = (actId: string) => {
    setSelectedActivityId(actId);
    const act = activities.find((a) => a.id === actId);
    setSelectedPosId(act?.budget_items?.[0]?.id || '');
    if (act) {
      setStatusPelaksanaan(act.status_pelaksanaan);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setProofFileMeta(null);
      return;
    }

    const check = validateProofFile(file);
    if (!check.valid) {
      setFormError(check.error || 'Format berkas tidak valid.');
      e.target.value = '';
      setProofFileMeta(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofFileMeta({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: typeof reader.result === 'string' && file.size <= 1024 * 1024 ? reader.result : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddRealization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    setFormError(null);

    const nominalNum = Number(nominal);
    if (!selectedPosId) {
      setFormError('Pilih pos anggaran RKA terlebih dahulu.');
      return;
    }
    if (!nominalNum || nominalNum <= 0) {
      setFormError('Nominal realisasi harus lebih besar dari Rp 0.');
      return;
    }
    if (!uraian.trim()) {
      setFormError('Uraian pengeluaran wajib diisi.');
      return;
    }
    if (!proofFileMeta) {
      setFormError('Unggah bukti pengeluaran (PDF, JPG, PNG, DOCX, atau XLSX).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rkaService.addRealization(doc.tahun_anggaran, {
        rka_budget_item_id: selectedPosId,
        activity_id: selectedActivity?.id,
        tanggal_realisasi: tanggalRealisasi,
        nominal_realisasi: nominalNum,
        uraian: uraian.trim(),
        sumber_pencatatan: 'MANUAL',
        nama_berkas_bukti: proofFileMeta.name,
        mime_type_bukti: proofFileMeta.type,
        ukuran_berkas_bukti: proofFileMeta.size,
        data_url_bukti: proofFileMeta.dataUrl,
        status_pelaksanaan: statusPelaksanaan,
        dicatat_oleh: user.id,
        actorName: user.name,
        actorRole: currentRole,
      });

      if (res.success) {
        setModalOpen(false);
        setToastMsg('Realisasi anggaran & status kegiatan berhasil dicatat.');
        setTimeout(() => setToastMsg(null), 4000);
        await loadData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const manualList = useMemo(
    () => realizations.filter((r) => r.sumber_pencatatan === 'MANUAL'),
    [realizations]
  );

  const tripLinkedList = useMemo(
    () => realizations.filter((r) => r.sumber_pencatatan === 'PERJALANAN_DINAS'),
    [realizations]
  );

  const pendingLinkedTrips = useMemo(
    () =>
      trips.filter(
        (t) =>
          t.sumber_dana === 'RKA_PRODI' &&
          t.rka_budget_item_id &&
          posLookup.has(t.rka_budget_item_id) &&
          (t.status === 'DISETUJUI' || t.status === 'DILAPORKAN')
      ),
    [trips, posLookup]
  );

  const filteredList = useMemo(() => {
    if (activeTab === 'MANUAL') return manualList;
    if (activeTab === 'PERJALANAN_DINAS') return tripLinkedList;
    return realizations;
  }, [activeTab, realizations, manualList, tripLinkedList]);

  const totalRealisasi = realizations.reduce((s, r) => s + (Number(r.nominal_realisasi) || 0), 0);
  const totalManual = manualList.reduce((s, r) => s + (Number(r.nominal_realisasi) || 0), 0);
  const totalTrip = tripLinkedList.reduce((s, r) => s + (Number(r.nominal_realisasi) || 0), 0);

  const canRecord = doc?.status === 'AKTIF';

  const columns = useMemo(() => buildRkaRealizationColumns(posLookup), [posLookup]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/dashboard/rka/${doc?.tahun_anggaran || tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke Detail RKA {doc?.tahun_anggaran || tahun || '2025'}
        </Link>

        {/* Switcher Tahun Anggaran */}
        {allDocs.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Tahun RKA:</span>
            <select
              value={doc?.tahun_anggaran ?? Number(tahun || 2025)}
              onChange={(e) => router.push(`/dashboard/rka/${e.target.value}/realisasi`)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {allDocs.map((d) => (
                <option key={d.id} value={d.tahun_anggaran}>
                  TA {d.tahun_anggaran} ({getStatusLabel(d.status)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <PageHeader
        title={`Realisasi Anggaran RKA ${doc?.tahun_anggaran || tahun || '2025'}`}
        description="Pencatatan realisasi belanja per butir kegiatan (Admin Prodi & Kaprodi) serta sinkronisasi otomatis dari Modul Perjalanan Dinas."
        badge={doc ? <StatusBadge status={doc.status} size="sm" /> : undefined}
        actions={
          <button
            type="button"
            disabled={!canRecord || activities.length === 0}
            onClick={openAddModal}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canRecord ? 'Realisasi hanya dapat dicatat pada RKA berstatus Aktif' : undefined}
          >
            <Plus size={14} /> Catat Realisasi Baru
          </button>
        }
      />

      {toastMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {doc && !canRecord && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
          <Lock size={15} className="shrink-0 text-amber-600" />
          <span>
            Dokumen RKA TA {doc.tahun_anggaran} berstatus <strong>{getStatusLabel(doc.status)}</strong>.
            Pencatatan realisasi baru hanya aktif untuk RKA berstatus <strong>Aktif</strong>.
          </span>
        </div>
      )}

      <RkaRealizationSummaryCards
        totalPagu={doc?.total_anggaran || 0}
        totalRealisasi={totalRealisasi}
        realizationCount={realizations.length}
        totalManual={totalManual}
        manualCount={manualList.length}
        totalTrip={totalTrip}
        tripCount={tripLinkedList.length}
      />

      {/* Tabs & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Realisasi ({realizations.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MANUAL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'MANUAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input Manual ({manualList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PERJALANAN_DINAS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'PERJALANAN_DINAS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plane size={13} /> Realisasi Tertaut dari Perjalanan Dinas ({tripLinkedList.length})
            </button>
          </div>
        </div>

        {activeTab === 'PERJALANAN_DINAS' && (
          <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-3.5 text-xs text-purple-900 space-y-2">
            <p className="leading-relaxed">
              <strong>Integrasi Otomatis Perjalanan Dinas:</strong> Setiap pengajuan Perjalanan Dinas
              yang memakai sumber dana <strong>RKA Prodi</strong> dan telah berstatus <strong>Selesai</strong> (laporan
              &amp; bukti diverifikasi lengkap) otomatis tertarik menambah Realisasi Berjalan pada pos RKA terkait tanpa input ganda.
            </p>
            {pendingLinkedTrips.length > 0 && (
              <div className="pt-2 border-t border-purple-200/70">
                <span className="font-semibold block mb-1">
                  Perjalanan Dinas Tertaut yang Menunggu Penyelesaian Laporan ({pendingLinkedTrips.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {pendingLinkedTrips.map((t) => (
                    <Link
                      key={t.id}
                      href={`/dashboard/perjalanan-dinas/${t.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100/50 text-[11px]"
                    >
                      <span>{t.tujuan} ({getTripLeadName(t)})</span>
                      <span className="font-mono font-bold">
                        {formatRupiah(getTripTotalRealisasi(t) || 0)}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Memuat data realisasi...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredList}
            emptyMessage="Belum ada transaksi realisasi pada kategori ini."
          />
        )}
      </div>

      <RkaRealizationModal
        open={modalOpen}
        tahunLabel={doc?.tahun_anggaran || tahun || '2025'}
        formError={formError}
        tanggalRealisasi={tanggalRealisasi}
        statusPelaksanaan={statusPelaksanaan}
        activities={activities}
        selectedActivityId={selectedActivity?.id || ''}
        availablePosItems={availablePosItems}
        selectedPosItem={selectedPosItem}
        nominal={nominal}
        uraian={uraian}
        proofFileMeta={proofFileMeta}
        isSubmitting={isSubmitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddRealization}
        onChangeTanggal={setTanggalRealisasi}
        onChangeStatus={setStatusPelaksanaan}
        onChangeActivity={handleActivityChange}
        onChangePos={setSelectedPosId}
        onChangeNominal={setNominal}
        onChangeUraian={setUraian}
        onFileChange={handleFileChange}
      />
    </div>
  );
}

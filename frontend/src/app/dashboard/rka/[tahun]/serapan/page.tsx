'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Layers,
  ListChecks,
  PieChart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import RkaSerapanTable, {
  type CategoryAggregation,
  type QuarterAggregation,
  type SerapanViewDimension,
} from '@/components/rka/RkaSerapanViews';
import { rkaService } from '@/lib/api';
import { useUser } from '@/lib/context';
import {
  computeActivityTotal,
  downloadSerapanExcel,
  evaluateActivityMonitoring,
  getActivityQuarters,
  getCurrentQuarterInfo,
  getQuarterFromDate,
  RKA_CATEGORY_OPTIONS,
  RKA_QUARTERS,
} from '@/lib/rka-utils';
import type {
  RkaBudgetCategory,
  RkaDocument,
  RkaQuarter,
  RkaRealization,
} from '@/lib/types';
import {
  calculateAbsorptionPercentage,
  formatRupiah,
  getStatusLabel,
} from '@/lib/utils';

export default function Page() {
  const { tahun } = useParams<{ tahun: string }>();
  const router = useRouter();
  const { currentRole } = useUser();
  const isKaprodi = currentRole === 'KAPRODI';

  const [allDocs, setAllDocs] = useState<RkaDocument[]>([]);
  const [doc, setDoc] = useState<RkaDocument | null>(null);
  const [realizations, setRealizations] = useState<RkaRealization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewDimension, setViewDimension] = useState<SerapanViewDimension>('KEGIATAN');
  const [filterTW, setFilterTW] = useState<'ALL' | RkaQuarter>('ALL');

  const systemQuarter = useMemo(() => getCurrentQuarterInfo(), []);
  const [simQuarter, setSimQuarter] = useState<'AUTO' | RkaQuarter>('AUTO');

  const effectiveReference = useMemo(() => {
    const rkaYear = doc?.tahun_anggaran || Number(tahun || 2025);
    if (simQuarter === 'AUTO') {
      return {
        year: systemQuarter.year,
        quarter: systemQuarter.quarter,
        label: `${systemQuarter.quarterLabel} ${systemQuarter.year} (Kalender Sistem)`,
      };
    }
    const qNum = Number(simQuarter.slice(2)) as 1 | 2 | 3 | 4;
    return {
      year: rkaYear,
      quarter: qNum,
      label: `${simQuarter} ${rkaYear} (Simulasi)`,
    };
  }, [simQuarter, systemQuarter, doc?.tahun_anggaran, tahun]);

  const loadData = useCallback(async () => {
    try {
      const [listRes, docRes] = await Promise.all([
        rkaService.getRkaList(),
        rkaService.getRkaByYear(tahun || '2025'),
      ]);
      const docs = listRes.data || [];
      setAllDocs(docs);
      const currentDoc = docRes.data || docs[0] || null;
      setDoc(currentDoc);
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

  // Filter kegiatan berdasarkan Triwulan jika dipilih
  const filteredActivities = useMemo(() => {
    if (filterTW === 'ALL') return activities;
    return activities.filter((a) => getActivityQuarters(a).includes(filterTW));
  }, [activities, filterTW]);

  // Agregasi Dimensi 2: Per Kategori Pos Anggaran (FR-38)
  const byCategory: CategoryAggregation[] = useMemo(() => {
    const buckets = new Map<RkaBudgetCategory, CategoryAggregation>();
    for (const opt of RKA_CATEGORY_OPTIONS) {
      buckets.set(opt.value, {
        kategori: opt.value,
        label: opt.label,
        jumlahPos: 0,
        pagu: 0,
        realisasi: 0,
        sisa: 0,
        pct: 0,
        items: [],
      });
    }

    for (const act of filteredActivities) {
      for (const item of act.budget_items || []) {
        const bucket = buckets.get(item.kategori_pos) || buckets.get('LAINNYA')!;
        const pagu = item.nominal_anggaran || 0;
        const real = item.realisasi_total || 0;
        bucket.jumlahPos += 1;
        bucket.pagu += pagu;
        bucket.realisasi += real;
        bucket.items.push({
          ...item,
          kodeKegiatan: act.kode_kegiatan,
          namaKegiatan: act.nama_kegiatan,
        });
      }
    }

    return Array.from(buckets.values())
      .filter((b) => b.jumlahPos > 0)
      .map((b) => ({
        ...b,
        sisa: b.pagu - b.realisasi,
        pct: calculateAbsorptionPercentage(b.realisasi, b.pagu),
      }));
  }, [filteredActivities]);

  // Agregasi Dimensi 3: Per Triwulan (TW1–TW4)
  const byQuarter: QuarterAggregation[] = useMemo(() => {
    const rkaYear = doc?.tahun_anggaran || Number(tahun || 2025);
    return RKA_QUARTERS.map((tw) => {
      const twActivities = activities.filter((a) => getActivityQuarters(a).includes(tw));
      // Distribusi pagu kegiatan secara proporsional ke triwulan yang dijadwalkan agar penjumlahan TW1-TW4 akurat
      const pagu = twActivities.reduce((sum, a) => {
        const qs = getActivityQuarters(a);
        return sum + Math.round(computeActivityTotal(a) / Math.max(1, qs.length));
      }, 0);
      const realisasi = realizations
        .filter((r) => getQuarterFromDate(r.tanggal_realisasi) === tw)
        .reduce((sum, r) => sum + (Number(r.nominal_realisasi) || 0), 0);
      const lateCount = twActivities.filter((a) => {
        const evalRes = evaluateActivityMonitoring(
          a,
          rkaYear,
          effectiveReference.year,
          effectiveReference.quarter
        );
        return evalRes.isUnexecutedOverdue || evalRes.isInProgressOverdue;
      }).length;

      return {
        tw,
        jumlahKegiatan: twActivities.length,
        kegiatanTerlambat: lateCount,
        pagu,
        realisasi,
        pct: calculateAbsorptionPercentage(realisasi, pagu),
        kegiatanList: twActivities.map((a) => a.kode_kegiatan),
      };
    });
  }, [activities, realizations, doc?.tahun_anggaran, tahun, effectiveReference]);

  // Total ringkasan (mengikuti filter TW bila dipilih, atau keseluruhan RKA)
  const totalPagu = useMemo(
    () => filteredActivities.reduce((s, a) => s + computeActivityTotal(a), 0),
    [filteredActivities]
  );
  const totalRealisasi = useMemo(
    () => filteredActivities.reduce((s, a) => s + (a.total_realisasi || 0), 0),
    [filteredActivities]
  );
  const pctTotal = calculateAbsorptionPercentage(totalRealisasi, totalPagu);

  const alertCounts = useMemo(() => {
    const rkaYear = doc?.tahun_anggaran || Number(tahun || 2025);
    let overBudget = 0;
    let unexecutedOverdue = 0;
    for (const act of activities) {
      const m = evaluateActivityMonitoring(
        act,
        rkaYear,
        effectiveReference.year,
        effectiveReference.quarter
      );
      if (m.isOverBudget) overBudget++;
      if (m.isUnexecutedOverdue) unexecutedOverdue++;
    }
    return { overBudget, unexecutedOverdue };
  }, [activities, doc?.tahun_anggaran, tahun, effectiveReference]);

  const handleExport = (format: 'xlsx' | 'pdf') => {
    if (!doc || !isKaprodi) return;
    if (format === 'xlsx') {
      downloadSerapanExcel({
        tahun: String(doc.tahun_anggaran),
        judul: doc.judul,
        activities,
        byCategory,
        byQuarter,
      });
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/dashboard/rka/${doc?.tahun_anggaran || tahun || '2025'}`}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} /> Kembali ke RKA {doc?.tahun_anggaran || tahun || '2025'}
        </Link>

        {/* Switcher Tahun & Referensi Triwulan */}
        <div className="flex items-center gap-2 flex-wrap">
          {allDocs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Tahun RKA:</span>
              <select
                value={doc?.tahun_anggaran ?? Number(tahun || 2025)}
                onChange={(e) => router.push(`/dashboard/rka/${e.target.value}/serapan`)}
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

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <CalendarClock size={13} className="text-blue-600" />
            <span className="text-slate-500 font-medium">Acuan Triwulan:</span>
            <select
              value={simQuarter}
              onChange={(e) => setSimQuarter(e.target.value as 'AUTO' | RkaQuarter)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="AUTO">
                Kalender Sistem ({systemQuarter.quarterLabel} {systemQuarter.year})
              </option>
              {RKA_QUARTERS.map((tw) => (
                <option key={tw} value={tw}>
                  Simulasi {tw} {doc?.tahun_anggaran || tahun}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <PageHeader
        title={`Monitoring Serapan Anggaran RKA ${doc?.tahun_anggaran || tahun || '2025'}`}
        description={`Analisis persentase serapan dalam 3 dimensi (Per Kegiatan, Per Pos Anggaran, Per Triwulan) dengan acuan ${effectiveReference.label}.`}
        badge={doc ? <StatusBadge status={doc.status} size="sm" /> : undefined}
        actions={
          isKaprodi ? (
            <ExportMenu
              onExport={handleExport}
              filename={`serapan-rka-${doc?.tahun_anggaran || tahun || '2025'}`}
            />
          ) : undefined
        }
      />

      {/* Alert Ringkasan Over-Pagu & Belum Terlaksana */}
      {(alertCounts.overBudget > 0 || alertCounts.unexecutedOverdue > 0) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            <span>Peringatan Serapan &amp; Jadwal:</span>
          </div>
          {alertCounts.overBudget > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-rose-200 font-semibold text-rose-700">
              {alertCounts.overBudget} kegiatan Over-Pagu (&gt; 100%)
            </span>
          )}
          {alertCounts.unexecutedOverdue > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-rose-200 font-semibold text-rose-700">
              {alertCounts.unexecutedOverdue} kegiatan Belum Terlaksana (Melewati Jadwal)
            </span>
          )}
        </div>
      )}

      {/* 3 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={filterTW === 'ALL' ? 'Total Pagu Aktif' : `Pagu Terjadwal (${filterTW})`}
          value={formatRupiah(totalPagu)}
          subtitle={`${filteredActivities.length} kegiatan ditampilkan`}
          badgeTone="blue"
          icon={<Wallet size={16} />}
        />
        <StatCard
          title="Total Realisasi Belanja"
          value={formatRupiah(totalRealisasi)}
          subtitle={
            totalPagu >= totalRealisasi
              ? `Sisa pagu: ${formatRupiah(totalPagu - totalRealisasi)}`
              : `Melebihi pagu: ${formatRupiah(totalRealisasi - totalPagu)}`
          }
          badgeTone={totalRealisasi > totalPagu ? 'rose' : 'emerald'}
          icon={<PieChart size={16} />}
        />
        <StatCard
          title="Persentase Serapan Pagu"
          value={`${pctTotal}%`}
          subtitle="Kalkulasi aktual tanpa clamping"
          badgeTone={pctTotal > 100 ? 'rose' : pctTotal >= 50 ? 'emerald' : 'amber'}
          badgeText={pctTotal > 100 ? 'Over-Pagu' : pctTotal >= 50 ? 'Baik' : 'Perlu Dorongan'}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* View Switcher (3 Dimensi FR-38) + Filter Triwulan + Tabel */}
      <div className="card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Switcher 3 Dimensi */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 flex-wrap">
            <button
              type="button"
              onClick={() => setViewDimension('KEGIATAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                viewDimension === 'KEGIATAN'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks size={13} /> Per Kegiatan
            </button>
            <button
              type="button"
              onClick={() => setViewDimension('POS_ANGGARAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                viewDimension === 'POS_ANGGARAN'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} /> Per Pos Anggaran
            </button>
            <button
              type="button"
              onClick={() => setViewDimension('TRIWULAN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors ${
                viewDimension === 'TRIWULAN'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarClock size={13} /> Per Triwulan
            </button>
          </div>

          {/* Filter Triwulan (untuk Per Kegiatan & Per Pos Anggaran) */}
          {viewDimension !== 'TRIWULAN' && (
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start lg:self-auto">
              {(['ALL', 'TW1', 'TW2', 'TW3', 'TW4'] as const).map((tw) => (
                <button
                  key={tw}
                  type="button"
                  onClick={() => setFilterTW(tw)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    filterTW === tw
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tw === 'ALL' ? 'Semua Triwulan' : tw}
                </button>
              ))}
            </div>
          )}
        </div>

        <RkaSerapanTable
          isLoading={isLoading}
          viewDimension={viewDimension}
          filteredActivities={filteredActivities}
          byCategory={byCategory}
          byQuarter={byQuarter}
          rkaYear={doc?.tahun_anggaran || Number(tahun || 2025)}
          referenceYear={effectiveReference.year}
          referenceQuarter={effectiveReference.quarter}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Plane,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBusinessTrips } from '@/lib/use-business-trips';
import {
  getTripLeadName,
  getTripTotalEstimasi,
  getTripTotalRealisasi,
  isTripIncomplete,
  isTripLateReport,
  isTripOverEstimate,
} from '@/lib/trip-utils';
import type { BusinessTrip } from '@/lib/types';
import { formatDateShort, formatRupiah } from '@/lib/utils';

type RecapFilter = 'ALL' | 'ATTENTION' | 'OVER_ESTIMATE' | 'COMPLETE';

export default function RekapPerjalananDinasPage() {
  const { trips } = useBusinessTrips();
  const [filterFlag, setFilterFlag] = useState<RecapFilter>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Rekapitulasi fokus pada perjalanan yang disetujui, dilaporkan, atau selesai
  const recapBaseTrips = useMemo(
    () =>
      trips.filter(
        (t) =>
          t.status === 'DISETUJUI' ||
          t.status === 'DILAPORKAN' ||
          t.status === 'SELESAI'
      ),
    [trips]
  );

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const t of recapBaseTrips) {
      if (t.tanggal_berangkat) set.add(t.tanggal_berangkat.slice(0, 4));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [recapBaseTrips]);

  const yearFiltered = useMemo(
    () =>
      selectedYear === 'ALL'
        ? recapBaseTrips
        : recapBaseTrips.filter((t) => t.tanggal_berangkat?.startsWith(selectedYear)),
    [recapBaseTrips, selectedYear]
  );

  const filteredTrips = useMemo(() => {
    if (filterFlag === 'ALL') return yearFiltered;
    if (filterFlag === 'ATTENTION') {
      return yearFiltered.filter((t) => isTripIncomplete(t) || isTripLateReport(t));
    }
    if (filterFlag === 'OVER_ESTIMATE') {
      return yearFiltered.filter((t) => isTripOverEstimate(t));
    }
    return yearFiltered.filter(
      (t) => !isTripIncomplete(t) && !isTripLateReport(t) && t.status === 'SELESAI'
    );
  }, [yearFiltered, filterFlag]);

  const summary = useMemo(() => {
    const totalEstimasi = yearFiltered.reduce((sum, t) => sum + getTripTotalEstimasi(t), 0);
    const totalRealisasi = yearFiltered.reduce((sum, t) => sum + getTripTotalRealisasi(t), 0);
    const diff = totalEstimasi - totalRealisasi;
    const efficiencyPct =
      totalEstimasi > 0 && totalRealisasi > 0
        ? Math.round(((totalEstimasi - totalRealisasi) / totalEstimasi) * 1000) / 10
        : 0;
    const attentionCount = yearFiltered.filter(
      (t) => isTripIncomplete(t) || isTripLateReport(t) || isTripOverEstimate(t)
    ).length;

    return {
      totalCount: yearFiltered.length,
      totalEstimasi,
      totalRealisasi,
      diff,
      efficiencyPct,
      attentionCount,
    };
  }, [yearFiltered]);

  const columns: DataTableColumn<BusinessTrip>[] = [
    {
      key: 'pelaksana',
      header: 'Pelaksana & Tujuan',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">{getTripLeadName(r)}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Tujuan: <strong>{r.tujuan}</strong> &bull; {formatDateShort(r.tanggal_berangkat)} –{' '}
            {formatDateShort(r.tanggal_kembali)}
          </div>
        </div>
      ),
    },
    {
      key: 'noST',
      header: 'No. Surat Tugas',
      render: (r) => (
        <span className="text-xs font-mono text-slate-600">
          {r.nomor_surat_tugas || '-'}
        </span>
      ),
    },
    {
      key: 'estimasi',
      header: 'Estimasi Biaya',
      render: (r) => (
        <span className="text-xs text-slate-600">{formatRupiah(getTripTotalEstimasi(r))}</span>
      ),
    },
    {
      key: 'realisasi',
      header: 'Realisasi Riil',
      render: (r) => {
        const real = getTripTotalRealisasi(r);
        return (
          <span className="text-xs text-slate-800 font-medium">
            {real > 0 ? formatRupiah(real) : '-'}
          </span>
        );
      },
    },
    {
      key: 'selisih',
      header: 'Efisiensi / Selisih',
      render: (r) => {
        const est = getTripTotalEstimasi(r);
        const real = getTripTotalRealisasi(r);
        if (real <= 0) return <span className="text-xs text-slate-400">-</span>;
        const diff = est - real;
        return (
          <span className={`text-xs font-medium ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {diff >= 0 ? `+ ${formatRupiah(diff)}` : `- ${formatRupiah(Math.abs(diff))}`}
          </span>
        );
      },
    },
    {
      key: 'penanda',
      header: 'Kelengkapan',
      render: (r) => {
        const incomplete = isTripIncomplete(r);
        const late = isTripLateReport(r);
        const over = isTripOverEstimate(r);
        if (!incomplete && !late && !over) {
          return r.status === 'SELESAI' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={11} /> Lengkap &amp; Sesuai
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Menunggu Laporan</span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {incomplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} /> Belum Lengkap
              </span>
            )}
            {late && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <Clock size={10} /> Terlambat
              </span>
            )}
            {over && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <AlertCircle size={10} /> &gt; Estimasi
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <Link
          href={`/dashboard/perjalanan-dinas/${r.id}`}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} /> Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Perjalanan Dinas"
        description="Rekapitulasi pelaksanaan, perbandingan estimasi vs realisasi biaya, dan penandaan kelengkapan bukti perjalanan dinas."
        actions={<ExportMenu filename="rekap-perjalanan-dinas" />}
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Perjalanan"
          value={`${summary.totalCount} Perjalanan`}
          subtitle="Disetujui, dilaporkan & selesai"
          badgeTone="blue"
          icon={<Plane size={16} />}
        />
        <StatCard
          title="Total Estimasi Pagu"
          value={formatRupiah(summary.totalEstimasi)}
          subtitle="Alokasi pagu usulan"
          badgeTone="slate"
          icon={<Wallet size={16} />}
        />
        <StatCard
          title="Total Realisasi Riil"
          value={formatRupiah(summary.totalRealisasi)}
          subtitle={
            summary.totalRealisasi > 0
              ? `Efisiensi ${summary.efficiencyPct}% • ${
                  summary.diff >= 0 ? 'Hemat' : 'Lebih'
                } ${formatRupiah(Math.abs(summary.diff))}`
              : 'Belum ada realisasi tercatat'
          }
          badgeTone="emerald"
          icon={<TrendingDown size={16} />}
        />
        <StatCard
          title="Perlu Perhatian"
          value={summary.attentionCount}
          subtitle="Belum lengkap / terlambat / over"
          badgeTone={summary.attentionCount > 0 ? 'amber' : 'emerald'}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { key: 'ALL' as const, label: 'Semua' },
            { key: 'ATTENTION' as const, label: 'Belum Lengkap / Terlambat' },
            { key: 'OVER_ESTIMATE' as const, label: 'Melebihi Estimasi' },
            { key: 'COMPLETE' as const, label: 'Lengkap & Selesai' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterFlag(item.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterFlag === item.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 w-fit"
        >
          <option value="ALL">Semua Periode / Tahun</option>
          {years.map((y) => (
            <option key={y} value={y}>
              Tahun {y}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filteredTrips}
          emptyMessage="Belum ada data rekap perjalanan dinas untuk filter ini."
        />
      </div>
    </div>
  );
}

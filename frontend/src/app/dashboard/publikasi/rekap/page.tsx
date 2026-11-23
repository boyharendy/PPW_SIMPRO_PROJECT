'use client';

import React, { useState } from 'react';
import { BookOpen, Award, Users, FileCheck, Layers, Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

interface RecapRow {
  tahun: number;
  jurnal: number;
  prosiding: number;
  buku: number;
  hki: number;
  total: number;
  melibatkanMhs: number;
}

const MOCK_RECAP_YEARS: RecapRow[] = [
  { tahun: 2025, jurnal: 16, prosiding: 9, buku: 2, hki: 4, total: 31, melibatkanMhs: 14 },
  { tahun: 2024, jurnal: 12, prosiding: 7, buku: 3, hki: 2, total: 24, melibatkanMhs: 10 },
  { tahun: 2023, jurnal: 10, prosiding: 6, buku: 1, hki: 1, total: 18, melibatkanMhs: 7 },
];

export default function Page() {
  const [selectedYear, setSelectedYear] = useState('2025');

  const columns: DataTableColumn<RecapRow>[] = [
    {
      key: 'tahun',
      header: 'Tahun',
      render: (r) => <span className="font-bold text-slate-800 text-sm">{r.tahun}</span>,
    },
    {
      key: 'jurnal',
      header: 'Jurnal Ilmiah',
      render: (r) => <span className="text-sm text-slate-700">{r.jurnal}</span>,
    },
    {
      key: 'prosiding',
      header: 'Prosiding Konferensi',
      render: (r) => <span className="text-sm text-slate-700">{r.prosiding}</span>,
    },
    {
      key: 'buku',
      header: 'Buku Ajar / Monograf',
      render: (r) => <span className="text-sm text-slate-700">{r.buku}</span>,
    },
    {
      key: 'hki',
      header: 'HKI / Hak Cipta',
      render: (r) => <span className="text-sm text-slate-700">{r.hki}</span>,
    },
    {
      key: 'melibatkanMhs',
      header: 'Melibatkan Mahasiswa',
      render: (r) => (
        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {r.melibatkanMhs} Karya
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total Capaian',
      render: (r) => <span className="font-bold text-slate-900 text-sm">{r.total}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Publikasi"
        description="Rekapitulasi capaian publikasi tahunan dan pemetaan target luaran akreditasi program studi."
        actions={<ExportMenu filename="rekap-publikasi-prodi" />}
      />

      {/* 4 StatCards - Komposisi Seragam & Selaras Simetris */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          animationIndex={0}
          title="Total Publikasi 2025"
          value="31 Karya"
          subtitle="+29% YoY • Tercatat & Terverifikasi"
          badgeTone="blue"
          icon={<BookOpen size={16} />}
        />
        <StatCard
          animationIndex={1}
          title="Terindeks Scopus & SINTA"
          value="25 Karya"
          subtitle="80.6% Bereputasi • Akreditasi Unggul"
          badgeTone="emerald"
          icon={<Award size={16} />}
        />
        <StatCard
          animationIndex={2}
          title="Melibatkan Mahasiswa"
          value="14 Karya"
          subtitle="Kolaborasi Riset Dosen-Mahasiswa"
          badgeTone="indigo"
          icon={<Users size={16} />}
        />
        <StatCard
          animationIndex={3}
          title="HKI & Paten"
          value="4 Terdaftar"
          subtitle="Perlindungan Kekayaan Intelektual"
          badgeTone="slate"
          icon={<FileCheck size={16} />}
        />
      </div>

      {/* Distribusi per Peringkat & Jenis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MotionCard index={0} interactive className="card">
          <WordRevealHeading
            as="h3"
            text="Distribusi Jenis Publikasi (2025)"
            className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3"
          />
          <div className="space-y-3">
            {[
              { label: 'Jurnal Nasional & Internasional', count: 16, pct: 51.6, color: 'bg-blue-600' },
              { label: 'Prosiding Konferensi (IEEE / Scitepress)', count: 9, pct: 29.0, color: 'bg-indigo-600' },
              { label: 'Hak Kekayaan Intelektual (HKI)', count: 4, pct: 12.9, color: 'bg-emerald-600' },
              { label: 'Buku Referensi & Monograf', count: 2, pct: 6.5, color: 'bg-amber-600' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </MotionCard>

        <MotionCard index={1} interactive className="card">
          <WordRevealHeading
            as="h3"
            text="Distribusi Peringkat Jurnal (SINTA / Scopus)"
            className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3"
          />
          <div className="space-y-3">
            {[
              { label: 'Scopus Q1 - Q3', count: 6, pct: 24, color: 'bg-purple-600' },
              { label: 'SINTA 1 & 2', count: 10, pct: 40, color: 'bg-blue-600' },
              { label: 'SINTA 3 & 4', count: 7, pct: 28, color: 'bg-emerald-600' },
              { label: 'Non-Peringkat / Lainnya', count: 2, pct: 8, color: 'bg-slate-400' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.count} karya</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </MotionCard>
      </div>

      {/* Tabel Capaian per Tahun */}
      <MotionCard index={2} interactive={false} className="card">
        <WordRevealHeading
          as="h3"
          text="Tren Capaian Publikasi 3 Tahun Terakhir"
          className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3"
        />
        <DataTable columns={columns} data={MOCK_RECAP_YEARS} />
      </MotionCard>
    </div>
  );
}

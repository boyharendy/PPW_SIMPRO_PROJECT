'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Send, Star, Users, CheckCircle2, TrendingUp, Building2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { ExportMenu } from '@/components/ui/ExportMenu';
import Modal from '@/components/ui/Modal';
import { formatDateShort } from '@/lib/utils';

interface SurveyResponse {
  id: string;
  mitra: string;
  program: 'KP' | 'PSI' | 'PDLK';
  mahasiswa: string;
  penilai: string;
  jabatan: string;
  skor: number;
  tanggal: string;
  aspekScores: { aspek: string; skor: number; bobot: string }[];
  catatan?: string;
}

const MOCK_RESPONSES: SurveyResponse[] = [
  {
    id: 'resp-1',
    mitra: 'PT Telkom Indonesia (Persero) Tbk',
    program: 'KP',
    mahasiswa: 'Muhammad Rizky Pratama',
    penilai: 'Budi Rahardjo',
    jabatan: 'Lead Software Architect',
    skor: 4.6,
    tanggal: '2025-08-28',
    aspekScores: [
      { aspek: 'Integritas & Etika Profesional', skor: 5.0, bobot: '25%' },
      { aspek: 'Kompetensi Teknis SI', skor: 4.5, bobot: '35%' },
      { aspek: 'Komunikasi & Tim', skor: 4.5, bobot: '20%' },
      { aspek: 'Koordinasi dengan Prodi', skor: 4.5, bobot: '20%' },
    ],
    catatan: 'Mahasiswa sangat adaptif terhadap teknologi stack baru dan disiplin dalam pengerjaan sprint.',
  },
  {
    id: 'resp-2',
    mitra: 'PT Astra International Tbk',
    program: 'PSI',
    mahasiswa: 'Anisa Putri Maharani',
    penilai: 'Linda Setiawan',
    jabatan: 'Senior IT Business Analyst',
    skor: 4.4,
    tanggal: '2025-08-24',
    aspekScores: [
      { aspek: 'Integritas & Etika Profesional', skor: 4.8, bobot: '25%' },
      { aspek: 'Kompetensi Teknis SI', skor: 4.2, bobot: '35%' },
      { aspek: 'Komunikasi & Tim', skor: 4.5, bobot: '20%' },
      { aspek: 'Koordinasi dengan Prodi', skor: 4.0, bobot: '20%' },
    ],
    catatan: 'Analisis kebutuhan sistem sangat rinci, kemampuan wawancara user memuaskan.',
  },
  {
    id: 'resp-3',
    mitra: 'PT Bank Mandiri (Persero) Tbk',
    program: 'PDLK',
    mahasiswa: 'Fajar Nugraha',
    penilai: 'Farhan Maulana',
    jabatan: 'VP Digital Banking Ops',
    skor: 4.2,
    tanggal: '2025-08-20',
    aspekScores: [
      { aspek: 'Integritas & Etika Profesional', skor: 4.5, bobot: '25%' },
      { aspek: 'Kompetensi Teknis SI', skor: 4.0, bobot: '35%' },
      { aspek: 'Komunikasi & Tim', skor: 4.0, bobot: '20%' },
      { aspek: 'Koordinasi dengan Prodi', skor: 4.3, bobot: '20%' },
    ],
    catatan: 'Kinerja baik, perlu peningkatan dalam pemahaman compliance perbankan.',
  },
  {
    id: 'resp-4',
    mitra: 'Shopee Indonesia',
    program: 'KP',
    mahasiswa: 'Dewi Lestari',
    penilai: 'Hendra Wijaya',
    jabatan: 'Engineering Manager',
    skor: 4.8,
    tanggal: '2025-08-15',
    aspekScores: [
      { aspek: 'Integritas & Etika Profesional', skor: 5.0, bobot: '25%' },
      { aspek: 'Kompetensi Teknis SI', skor: 4.9, bobot: '35%' },
      { aspek: 'Komunikasi & Tim', skor: 4.6, bobot: '20%' },
      { aspek: 'Koordinasi dengan Prodi', skor: 4.5, bobot: '20%' },
    ],
    catatan: 'Hasil implementasi API integrasi luar biasa rapi dan terdokumentasi lengkap.',
  },
];

const ASPEK_RATA_RATA = [
  { nama: 'Integritas & Etika Profesional', bobot: '25%', skor: 4.8, persen: 96 },
  { nama: 'Kompetensi Teknis SI', bobot: '35%', skor: 4.4, persen: 88 },
  { nama: 'Komunikasi & Kerjasama Tim', bobot: '20%', skor: 4.4, persen: 88 },
  { nama: 'Koordinasi dengan Program Studi', bobot: '20%', skor: 4.3, persen: 86 },
];

export default function Page() {
  const [selectedProgram, setSelectedProgram] = useState<'ALL' | 'KP' | 'PSI' | 'PDLK'>('ALL');
  const [detailModal, setDetailModal] = useState<SurveyResponse | null>(null);

  const filteredResponses = selectedProgram === 'ALL'
    ? MOCK_RESPONSES
    : MOCK_RESPONSES.filter((r) => r.program === selectedProgram);

  const columns: DataTableColumn<SurveyResponse>[] = [
    {
      key: 'mitra',
      header: 'Mitra & Mahasiswa',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            {r.mitra}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {r.program}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{r.mahasiswa}</div>
        </div>
      ),
    },
    {
      key: 'penilai',
      header: 'Penilai Lapangan',
      render: (r) => (
        <div>
          <div className="text-sm text-slate-800 font-medium">{r.penilai}</div>
          <div className="text-xs text-slate-400">{r.jabatan}</div>
        </div>
      ),
    },
    {
      key: 'skor',
      header: 'Indeks Skor',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
          <Star size={13} className="fill-blue-600 text-blue-600" />
          {r.skor.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
        </span>
      ),
    },
    {
      key: 'tanggal',
      header: 'Waktu Pengisian',
      render: (r) => <span className="text-xs text-slate-500">{formatDateShort(r.tanggal)}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setDetailModal(r)}
          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5"
        >
          <Eye size={13} />
          Detail
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kepuasan Mitra"
        description="Pemantauan indeks kepuasan, tren penilaian mitra industri, dan tingkat respons kuesioner mahasiswa (FR-28)."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/kepuasan-mitra/instrumen" className="btn-secondary text-sm flex items-center gap-1.5">
              <FileText size={15} /> Instrumen
            </Link>
            <Link href="/dashboard/kepuasan-mitra/pengiriman" className="btn-primary text-sm flex items-center gap-1.5">
              <Send size={15} /> Kirim Tautan
            </Link>
            <ExportMenu filename="rekap-kepuasan-mitra" />
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Indeks Kepuasan"
          value="4.50 / 5.0"
          subtitle="Setara 90.0% skala maksimum"
          badgeTone="blue"
          badgeText="Sangat Baik"
          icon={<Star size={16} />}
        />
        <StatCard
          title="Tingkat Respons"
          value="78%"
          subtitle="18 dari 23 tautan diisi"
          badgeTone="emerald"
          badgeText="+12% YoY"
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          title="Total Responden"
          value="18 Mitra"
          subtitle="Tercatat aktif di sistem"
          badgeTone="indigo"
          icon={<Building2 size={16} />}
        />
        <StatCard
          title="Program Penempatan"
          value="KP · PSI · PDLK"
          subtitle="3 Program terintegrasi"
          badgeTone="slate"
          icon={<Users size={16} />}
        />
      </div>

      {/* Rata-rata Skor per Aspek */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Rata-rata Skor per Aspek Evaluasi</h2>
            <p className="text-xs text-slate-500">Rekapitulasi penilaian kinerja mahasiswa berdasarkan bobot instrumen</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            Skala 1.0 – 5.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ASPEK_RATA_RATA.map((aspek, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 truncate">{aspek.nama}</span>
                <span className="text-slate-400 font-mono">Bobot {aspek.bobot}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-bold text-slate-900">{aspek.skor.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></span>
                <span className="text-xs font-semibold text-blue-600">{aspek.persen}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${aspek.persen}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel Respons Mitra */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Daftar Respons Evaluasi Mitra</h2>
            <p className="text-xs text-slate-500">Ulasan dan nilai objektif kinerja mahasiswa dari pembimbing lapangan</p>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-auto">
            {(['ALL', 'KP', 'PSI', 'PDLK'] as const).map((prog) => (
              <button
                key={prog}
                onClick={() => setSelectedProgram(prog)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedProgram === prog
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prog === 'ALL' ? 'Semua Program' : prog}
              </button>
            ))}
          </div>
        </div>

        <DataTable columns={columns} data={filteredResponses} emptyMessage="Belum ada data evaluasi untuk program ini" />
      </div>

      {/* Modal Detail Respons */}
      <Modal
        open={Boolean(detailModal)}
        onClose={() => setDetailModal(null)}
        title="Detail Respons Kuesioner Mitra"
        size="md"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Mitra Perusahaan:</span>
                <span className="font-semibold text-slate-800">{detailModal.mitra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mahasiswa & Program:</span>
                <span className="font-semibold text-slate-800">{detailModal.mahasiswa} ({detailModal.program})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Penilai / Jabatan:</span>
                <span className="font-semibold text-slate-800">{detailModal.penilai} — {detailModal.jabatan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Pengisian:</span>
                <span className="font-semibold text-slate-800">{formatDateShort(detailModal.tanggal)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Penilaian per Aspek</h4>
              <div className="space-y-2">
                {detailModal.aspekScores.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white text-xs">
                    <div>
                      <div className="font-medium text-slate-800">{a.aspek}</div>
                      <div className="text-[10px] text-slate-400">Bobot {a.bobot}</div>
                    </div>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {a.skor.toFixed(1)} / 5.0
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detailModal.catatan && (
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <div className="text-xs font-semibold text-slate-700 mb-1">Komentar & Catatan Mitra:</div>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{detailModal.catatan}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

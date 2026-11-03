'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import InteractiveBarChart, { BarSeriesConfig } from '@/components/ui/InteractiveBarChart';
import { mockPublications } from '@/lib/mock-data';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { Publication } from '@/lib/types';
import { BookOpen, Award, Users, TrendingUp, CheckCircle2, Share2 } from 'lucide-react';

const JENIS_DATA = [
  { name: 'Jurnal Ilmiah', jumlah: 14, color: '#2563EB' },
  { name: 'Prosiding Seminar', jumlah: 8, color: '#10B981' },
  { name: 'Buku Ajar / Monograf', jumlah: 2, color: '#F59E0B' },
  { name: 'Hak Cipta (HKI)', jumlah: 5, color: '#8B5CF6' },
];

const PERINGKAT_DATA = [
  { peringkat: 'Scopus Q1/Q2', jumlah: 3 },
  { peringkat: 'Sinta 1/2', jumlah: 7 },
  { peringkat: 'Sinta 3/4', jumlah: 4 },
  { peringkat: 'Non-Peringkat', jumlah: 5 },
];

const STAGE_RECAP = [
  { tahap: 'IDE / PENULISAN', jumlah: 4 },
  { tahap: 'SUBMIT / REVIEW', jumlah: 6 },
  { tahap: 'REVISI / ACCEPTED', jumlah: 5 },
  { tahap: 'TERBIT (TERVERIFIKASI)', jumlah: 14 },
];

const PERINGKAT_SERIES: BarSeriesConfig[] = [
  { dataKey: 'jumlah', fill: '#2563EB', name: 'Jumlah Publikasi' },
];

const PERINGKAT_DOMAIN: [number, number] = [0, 8];
const PERINGKAT_TICKS = [0, 2, 4, 6, 8];

export default function RekapPublikasiPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [publications, setPublications] = useState<Publication[]>(mockPublications);

  useEffect(() => {
    const localPubs = storageSync.get<Publication[]>(STORAGE_KEYS.PUBLICATIONS, mockPublications);
    if (localPubs && localPubs.length > 0) {
      setPublications(localPubs);
    }
  }, []);

  const filteredPubs = publications.filter((p) => !selectedYear || p.tahun === selectedYear);
  const studentInvolvedCount = filteredPubs.filter((p) =>
    p.authors?.some((a) => a.tipe_penulis === 'MAHASISWA')
  ).length;
  const forwardedToKinerja = filteredPubs.filter(
    (p) =>
      (p.status === 'TERBIT' || p.status_verifikasi === 'DISETUJUI' || p.status_verifikasi === 'TIDAK_PERLU') &&
      p.authors?.some((a) => a.tipe_penulis === 'DOSEN')
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Capaian Publikasi Ilmiah"
        description="Statistik rekap publikasi berdasarkan status tahapan, jenis, peringkat akreditasi, tahun, keterlibatan mahasiswa, dan penerusan otomatis ke Kinerja Dosen."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="select-field text-xs py-2 w-36"
            >
              <option value={2025}>Tahun 2025</option>
              <option value={2024}>Tahun 2024</option>
              <option value={2023}>Tahun 2023</option>
            </select>
            <ExportMenu title="Ekspor Rekap Publikasi" filename="rekap-publikasi-ilmiah" />
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Publikasi Terverifikasi"
          value="24 Judul"
          subtitle="Tercatat di data resmi prodi"
          icon={<BookOpen size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Melibatkan Mahasiswa"
          value={`9 Judul (37.5%)`}
          subtitle={`${studentInvolvedCount} di daftar aktif tahun ${selectedYear}`}
          icon={<Users size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Jurnal Bereputasi Internasional"
          value="3 Artikel"
          subtitle="Scopus Q1 / Q2 terindeks"
          icon={<Award size={20} />}
          color="blue"
        />
        <StatCard
          title="Diteruskan ke Kinerja Dosen"
          value={`${forwardedToKinerja.length} Publikasi`}
          subtitle="Sinkron otomatis ke FR-06 (BKD)"
          icon={<TrendingUp size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Peringkat Akreditasi</h3>
              <p className="text-xs text-slate-500">
                Jumlah artikel berdasarkan indeksasi dan peringkat jurnal
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <InteractiveBarChart
              data={PERINGKAT_DATA}
              xKey="peringkat"
              series={PERINGKAT_SERIES}
              domain={PERINGKAT_DOMAIN}
              ticks={PERINGKAT_TICKS}
              tooltipFormatter={(val) => `${val} Artikel`}
              showLegend={false}
            />
          </div>
        </div>

        {/* Jenis & Status Tahapan Breakdown */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Proporsi Jenis & Status Tahapan</h3>
            <p className="text-xs text-slate-500">Rekap luaran riset berdasarkan jenis dan status</p>
          </div>

          <div className="space-y-2.5">
            {JENIS_DATA.map((j) => (
              <div
                key={j.name}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: j.color }} />
                  <span className="font-semibold text-slate-700">{j.name}</span>
                </div>
                <span className="font-bold text-slate-800">{j.jumlah} Judul</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase">Rekap per Status Tahapan:</p>
            {STAGE_RECAP.map((s) => (
              <div key={s.tahap} className="flex items-center justify-between text-xs text-slate-600">
                <span>{s.tahap}</span>
                <span className="font-bold text-blue-700">{s.jumlah} Naskah</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Integrasi Otomatis ke Kinerja Dosen (SKPL FR-32) */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Publikasi Terverifikasi &amp; Status Penerusan ke Kinerja Dosen (FR-32)
              </h3>
              <p className="text-xs text-slate-500">
                Publikasi dosen yang telah terbit/terverifikasi otomatis diteruskan ke Modul Pencatatan Kinerja Dosen (FR-06)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left">Judul Publikasi</th>
                <th className="px-3 py-2.5 text-left">Jenis &amp; Peringkat</th>
                <th className="px-3 py-2.5 text-left">Keterlibatan Mhs</th>
                <th className="px-3 py-2.5 text-left">Status Tahap</th>
                <th className="px-3 py-2.5 text-right">Integrasi Kinerja Dosen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPubs.map((pub) => {
                const hasMhs = pub.authors?.some((a) => a.tipe_penulis === 'MAHASISWA');
                const hasDosen = pub.authors?.some((a) => a.tipe_penulis === 'DOSEN');
                const isForwarded =
                  hasDosen &&
                  (pub.status === 'TERBIT' ||
                    pub.status_verifikasi === 'DISETUJUI' ||
                    pub.status_verifikasi === 'TIDAK_PERLU');

                return (
                  <tr key={pub.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-semibold text-slate-800 max-w-md">
                      <p className="line-clamp-1">{pub.judul}</p>
                      <span className="text-[11px] font-normal text-slate-500">{pub.nama_target}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      <span className="font-bold">{pub.jenis}</span> • {pub.peringkat.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2.5">
                      {hasMhs ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                          Melibatkan Mahasiswa
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Khusus Dosen</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={pub.status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isForwarded ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 size={13} /> Diteruskan ke BKD (FR-06)
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-[11px]">
                          Menunggu Verifikasi / Terbit
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

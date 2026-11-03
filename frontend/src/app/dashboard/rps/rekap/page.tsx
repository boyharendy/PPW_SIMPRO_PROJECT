'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ExportMenu from '@/components/ui/ExportMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockRpsSubmissions, mockCourses } from '@/lib/mock-data';
import { BookCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function RekapRpsPage() {
  const [selectedSemester, setSelectedSemester] = useState('period-2025-ganjil');

  const totalMK = mockCourses.length;
  const disahkanCount = mockRpsSubmissions.filter((s) => s.status === 'DISAHKAN').length;
  const direviewCount = mockRpsSubmissions.filter((s) => s.status === 'DIREVIEW').length;
  const disetujuiCount = mockRpsSubmissions.filter((s) => s.status === 'DISETUJUI').length;
  const belumDiajukanCount = Math.max(0, totalMK - mockRpsSubmissions.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Ketercapaian Mutu Dokumen RPS"
        description="Monitoring status pengajuan, review, dan pengesahan RPS seluruh mata kuliah yang ditawarkan per semester."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="select-field text-xs py-2 w-52"
            >
              <option value="period-2025-ganjil">2025/2026 Semester Ganjil</option>
              <option value="period-2024-genap">2024/2025 Semester Genap</option>
            </select>
            <ExportMenu title="Ekspor Rekap RPS" />
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mata Kuliah Ditawarkan"
          value={`${totalMK} MK`}
          subtitle="Kurikulum Program Studi"
          icon={<BookCheck size={20} />}
          gradient="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="RPS Telah Disahkan"
          value={`${disahkanCount} MK`}
          subtitle={`${Math.round((disahkanCount / totalMK) * 100)}% Siap Digunakan`}
          icon={<CheckCircle2 size={20} />}
          gradient="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Dalam Proses Review"
          value={`${direviewCount} MK`}
          subtitle="Sedang ditelaah reviewer"
          icon={<Clock size={20} />}
          gradient="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Belum Diajukan / Perlu Revisi"
          value={`${belumDiajukanCount} MK`}
          subtitle="Memerlukan pengingat"
          icon={<AlertTriangle size={20} />}
          gradient="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Comprehensive Status Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Status Pemenuhan RPS Seluruh Mata Kuliah
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi kepatuhan jadwal unggah dokumen sebelum perkuliahan dimulai
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left font-mono">Kode MK</th>
                <th className="px-3 py-2.5 text-left">Nama Mata Kuliah</th>
                <th className="px-3 py-2.5 text-left">SKS</th>
                <th className="px-3 py-2.5 text-left">Versi Berkas</th>
                <th className="px-3 py-2.5 text-left">Status Terkini</th>
                <th className="px-3 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockCourses.map((c) => {
                const sub = mockRpsSubmissions.find((s) => s.course_id === c.id);
                const status = sub ? sub.status : 'BELUM_DIAJUKAN';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{c.kode_mk}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{c.nama_mk}</td>
                    <td className="px-3 py-2.5 text-slate-600">{c.sks} SKS</td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {sub ? `Versi ${sub.versi_terbaru}` : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={status} size="sm" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {sub ? (
                        <Link
                          href={`/dashboard/rps/${sub.id}`}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Lihat Detail →
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum Diunggah</span>
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


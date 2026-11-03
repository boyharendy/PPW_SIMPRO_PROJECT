'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockCourseEvaluations, mockCourses, mockPeriods } from '@/lib/mock-data';
import { evaluationService } from '@/lib/api/services/evaluation.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { CourseEvaluation } from '@/lib/types';
import { GraduationCap, Eye, FileEdit, CheckCircle2, Search } from 'lucide-react';
import Link from 'next/link';

export default function EvaluasiPerkuliahanListPage() {
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>(() =>
    storageSync.get<CourseEvaluation[]>(STORAGE_KEYS.EVALUATIONS, mockCourseEvaluations)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('period-2024-genap');

  useEffect(() => {
    let active = true;
    evaluationService
      .getEvaluations()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          setEvaluations(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      key: 'kelas',
      header: 'Mata Kuliah & Kelas',
      render: (row: CourseEvaluation) => (
        <div className="space-y-0.5">
          <Link
            href={`/dashboard/evaluasi-perkuliahan/${row.course_class_id}`}
            className="font-bold text-slate-800 hover:text-blue-600 text-xs sm:text-sm line-clamp-1"
          >
            {row.course_class?.course?.nama_mk}
          </Link>
          <p className="text-[11px] text-slate-500">
            Kelas: <strong className="text-blue-700">{row.course_class?.kode_kelas}</strong> • Peserta: {row.course_class?.jumlah_mahasiswa} Mahasiswa
          </p>
        </div>
      ),
    },
    {
      key: 'cpmk',
      header: 'Ketercapaian CPMK',
      render: (row: CourseEvaluation) => {
        const total = row.cpmk_list.length;
        const tercapai = row.cpmk_list.filter((c) => c.tercapai).length;
        const pct = Math.round((tercapai / total) * 100);

        return (
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-800">
              {tercapai} dari {total} CPMK ({pct}%)
            </span>
            <div className="h-1.5 w-28 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'umpan_balik',
      header: 'Umpan Balik Mahasiswa',
      render: (row: CourseEvaluation) => (
        <div className="text-xs">
          <span className="font-extrabold text-blue-700">
            {row.feedback_summary?.skor_rata_rata.toFixed(2)} / 5.0
          </span>
          <p className="text-[10px] text-slate-400">
            {row.feedback_summary?.jumlah_responden} Responden
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Evaluasi',
      render: (row: CourseEvaluation) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row: CourseEvaluation) => (
        <Link
          href={`/dashboard/evaluasi-perkuliahan/${row.course_class_id}`}
          className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-600"
        >
          <Eye size={13} />
          <span>Lihat Evaluasi</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Evaluasi Perkuliahan Akhir Semester"
        description="Pengisian ketercapaian CPMK, evaluasi kesesuaian RPS, analisis distribusi nilai, dan umpan balik mahasiswa per kelas."
      />

      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari mata kuliah..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Semester:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="select-field text-xs py-1.5 w-48"
          >
            <option value="period-2024-genap">2024/2025 Semester Genap</option>
            <option value="period-2025-ganjil">2025/2026 Semester Ganjil</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={evaluations}
          emptyMessage="Belum ada evaluasi perkuliahan pada semester ini."
        />
      </div>
    </div>
  );
}


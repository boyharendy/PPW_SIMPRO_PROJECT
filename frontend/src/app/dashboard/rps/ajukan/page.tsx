'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import FileUploader from '@/components/ui/FileUploader';
import { mockCourses, mockPeriods, mockRpsSubmissions } from '@/lib/mock-data';
import type { RpsSubmission } from '@/lib/types';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';

export default function AjukanRpsPage() {
  const router = useRouter();

  const [courseId, setCourseId] = useState(mockCourses[2]?.id || 'c3');
  const [academicPeriodId, setAcademicPeriodId] = useState(mockPeriods[1]?.id || 'period-2025-ganjil');
  const [fileName, setFileName] = useState('');

  // Sample forwarded improvement plans from previous semester evaluation
  const [plans, setPlans] = useState([
    {
      id: 'plan-fwd-1',
      uraian: 'Perbanyak studi kasus implementasi arsitektur cloud microservices pada CPMK 3.',
      status: 'DITERAPKAN' as 'DITERAPKAN' | 'TIDAK_DITERAPKAN',
      catatan: 'Sudah ditambahkan studi kasus AWS Lambda di pertemuan 8 dan 9.',
    },
    {
      id: 'plan-fwd-2',
      uraian: 'Pemutakhiran buku teks rujukan ke edisi terbitan 2024.',
      status: 'DITERAPKAN' as 'DITERAPKAN' | 'TIDAK_DITERAPKAN',
      catatan: 'Daftar pustaka telah diperbarui dengan 2 textbook edisi terbaru.',
    },
  ]);

  const handleUpdatePlan = (id: string, status: 'DITERAPKAN' | 'TIDAK_DITERAPKAN', catatan: string) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, status, catatan } : p)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCourse = mockCourses.find((c) => c.id === courseId);

    const newSub: RpsSubmission = {
      id: `rps-sub-${Date.now()}`,
      course_id: courseId,
      academic_period_id: academicPeriodId,
      dosen_pengampu_id: 'u-dosen1',
      status: 'DIAJUKAN',
      versi_terbaru: 1,
      diajukan_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      course: selectedCourse,
      versions: [
        {
          id: `rps-v-${Date.now()}`,
          submission_id: `rps-sub-${Date.now()}`,
          nomor_versi: 1,
          catatan_perubahan: 'Pengajuan versi 1 awal semester',
          diunggah_oleh: 'u-dosen1',
          file_path: '/uploads/rps/SI301_RPS_v1.pdf',
          file_name: fileName || 'SI301_RPS_v1.pdf',
          created_at: new Date().toISOString(),
          reviews: [],
        },
      ],
      improvement_plans: plans.map((p) => ({
        id: p.id,
        evaluation_id: 'eval-prev',
        uraian: p.uraian,
        kategori: 'METODE_PEMBELAJARAN',
        status: p.status,
        catatan_penerapan: p.catatan,
        created_at: new Date().toISOString(),
      })),
    };

    mockRpsSubmissions.unshift(newSub);
    router.push('/dashboard/rps');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rps"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Pengajuan RPS</span>
        </Link>
      </div>

      <PageHeader
        title="Formulir Pengajuan Dokumen RPS"
        description="Unggah berkas RPS baru serta tindak lanjuti rencana perbaikan dari post-evaluasi semester sebelumnya."
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Identitas Mata Kuliah */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Identitas Mata Kuliah & Periode Akademik
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Pilih Mata Kuliah</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="select-field text-xs"
              >
                {mockCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kode_mk} - {c.nama_mk} ({c.sks} SKS)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Periode Akademik</label>
              <select
                value={academicPeriodId}
                onChange={(e) => setAcademicPeriodId(e.target.value)}
                className="select-field text-xs"
              >
                {mockPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tahun_akademik} Semester {p.semester}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FileUploader
            label="Unggah Berkas Dokumen RPS (PDF atau DOCX)"
            accept=".pdf,.docx"
            onFileSelect={(file) => setFileName(file.name)}
          />
        </div>

        {/* Tindak Lanjut Rencana Perbaikan (Mutu Berkelanjutan - FR-45) */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">
              Tindak Lanjut Rencana Perbaikan Evaluasi Sebelumnya (CQI)
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai SKPL (FR-45), dosen pengampu wajib menandai status penerapan (Diterapkan / Tidak Diterapkan) beserta penjelasan sebelum RPS dapat diajukan.
            </p>
          </div>

          <div className="space-y-3">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-blue-700">Rencana Perbaikan #{idx + 1}</span>
                    <p className="text-slate-800 font-medium">{plan.uraian}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdatePlan(plan.id, 'DITERAPKAN', plan.catatan)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        plan.status === 'DITERAPKAN'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Diterapkan
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePlan(plan.id, 'TIDAK_DITERAPKAN', plan.catatan)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        plan.status === 'TIDAK_DITERAPKAN'
                          ? 'bg-rose-50 text-rose-800 border-rose-500'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Tidak Diterapkan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label text-[10px]">Catatan / Penjelasan Penerapan pada RPS Baru</label>
                  <input
                    type="text"
                    required
                    value={plan.catatan}
                    onChange={(e) => handleUpdatePlan(plan.id, plan.status, e.target.value)}
                    placeholder="Jelaskan penyesuaian yang telah dilakukan pada RPS versi ini..."
                    className="input-field text-xs py-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/rps" className="btn-secondary text-xs">
            Batal
          </Link>
          <button type="submit" className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
            <Send size={15} />
            <span>Kirim Pengajuan RPS</span>
          </button>
        </div>
      </form>
    </div>
  );
}


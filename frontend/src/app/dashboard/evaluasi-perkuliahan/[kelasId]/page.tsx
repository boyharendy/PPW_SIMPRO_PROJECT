'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { mockCourseEvaluations } from '@/lib/mock-data';
import type { CourseEvaluation, PlanCategory } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Send,
  MessageSquare,
  BarChart2,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export default function DetailEvaluasiPerkuliahanPage() {
  const params = useParams();
  const kelasId = params.kelasId as string;

  const initialEval =
    mockCourseEvaluations.find((e) => e.course_class_id === kelasId) ||
    mockCourseEvaluations[0];

  const [evaluation, setEvaluation] = useState<CourseEvaluation>(initialEval);
  const [modalGkmOpen, setModalGkmOpen] = useState(false);
  const [catatanGkm, setCatatanGkm] = useState('');
  const [modalPlanOpen, setModalPlanOpen] = useState(false);

  // New Plan Form
  const [planUraian, setPlanUraian] = useState('');
  const [planKategori, setPlanKategori] = useState<PlanCategory>('METODE_PEMBELAJARAN');

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planUraian.trim()) return;

    const newPlan = {
      id: `plan-${Date.now()}`,
      evaluation_id: evaluation.id,
      uraian: planUraian,
      kategori: planKategori,
      status: 'BARU' as const,
      created_at: new Date().toISOString(),
    };

    setEvaluation({
      ...evaluation,
      improvement_plans: [...evaluation.improvement_plans, newPlan],
    });

    setModalPlanOpen(false);
    setPlanUraian('');
  };

  const handleTinjauGkm = (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluation({
      ...evaluation,
      status: 'DITINJAU',
      ditinjau_oleh: 'u-gkm',
      ditinjau_at: new Date().toISOString(),
      catatan_gkm: catatanGkm || 'Evaluasi telah ditinjau dan dicatat oleh GKM.',
    });
    setModalGkmOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/evaluasi-perkuliahan"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Evaluasi</span>
        </Link>
      </div>

      <PageHeader
        title={`Evaluasi: ${evaluation.course_class?.course?.nama_mk} (${evaluation.course_class?.kode_kelas})`}
        description={`Jumlah Mahasiswa: ${evaluation.course_class?.jumlah_mahasiswa} • Dosen Pengampu: Dr. Ahmad Fauzi, M.T.`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={evaluation.status} size="md" />
            {evaluation.status !== 'DITINJAU' && (
              <button
                type="button"
                onClick={() => setModalGkmOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Tandai Ditinjau (GKM)</span>
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: CPMK, Grades, RPS Match, Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* CPMK Achievement Table */}
          <div className="card space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                1. Ketercapaian Capaian Pembelajaran Mata Kuliah (CPMK)
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan target persen dan capaian aktual mahasiswa kelas
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left w-20">Kode</th>
                    <th className="px-3 py-2 text-left">Deskripsi CPMK</th>
                    <th className="px-3 py-2 text-right w-20">Target</th>
                    <th className="px-3 py-2 text-right w-20">Capaian</th>
                    <th className="px-3 py-2 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluation.cpmk_list.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{c.kode_cpmk}</td>
                      <td className="px-3 py-2.5 text-slate-700">
                        <p className="font-medium">{c.deskripsi_cpmk}</p>
                        {c.analisis && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic">{c.analisis}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-500">
                        {c.target_persen}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                        {c.capaian_persen}%
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge status={c.tercapai ? 'TERCAPAI' : 'TIDAK_TERCAPAI'} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribusi Nilai Kelas */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              2. Distribusi Nilai Akhir Kelas
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
              {evaluation.grades.map((g) => (
                <div key={g.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="font-extrabold text-blue-700 text-sm">{g.nilai_huruf}</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{g.jumlah_mahasiswa} Mhs</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rencana Perbaikan (CQI) */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  3. Rencana Perbaikan untuk Semester Berikutnya (FR-45)
                </h3>
                <p className="text-xs text-slate-500">
                  Rencana berstatus BARU akan otomatis diteruskan ke pengajuan RPS periode berikutnya
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPlanOpen(true)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Tambah Rencana</span>
              </button>
            </div>

            <div className="space-y-3">
              {evaluation.improvement_plans.map((p, idx) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Rencana #{idx + 1} ({p.kategori})</span>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <p className="text-slate-800 font-medium">{p.uraian}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Student Feedback Side Panel (FR-44) & Catatan GKM */}
        <div className="space-y-6">
          {/* Umpan Balik Mahasiswa (Berdampingan) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Sinkron SIAKAD / SIMPRO
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                Ringkasan Umpan Balik Mahasiswa (FR-44)
              </h3>
              <p className="text-xs text-slate-500">
                Hasil kuesioner mahasiswa ditampilkan berdampingan
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="font-semibold text-blue-900">Skor Rata-rata Kepuasan</span>
                <span className="text-lg font-black text-blue-700">
                  {evaluation.feedback_summary?.skor_rata_rata.toFixed(2)} / 5.0
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <p className="font-bold text-slate-700">Rincian per Aspek:</p>
                {evaluation.feedback_summary?.rincian_aspek &&
                  Object.entries(evaluation.feedback_summary.rincian_aspek).map(([asp, val]) => (
                    <div key={asp} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">{asp}</span>
                      <span className="font-bold text-slate-800">{val.toFixed(1)} / 5.0</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Catatan GKM */}
          {evaluation.catatan_gkm && (
            <div className="card space-y-2 bg-emerald-50/50 border-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 size={15} />
                <span>Catatan Gugus Kendali Mutu (GKM)</span>
              </div>
              <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-emerald-100">
                &ldquo;{evaluation.catatan_gkm}&rdquo;
              </p>
              <p className="text-[10px] text-slate-400">
                Ditinjau pada: {formatDateShort(evaluation.ditinjau_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tinjau GKM */}
      <Modal open={modalGkmOpen} onClose={() => setModalGkmOpen(false)} title="Tinjau Evaluasi Perkuliahan (GKM)" size="md">
        <form onSubmit={handleTinjauGkm} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            GKM menandai bahwa post-evaluasi ini telah ditinjau dan rencana perbaikan telah diverifikasi untuk diteruskan ke siklus RPS berikutnya.
          </div>

          <div>
            <label className="label">Catatan & Masukan GKM</label>
            <textarea
              rows={3}
              required
              value={catatanGkm}
              onChange={(e) => setCatatanGkm(e.target.value)}
              placeholder="Berikan arahan mutu pembelajaran..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalGkmOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700">
              Konfirmasi Ditinjau
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Rencana Perbaikan */}
      <Modal open={modalPlanOpen} onClose={() => setModalPlanOpen(false)} title="Tambah Rencana Perbaikan Baru" size="md">
        <form onSubmit={handleAddPlan} className="space-y-4 text-xs">
          <div>
            <label className="label">Kategori Perbaikan</label>
            <select
              value={planKategori}
              onChange={(e) => setPlanKategori(e.target.value as PlanCategory)}
              className="select-field text-xs"
            >
              <option value="CPMK_RPS">CPMK & RPS</option>
              <option value="METODE_PEMBELAJARAN">Metode Pembelajaran</option>
              <option value="PENILAIAN">Bentuk / Bobot Penilaian</option>
              <option value="REFERENSI">Referensi Pustaka</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="label">Uraian Rencana Perbaikan</label>
            <textarea
              rows={3}
              required
              value={planUraian}
              onChange={(e) => setPlanUraian(e.target.value)}
              placeholder="Contoh: Menambahkan latihan studi kasus implementasi cloud ERP..."
              className="textarea-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalPlanOpen(false)} className="btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" className="btn-primary text-xs">
              Simpan Rencana
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


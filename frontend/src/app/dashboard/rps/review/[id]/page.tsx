'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ReviewChecklist, { ChecklistState } from '@/components/ui/ReviewChecklist';
import { mockRpsSubmissions } from '@/lib/mock-data';
import type { RpsSubmission } from '@/lib/types';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function LembarReviewRpsPage() {
  const params = useParams();
  const router = useRouter();
  const subId = params.id as string;

  const sub =
    mockRpsSubmissions.find((s) => s.id === subId) || mockRpsSubmissions[1];

  const [checklistItems, setChecklistItems] = useState<ChecklistState[]>([
    { komponen: 'KESELARASAN_CPL_CPMK', hasil: 'SESUAI', catatan: 'CPL telah dijabarkan dengan baik ke Sub-CPMK.' },
    { komponen: 'BAHAN_KAJIAN', hasil: 'SESUAI', catatan: 'Materi terstruktur runtut per minggu.' },
    { komponen: 'METODE_PEMBELAJARAN', hasil: 'SESUAI', catatan: 'Penerapan project-based learning sangat relevan.' },
    { komponen: 'BENTUK_BOBOT_PENILAIAN', hasil: 'SESUAI', catatan: 'Rubrik penilaian telah dilampirkan.' },
    { komponen: 'REFERENSI', hasil: 'SESUAI', catatan: 'Daftar pustaka mutakhir 5 tahun terakhir.' },
  ]);

  const [rekomendasi, setRekomendasi] = useState<'DISETUJUI' | 'PERLU_REVISI'>('DISETUJUI');
  const [catatanUmum, setCatatanUmum] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sub) {
      sub.status = rekomendasi === 'DISETUJUI' ? 'DISETUJUI' : 'PERLU_REVISI';
    }

    router.push('/dashboard/rps/review-saya');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/rps/review-saya"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Penugasan Review Saya</span>
        </Link>
      </div>

      <PageHeader
        title={`Lembar Telaah Peer Review: ${sub.course?.nama_mk}`}
        description={`Kode: ${sub.course?.kode_mk} • SKS: ${sub.course?.sks} • Dosen Pengampu: ${sub.dosen_pengampu?.nama_lengkap || 'Dosen Pengampu'}`}
      />

      {/* Dokumen Referensi RPS */}
      <div className="card flex items-center justify-between p-4 bg-blue-50/60 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-800">
              Dokumen RPS Versi {sub.versi_terbaru} (PDF)
            </p>
            <p className="text-[11px] text-slate-500">
              Unduh dan pelajari berkas naskah sebelum melengkapi checklist telaah.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Mengunduh berkas RPS demo...')}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 font-semibold text-blue-600"
        >
          <span>Unduh Berkas</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Checklist 5 Komponen Mutu */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">
              Instrumen Checklist Telaah (5 Komponen Mutu Standar SKPL)
            </h3>
            <p className="text-xs text-slate-500">
              Periksa kelayakan masing-masing butir secara objektif dan sertakan catatan perbaikan.
            </p>
          </div>

          <ReviewChecklist items={checklistItems} onChange={setChecklistItems} />
        </div>

        {/* Rekomendasi Akhir */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Rekomendasi Akhir Reviewer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                rekomendasi === 'DISETUJUI'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="rekomendasi"
                value="DISETUJUI"
                checked={rekomendasi === 'DISETUJUI'}
                onChange={() => setRekomendasi('DISETUJUI')}
                className="hidden"
              />
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                {rekomendasi === 'DISETUJUI' && (
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs">DISETUJUI (Layak Disahkan)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Seluruh komponen telah memenuhi standar mutu kurikulum.
                </p>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                rekomendasi === 'PERLU_REVISI'
                  ? 'bg-amber-50 border-amber-500 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="rekomendasi"
                value="PERLU_REVISI"
                checked={rekomendasi === 'PERLU_REVISI'}
                onChange={() => setRekomendasi('PERLU_REVISI')}
                className="hidden"
              />
              <div className="w-4 h-4 rounded-full border-2 border-amber-600 flex items-center justify-center">
                {rekomendasi === 'PERLU_REVISI' && (
                  <div className="w-2 h-2 rounded-full bg-amber-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs">PERLU REVISI (Perbaikan Dosen)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dosen pengampu wajib mengunggah versi perbaikan sebelum pengesahan.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="label">Catatan Umum / Kesimpulan Telaah</label>
            <textarea
              rows={3}
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
              placeholder="Tuliskan catatan apresiasi atau arahan perbaikan umum kepada pengampu..."
              className="textarea-field text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/rps/review-saya" className="btn-secondary text-xs">
            Batal
          </Link>
          <button type="submit" className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
            <Send size={15} />
            <span>Selesaikan & Kirim Hasil Telaah</span>
          </button>
        </div>
      </form>
    </div>
  );
}


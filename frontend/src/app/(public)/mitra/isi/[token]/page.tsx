'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PublicShell from '@/components/layout/PublicShell';
import { mockSurveyTemplates, mockPlacements } from '@/lib/mock-data';
import { CheckCircle2, Star, Building2, User, BookOpen, Send, ShieldCheck } from 'lucide-react';

export default function PublicMitraSurveyPage() {
  const params = useParams();
  const token = params.token as string;

  // Placement info
  const placement = mockPlacements[0];
  const template = mockSurveyTemplates[0];

  const [submitted, setSubmitted] = useState(false);
  const [namaPengisi, setNamaPengisi] = useState('');
  const [jabatanPengisi, setJabatanPengisi] = useState('');
  const [komentar, setKomentar] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleScoreChange = (aspectId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [aspectId]: score }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPengisi.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <PublicShell badgeText="Survei Kepuasan Mitra">
        <div className="card text-center py-12 px-6 max-w-lg mx-auto space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Terima Kasih atas Penilaian Anda!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tanggapan dan masukan dari <strong>{placement.partner?.nama_mitra}</strong> telah berhasil kami simpan. Umpan balik ini sangat berharga untuk peningkatan mutu kurikulum Program Studi Sarjana Sistem Informasi.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-mono">
              Tautan kuesioner ini kini telah ditandai &lsquo;Sudah Diisi&rsquo; dan tidak dapat diubah kembali.
            </span>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell title="Instrumen Kepuasan Mitra Perusahaan" badgeText="Akses Bebas Akun">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Placement Info Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>Keterangan Penempatan Mahasiswa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="flex items-start gap-2">
              <Building2 size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400 text-[10px]">Perusahaan / Instansi</p>
                <p className="font-semibold text-slate-800">{placement.partner?.nama_mitra}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400 text-[10px]">Mahasiswa Bersangkutan</p>
                <p className="font-semibold text-slate-800">{placement.student?.nama_lengkap}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <BookOpen size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400 text-[10px]">Program Akademik</p>
                <p className="font-semibold text-blue-700">Kerja Praktik (KP) 2025/2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Respondent Info Form */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Data Narahubung Penilai
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Lengkap Penilai</label>
              <input
                type="text"
                required
                value={namaPengisi}
                onChange={(e) => setNamaPengisi(e.target.value)}
                placeholder="Contoh: Ir. Budi Rahardjo"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="label">Jabatan di Perusahaan</label>
              <input
                type="text"
                required
                value={jabatanPengisi}
                onChange={(e) => setJabatanPengisi(e.target.value)}
                placeholder="Contoh: Manager IT / Pembimbing Lapangan"
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Aspect Ratings Form */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Penilaian Aspek Kinerja & Kemampuan Mahasiswa
            </h3>
            <p className="text-xs text-slate-500">
              Berikan penilaian objektif pada skala 1 (Sangat Kurang) hingga 5 (Sangat Baik).
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {template.aspek?.map((asp, idx) => {
              const currentScore = answers[asp.id] || 5;

              return (
                <div key={asp.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {asp.nama_aspek}
                      </p>
                      {asp.deskripsi && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{asp.deskripsi}</p>
                      )}
                    </div>

                    {/* Star Rating Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(asp.id, val)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                            currentScore >= val
                              ? 'bg-amber-400 text-white shadow-xs'
                              : 'bg-white text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Notes */}
        <div className="card space-y-3">
          <label className="label">Komentar / Masukan Tambahan untuk Prodi (Opsional)</label>
          <textarea
            rows={3}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            placeholder="Tuliskan saran kompetensi yang perlu ditingkatkan untuk lulusan prodi sistem informasi..."
            className="textarea-field text-xs"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
            <Send size={16} />
            <span>Kirim Penilaian Kuesioner</span>
          </button>
        </div>
      </form>
    </PublicShell>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PublicShell from '@/components/layout/PublicShell';
import { mockSurveyTemplates, mockPlacements, mockSurveyInvitations } from '@/lib/mock-data';
import { surveyService } from '@/lib/api/services/survey.service';
import { storageSync, STORAGE_KEYS } from '@/lib/storage-sync';
import type { PartnerSurveyTemplate, PartnerSurveyInvitation, PartnerSurveyResponse, StudentPlacement } from '@/lib/types';
import { CheckCircle2, Building2, User, BookOpen, Send, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PublicMitraSurveyPage() {
  const params = useParams();
  const token = params.token as string;

  const [isMounted, setIsMounted] = useState(false);
  const [template, setTemplate] = useState<PartnerSurveyTemplate>(mockSurveyTemplates[0]);
  const [placement, setPlacement] = useState<StudentPlacement>(mockPlacements[0]);
  const [invitation, setInvitation] = useState<PartnerSurveyInvitation | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [namaPengisi, setNamaPengisi] = useState('');
  const [jabatanPengisi, setJabatanPengisi] = useState('');
  const [komentar, setKomentar] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);

    const tmpls = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    const invs = storageSync.get<PartnerSurveyInvitation[]>(STORAGE_KEYS.SURVEY_INVITATIONS, mockSurveyInvitations);
    const matchedInv = invs.find(
      (i) =>
        i.token_plain === token ||
        i.id === token ||
        i.token_hash === token ||
        i.token_hash === `hash_${token}`
    );

    if (matchedInv) {
      setInvitation(matchedInv);
      if (matchedInv.status === 'DIISI') {
        setSubmitted(true);
      }
      if (matchedInv.placement) setPlacement(matchedInv.placement);
      const foundTmpl = tmpls.find((t) => t.id === matchedInv.template_id);
      if (foundTmpl) setTemplate(foundTmpl);
    } else {
      const directTmpl = tmpls.find((t) => t.id === token || t.id.toLowerCase() === token?.toLowerCase());
      if (directTmpl) setTemplate(directTmpl);
    }
  }, [token]);

  const handleScoreChange = (aspectId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [aspectId]: score }));
    if (errorMessage) setErrorMessage(null);
  };

  const activeAspects = (template.aspek && template.aspek.length > 0)
    ? template.aspek
    : [
        { id: 'asp-1', template_id: template.id, nama_aspek: 'Integritas & Etika Profesi', bobot: 30, urutan: 1, is_active: true },
        { id: 'asp-2', template_id: template.id, nama_aspek: 'Kemampuan Teknis & Analisis Sistem', bobot: 40, urutan: 2, is_active: true },
        { id: 'asp-3', template_id: template.id, nama_aspek: 'Komunikasi & Kerja Sama Tim', bobot: 30, urutan: 3, is_active: true },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!namaPengisi.trim()) {
      setErrorMessage('Mohon lengkapi Nama Penilai / Pembimbing Lapangan.');
      return;
    }

    // Validasi bahwa seluruh aspek telah dipilih nilainya (tidak boleh ada yang kosong)
    const missing = activeAspects.filter((asp) => typeof answers[asp.id] !== 'number');
    if (missing.length > 0) {
      setErrorMessage(`Mohon berikan penilaian untuk semua aspek (${missing.length} aspek belum dipilih).`);
      return;
    }

    const respId = `resp-mitra-${Date.now()}`;
    // 1. Buat data respons kuesioner baru
    const newResponse: PartnerSurveyResponse = {
      id: respId,
      invitation_id: invitation?.id || `inv-${token}`,
      template_id: template.id,
      placement_id: placement.id,
      sumber: 'TAUTAN_MITRA',
      status: 'TERKIRIM',
      nama_pengisi: namaPengisi,
      jabatan_pengisi: jabatanPengisi,
      komentar: komentar || undefined,
      submitted_at: new Date().toISOString(),
      placement,
      answers: Object.entries(answers).map(([aspectId, score]) => ({
        id: `ans-${Date.now()}-${aspectId}`,
        response_id: respId,
        aspect_id: aspectId,
        skor: score,
      })),
    };

    // 2. Simpan respons ke local persistent storage & surveyService
    surveyService.saveResponseLocal(newResponse);
    storageSync.prepend(STORAGE_KEYS.SURVEY_RESPONSES, newResponse);

    // 3. Tandai undangan sebagai DIISI jika ditemukan
    if (invitation?.id) {
      storageSync.update(STORAGE_KEYS.SURVEY_INVITATIONS, invitation.id, { status: 'DIISI' }, mockSurveyInvitations);
    }

    // 4. Tambah jumlah responden pada template kuesioner bersangkutan
    const currentTmpls = storageSync.get<PartnerSurveyTemplate[]>(STORAGE_KEYS.SURVEYS, mockSurveyTemplates);
    const currentTmpl = currentTmpls.find((t) => t.id === template.id);
    const newTotal = (currentTmpl?.total_responden || 0) + 1;
    storageSync.update(STORAGE_KEYS.SURVEYS, template.id, { total_responden: newTotal }, mockSurveyTemplates);

    // 5. Submit ke API publik jika backend online
    try {
      await surveyService.submitPublicResponse(token, newResponse);
    } catch {
      // Offline fallback safe
    }

    setSubmitted(true);
  };

  // Loading skeleton placeholder saat initial hydration untuk menjamin zero mismatch
  if (!isMounted) {
    return (
      <PublicShell title="Instrumen Kepuasan Mitra Perusahaan" badgeText="Akses Bebas Akun">
        <div className="card text-center py-12 px-6 max-w-lg mx-auto space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <ShieldCheck size={28} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Memuat Formulir Kuesioner Mitra...</p>
          <p className="text-xs text-slate-400">Menghubungkan instrumen evaluasi penempatan mahasiswa</p>
        </div>
      </PublicShell>
    );
  }

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
                <p className="text-[11px] text-slate-400">Mitra Perusahaan</p>
                <p className="font-semibold text-slate-800">{placement.partner?.nama_mitra || 'PT Mitra Industri'}</p>
                <p className="text-[10px] text-slate-500">{placement.partner?.alamat || placement.partner?.bidang_usaha || 'Industri & Teknologi'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Nama Mahasiswa</p>
                <p className="font-semibold text-slate-800">{placement.student?.nama_lengkap || 'Mahasiswa'}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIM: {placement.student?.nomor_induk || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <BookOpen size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">Program / Periode</p>
                <p className="font-semibold text-slate-800">Program {placement.program}</p>
                <p className="text-[10px] text-slate-500">
                  {placement.tanggal_mulai || '2025-08-01'} s.d. {placement.tanggal_selesai || '2025-12-31'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluator Identity Form */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            Identitas Penilai / Pembimbing Lapangan di Perusahaan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama Lengkap Penilai</label>
              <input
                type="text"
                required
                value={namaPengisi}
                onChange={(e) => setNamaPengisi(e.target.value)}
                placeholder="Nama Bapak/Ibu penilai..."
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
                placeholder="Contoh: Manager IT / Senior Engineer"
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>

        {/* Aspect Ratings Form */}
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Penilaian Aspek Kinerja &amp; Kemampuan Mahasiswa
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berikan penilaian objektif pada skala 1 (Sangat Kurang) hingga {template.skala_maks || 5} (Sangat Baik).
              </p>
            </div>
            <div className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
              Skala 1 s.d. {template.skala_maks || 5}
            </div>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {activeAspects.map((asp, idx) => {
              const currentScore = answers[asp.id]; // Default kosong, tidak pre-filled ke 5
              const scaleButtons = Array.from({ length: template.skala_maks || 5 }, (_, i) => i + 1);

              return (
                <div key={asp.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 pr-2">
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {asp.nama_aspek}
                      </p>
                      {asp.deskripsi && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{asp.deskripsi}</p>
                      )}
                    </div>

                    {/* Scale Rating Buttons: Default kosong (unselected) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        {scaleButtons.map((val) => {
                          const isSelected = currentScore === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleScoreChange(asp.id, val)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 scale-105'
                                  : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                              }`}
                              title={`Beri nilai ${val} dari skala 1–${template.skala_maks || 5}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Value Indicator */}
                      <div className="w-16 text-right">
                        {typeof currentScore === 'number' ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                            Skor: {currentScore}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum diisi
                          </span>
                        )}
                      </div>
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

        {/* Validation Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <AlertCircle size={16} className="flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

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

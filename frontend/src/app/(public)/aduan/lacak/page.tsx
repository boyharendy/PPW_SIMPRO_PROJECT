'use client';

import React, { useState } from 'react';
import PublicShell from '@/components/layout/PublicShell';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusStepper from '@/components/ui/StatusStepper';
import ThreadChat from '@/components/ui/ThreadChat';
import { mockComplaints } from '@/lib/mock-data';
import type { Complaint, ComplaintMessage } from '@/lib/types';
import { Search, ShieldAlert, Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

const COMPLAINT_STEPS = [
  { id: 'DITERIMA', label: 'Diterima' },
  { id: 'DIVERIFIKASI', label: 'Diverifikasi' },
  { id: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti' },
  { id: 'SELESAI', label: 'Selesai' },
  { id: 'DITUTUP', label: 'Ditutup' },
];

export default function PublicLacakAduanPage() {
  const [ticketInput, setTicketInput] = useState('ADU-9K4B-7W2P-MN8X');
  const [searched, setSearched] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(mockComplaints[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rating State
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = ticketInput.trim().toUpperCase();

    const found = mockComplaints.find(
      (c) => c.kode_tiket?.toUpperCase() === cleaned || c.nomor_aduan.toUpperCase() === cleaned
    );

    if (found) {
      setActiveComplaint(found);
      setSearched(true);
    } else {
      setActiveComplaint(null);
      setErrorMsg('Kode tiket tidak ditemukan. Pastikan format penulisan ADU-XXXX-XXXX-XXXX benar.');
      setSearched(true);
    }
  };

  const handleSendReply = (text: string) => {
    if (!activeComplaint) return;

    const newMsg: ComplaintMessage = {
      id: `cm-${Date.now()}`,
      complaint_id: activeComplaint.id,
      urutan: (activeComplaint.messages?.length || 0) + 1,
      pengirim: 'PELAPOR',
      isi: text,
      is_catatan_internal: false,
      tanggal: new Date().toISOString().split('T')[0],
    };

    const nextMessages = [...(activeComplaint.messages || []), newMsg];
    let nextStatus = activeComplaint.status;

    // SKPL E3: If completed, reply reopens complaint
    if (activeComplaint.status === 'SELESAI') {
      nextStatus = 'DITINDAKLANJUTI';
    }

    setActiveComplaint({
      ...activeComplaint,
      status: nextStatus,
      messages: nextMessages,
    });
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setActiveComplaint({
      ...activeComplaint,
      rating_kepuasan: rating,
      komentar_kepuasan: ratingComment,
    });
    setRatingSubmitted(true);
  };

  return (
    <PublicShell title="Portal Lacak Status Aduan Anonim" badgeText="Akses Kode Tiket">
      <div className="space-y-6">
        {/* Ticket Search Form */}
        <div className="card space-y-3">
          <p className="text-xs text-slate-500">
            Masukkan kode tiket rahasia yang Anda peroleh saat mengirimkan aduan untuk memeriksa perkembangan penanganan:
          </p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Contoh: ADU-9K4B-7W2P-MN8X"
                className="input-field text-xs font-mono uppercase tracking-wider pl-4 pr-10 py-2.5"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2">
              <Search size={14} />
              <span>Cari Tiket</span>
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 mt-2">
              <AlertCircle size={14} />
              {errorMsg}
            </p>
          )}
        </div>

        {/* Complaint Details if found */}
        {searched && activeComplaint && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Status Card */}
            <div className="card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {activeComplaint.nomor_aduan}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Kategori: {activeComplaint.kategori.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                    {activeComplaint.judul}
                  </h2>
                </div>

                <div className="text-right flex-shrink-0">
                  <StatusBadge status={activeComplaint.status} size="md" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Diterima: {formatDateShort(activeComplaint.tanggal_diterima)}
                  </p>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="pt-2">
                <StatusStepper steps={COMPLAINT_STEPS} currentStepId={activeComplaint.status} />
              </div>
            </div>

            {/* Content & Thread Card */}
            <div className="card space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Uraian Isi Pengaduan</h3>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {activeComplaint.uraian}
                </p>
              </div>

              {/* Thread Chat (Non-staff mode, excludes internal notes) */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Utas Tanggapan Petugas & Tindak Lanjut
                </h3>
                <ThreadChat
                  messages={activeComplaint.messages || []}
                  isStaff={false}
                  onSendMessage={handleSendReply}
                  readOnly={activeComplaint.status === 'DITUTUP'}
                />
              </div>
            </div>

            {/* Satisfaction Rating Card (Only when Selesai) */}
            {activeComplaint.status === 'SELESAI' && (
              <div className="card space-y-4 bg-emerald-50/50 border-emerald-200">
                <div className="border-b border-emerald-200/60 pb-2">
                  <h3 className="text-sm font-bold text-emerald-900">
                    Penilaian Kepuasan Pelapor (Opsional - FR-51)
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Aduan Anda telah ditandai selesai. Berikan penilaian terhadap respons petugas untuk evaluasi mutu layanan prodi.
                  </p>
                </div>

                {!ratingSubmitted && !activeComplaint.rating_kepuasan ? (
                  <form onSubmit={handleRatingSubmit} className="space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Skor Kepuasan:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rating >= star ? 'text-amber-500 bg-amber-50' : 'text-slate-300'
                            }`}
                          >
                            <Star size={18} fill={rating >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Tuliskan masukan singkat atas pelayanan petugas..."
                      className="input-field text-xs bg-white"
                    />

                    <button type="submit" className="btn-primary text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700">
                      Kirim Penilaian
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={16} />
                    <span>Terima kasih! Penilaian kepuasan Anda telah berhasil disimpan.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}


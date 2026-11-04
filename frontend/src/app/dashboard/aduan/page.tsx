'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import FileUploader from '@/components/ui/FileUploader';
import CopyOnceDialog from '@/components/ui/CopyOnceDialog';
import { generateTicketCode } from '@/lib/utils';
import { mockComplaints } from '@/lib/mock-data';
import { complaintService } from '@/lib/api/services/complaint.service';
import type { ComplaintCategory, Complaint } from '@/lib/types';
import {
  ShieldCheck,
  Send,
  Lock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  KeyRound,
  MessageSquareHeart,
  ChevronRight,
} from 'lucide-react';

export default function KirimAduanAnonimPage() {
  const [kategori, setKategori] = useState<ComplaintCategory>('FASILITAS');
  const [judul, setJudul] = useState('');
  const [uraian, setUraian] = useState('');
  const [kontakSukarela, setKontakSukarela] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !uraian.trim()) {
      alert('Judul dan uraian aduan wajib diisi.');
      return;
    }

    const ticketCode = generateTicketCode();
    const isSensitif = kategori === 'PERUNDUNGAN_KEKERASAN';

    const fullUraian = kontakSukarela.trim()
      ? `${uraian}\n\n[Kontak Sukarela Pelapor: ${kontakSukarela.trim()}]`
      : uraian;

    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      nomor_aduan: `ADU-2025-00${mockComplaints.length + 1}`,
      kode_tiket: ticketCode,
      kode_tiket_hash: `hash_${ticketCode}`,
      kategori,
      judul,
      uraian: fullUraian,
      is_sensitif: isSensitif,
      status: 'DITERIMA',
      tanggal_diterima: new Date().toISOString().split('T')[0],
      messages: [],
      dispositions: [],
    };

    await complaintService.createComplaint(newComplaint);
    setGeneratedTicket(ticketCode);
    setDialogOpen(true);

    // Reset Form
    setJudul('');
    setUraian('');
    setKontakSukarela('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Layanan Pengiriman Aduan Mahasiswa Anonim"
        description="Saluran aspirasi dan pengaduan mahasiswa prodi secara aman, terenkripsi, dan terjamin kerahasiaan identitasnya (NF-04)."
        action={
          <Link
            href="/aduan/lacak"
            target="_blank"
            className="btn-secondary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5"
          >
            <ExternalLink size={14} />
            <span>Lacak Tiket Aduan</span>
          </Link>
        }
      />

      {/* Main LoopAI Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Top KPI Row (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Enkripsi Identitas"
              value="100% Anonim"
              badgeText="Permit NF-04"
              badgeTone="emerald"
              subtitle="Tanpa log NIM, IP & perangkat"
            />
            <StatCard
              title="Target Respons"
              value="≤ 3 Hari"
              badgeText="SLA Prodi"
              badgeTone="indigo"
              subtitle="Tindak lanjut & disposisi cepat"
            />
            <StatCard
              title="Perlindungan Khusus"
              value="Satgas PPKPT"
              badgeText="FR-50 Aktif"
              badgeTone="rose"
              subtitle="Ruang terbatas aduan sensitif"
            />
          </div>

          {kategori === 'PERUNDUNGAN_KEKERASAN' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900 space-y-1 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <Lock size={16} className="text-rose-700" />
                <span>Kategori Sensitif: Penanganan Khusus Perlindungan Korban (FR-50)</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                Aduan perundungan atau kekerasan seksual hanya dapat diakses oleh <strong>Petugas Khusus Kerahasiaan / Satgas PPKPT</strong>. Pimpinan prodi hanya melihat nomor dan status tanpa melihat isi naskah maupun identitas.
              </p>
            </div>
          )}

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-[22px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Formulir Laporan Anonim</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Isi rincian kejadian secara jelas. Anda akan memperoleh Kode Tiket Rahasia setelah mengirim.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Identity Log
              </span>
            </div>

            <div>
              <label className="label">Kategori Pengaduan</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as ComplaintCategory)}
                className="select-field text-sm font-semibold rounded-xl"
              >
                <option value="AKADEMIK">Akademik &amp; Perkuliahan</option>
                <option value="LAYANAN_ADMINISTRASI">Layanan Administrasi Prodi / Tata Usaha</option>
                <option value="FASILITAS">Fasilitas, Laboratorium &amp; Sarana Prasarana</option>
                <option value="DOSEN_TENDIK">Dosen atau Tenaga Kependidikan</option>
                <option value="PERUNDUNGAN_KEKERASAN">
                  Perundungan / Kekerasan Seksual (Sensitif &amp; Terlindungi)
                </option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="label">Judul Pokok Aduan</label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Tuliskan pokok permasalahan secara ringkas..."
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="label">Uraian Lengkap Kejadian / Pengaduan</label>
              <textarea
                rows={4}
                required
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                placeholder="Ceritakan kronologi kejadian, tempat, waktu, dan fakta pendukung secara jelas..."
                className="textarea-field text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="label">
                Kontak Sukarela untuk Pendampingan Resmi (Opsional — FR-50)
              </label>
              <input
                type="text"
                value={kontakSukarela}
                onChange={(e) => setKontakSukarela(e.target.value)}
                placeholder="Kosongkan untuk tetap 100% anonim, atau cantumkan nomor/email sukarela..."
                className="input-field text-sm"
              />
            </div>

            <FileUploader
              label="Lampiran Bukti (Foto, Dokumen, Tangkapan Layar - Opsional)"
              helperText="Format: JPG, PNG, PDF (Metadata EXIF otomatis dibersihkan server)"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Link
                href="/aduan/lacak"
                target="_blank"
                className="text-xs sm:text-sm text-indigo-600 hover:underline inline-flex items-center gap-1.5 font-semibold"
              >
                <ExternalLink size={14} />
                <span>Sudah Punya Kode Tiket? Lacak Aduan di Sini</span>
              </Link>

              <button type="submit" className="btn-primary text-sm py-2.5 px-6 justify-center">
                <Send size={15} />
                <span>Kirim Aduan Anonim</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Top Right Card: Alur Keamanan */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Protokol Kerahasiaan</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Aktif
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-2xl p-3.5 bg-indigo-50/60 border border-indigo-100/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">1. Permit Tanpa Identitas</span>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Sesi pengajuan dipisahkan dari akun SSO mahasiswa sehingga NIM tidak pernah terekam.
                </p>
              </div>

              <div className="rounded-2xl p-3.5 hover:bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">2. Pembersihan EXIF File</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Koordinat lokasi GPS dan identitas kamera pada foto bukti dihapus otomatis.
                </p>
              </div>

              <div className="rounded-2xl p-3.5 hover:bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">3. Kode Tiket Hash</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Hanya pemegang kode tiket yang dapat membuka ruang percakapan tindak lanjut.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Bottom Right Card: Smart Hub */}
          <div className="rounded-[22px] bg-gradient-to-b from-indigo-100/70 via-blue-50/50 to-slate-50/90 border border-indigo-100/90 p-5 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.05)] space-y-4">
            <div className="text-center space-y-1 pt-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Saluran Aman &amp; Responsif 👋
              </p>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Bantuan Layanan Aduan
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/aduan/lacak"
                target="_blank"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Lacak Kode Tiket
                </p>
              </Link>

              <Link
                href="/dashboard/kelola/aduan"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Antrean Pengelola
                </p>
              </Link>

              <Link
                href="/dashboard/kelola/aduan/sensitif"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Satgas PPKPT
                </p>
              </Link>

              <Link
                href="/dashboard/kelola/aduan/rekap"
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between h-24"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Indeks Kepuasan
                </p>
              </Link>
            </div>

            <Link
              href="/aduan/lacak"
              target="_blank"
              className="flex items-center justify-between bg-white rounded-full px-4 py-2.5 border border-slate-200/80 text-xs sm:text-sm text-slate-500 hover:border-indigo-300 transition-colors shadow-2xs"
            >
              <span>Masukkan kode tiket rahasia...</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Dialog Kode Tiket Sekali Tampil */}
      {generatedTicket && (
        <CopyOnceDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          ticketCode={generatedTicket}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert, Send, Copy, Check, Lock, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { generateTicketCode, copyToClipboard } from '@/lib/utils';

export default function Page() {
  const [kategori, setKategori] = useState('AKADEMIK');
  const [judul, setJudul] = useState('');
  const [uraian, setUraian] = useState('');
  const [lampiranName, setLampiranName] = useState('');

  // Ticket modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState('');
  const [copied, setCopied] = useState(false);

  // Track ticket input
  const [trackCode, setTrackCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !uraian.trim()) return;

    const newCode = generateTicketCode();
    setGeneratedTicket(newCode);
    setTicketModalOpen(true);

    // Reset form
    setJudul('');
    setUraian('');
    setLampiranName('');
  };

  const handleCopyTicket = () => {
    copyToClipboard(generatedTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) return;

    // Simulate finding ticket
    setTrackingResult({
      kode: trackCode.trim(),
      status: 'DITINDAKLANJUTI',
      kategori: 'Fasilitas & Sarana',
      tanggal: '2025-10-25',
      tanggapan: 'Pengelola telah mendisposisikan ke staf teknis IT untuk pengecekan proyektor Lab SI-2.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kirim Aduan Anonim"
        description="Layanan penyampaian aspirasi dan aduan civitas akademika secara aman dan terlindungi (FR-47)."
      />

      {/* Jaminan Privasi & Keamanan Anonimitas (PRD FR-47) */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Shield size={20} />
        </div>
        <div className="space-y-1 text-xs text-blue-900 leading-relaxed">
          <h3 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
            Jaminan Kerahasiaan & Privasi Penuh
          </h3>
          <p>
            Identitas mahasiswa (NIM/Nama/IP Jaringan) <strong>TIDAK disimpan</strong> di basis data maupun log sistem.
            Setelah aduan terkirim, Anda akan menerima <strong>Kode Tiket Rahasia</strong> yang wajib Anda simpan untuk melacak tanggapan pengelola.
          </p>
        </div>
      </div>

      {/* Formulir Pengiriman Aduan */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kategori Pengaduan
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="select-field text-xs font-medium"
              >
                <option value="AKADEMIK">Akademik (Perkuliahan & Kurikulum)</option>
                <option value="LAYANAN_ADMINISTRASI">Layanan Administrasi Prodi / TU</option>
                <option value="FASILITAS">Fasilitas & Sarana Laboratorium</option>
                <option value="DOSEN_TENDIK">Dosen / Tenaga Kependidikan</option>
                <option value="PERUNDUNGAN_KEKERASAN">
                  ⚠️ Perundungan & Kekerasan Seksual (Kanal Sensitif PGL-K)
                </option>
                <option value="LAINNYA">Lain-lain / Aspirasi Umum</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Lampiran Bukti (Opsional)
              </label>
              <input
                type="text"
                value={lampiranName}
                onChange={(e) => setLampiranName(e.target.value)}
                placeholder="Contoh: Tangkapan_Layar_Bukti.png (metadata EXIF dibuang otomatis)"
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Alert Khusus untuk Aduan Sensitif (PRD FR-50) */}
          {kategori === 'PERUNDUNGAN_KEKERASAN' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Perhatian Khusus Aduan Sensitif:</strong> Aduan kategori ini ditangani dengan protokol rahasia khusus dan hanya dapat dibaca oleh Pengelola Aduan Penanganan Kekerasan (PGL-K). Pimpinan hanya melihat nomor tiket tanpa membuka isi materi aduan.
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Judul Pokok Pengaduan
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Ringkas inti permasalahan secara jelas..."
              className="input-field text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Uraian Rinci Kejadian / Aspirasi
            </label>
            <textarea
              rows={5}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Ceritakan kronologi, waktu kejadian, dan fakta pendukung tanpa harus mencantumkan nama Anda jika ingin tetap anonim..."
              className="input-field text-xs resize-none leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
            >
              <Send size={14} /> Kirim Pengaduan Sekarang
            </button>
          </div>
        </form>
      </div>

      {/* Bagian Lacak Tiket yang Sudah Ada */}
      <div className="card space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Search size={15} className="text-blue-600" /> Lacak Status Pengaduan dengan Kode Tiket
        </h3>
        <p className="text-xs text-slate-500">
          Masukkan kode tiket rahasia yang Anda peroleh saat mengirim aduan untuk melihat tanggapan pengelola.
        </p>

        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            value={trackCode}
            onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
            placeholder="Contoh: ADU-W7K9-PX42-M8L1"
            className="input-field font-mono text-xs max-w-sm uppercase"
          />
          <button type="submit" className="btn-secondary text-xs px-4 py-2">
            Lacak Aduan
          </button>
        </form>

        {trackingResult && (
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800">{trackingResult.kode}</span>
              <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Status: {trackingResult.status}
              </span>
            </div>
            <div className="text-slate-600">
              <strong>Tanggapan Petugas:</strong> {trackingResult.tanggapan}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Kode Tiket Muncul Sekali (PRD FR-48) */}
      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Pengaduan Berhasil Dikirim!"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              Pengaduan Anda telah masuk ke sistem prodi tanpa identitas pengirim. Simpan kode tiket di bawah ini baik-baik!
            </div>
          </div>

          <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              Kode Tiket Pelacakan Rahasia:
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 tracking-wider">
              {generatedTicket}
            </div>
            <button
              onClick={handleCopyTicket}
              className="btn-primary text-xs px-4 py-1.5 inline-flex items-center gap-1.5 mt-2"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Kode Tersalin!' : 'Salin Kode Tiket'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center italic">
            *Penting: Kode tiket ini hanya ditampilkan satu kali dan tidak dapat dipulihkan jika hilang.
          </p>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTicketModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Saya Sudah Menyimpan Kode
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

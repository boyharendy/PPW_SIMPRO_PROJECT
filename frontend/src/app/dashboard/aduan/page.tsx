'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FileUploader from '@/components/ui/FileUploader';
import CopyOnceDialog from '@/components/ui/CopyOnceDialog';
import { generateTicketCode } from '@/lib/utils';
import { mockComplaints } from '@/lib/mock-data';
import { complaintService } from '@/lib/api/services/complaint.service';
import type { ComplaintCategory, Complaint } from '@/lib/types';
import { ShieldCheck, Send, Lock, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function KirimAduanAnonimPage() {
  const [kategori, setKategori] = useState<ComplaintCategory>('FASILITAS');
  const [judul, setJudul] = useState('');
  const [uraian, setUraian] = useState('');
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

    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      nomor_aduan: `ADU-2025-00${mockComplaints.length + 1}`,
      kode_tiket: ticketCode,
      kode_tiket_hash: `hash_${ticketCode}`,
      kategori,
      judul,
      uraian,
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
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Layanan Aduan Mahasiswa Anonim"
        description="Saluran aspirasi dan pengaduan mahasiswa prodi secara aman, terenkripsi, dan terjamin kerahasiaan identitasnya."
      />

      {/* Privacy Guarantee Statement (NF-04) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
          <ShieldCheck size={18} className="text-blue-600" />
          <span>Jaminan Kerahasiaan &amp; Anonimitas Pelapor (NF-04)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sistem menggunakan <strong>permit anonim bertanda tangan</strong>. Identitas akun, NIM, email, alamat IP, dan metadata perangkat Anda <strong>tidak pernah disimpan</strong> pada basis data maupun log sistem. Setelah pengiriman, Anda akan menerima <strong>Kode Tiket Rahasia</strong> untuk memantau status tindak lanjut aduan secara mandiri.
        </p>
      </div>

      {kategori === 'PERUNDUNGAN_KEKERASAN' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-950">
            <Lock size={14} className="text-rose-700" />
            <span>Kategori Sensitif: Penanganan Khusus Perlindungan Korban (FR-50)</span>
          </div>
          <p className="text-[11px] text-rose-900 leading-relaxed">
            Aduan perundungan atau kekerasan seksual hanya dapat diakses oleh <strong>Petugas Khusus Kerahasiaan / Satgas PPKPT</strong>. Pimpinan prodi hanya melihat nomor dan status tanpa melihat isi naskah maupun identitas.
          </p>
        </div>
      )}

      {/* Form Aduan */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <div>
            <label className="label">Kategori Pengaduan</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as ComplaintCategory)}
              className="select-field text-xs font-semibold"
            >
              <option value="AKADEMIK">Akademik & Perkuliahan</option>
              <option value="LAYANAN_ADMINISTRASI">Layanan Administrasi Prodi / Tata Usaha</option>
              <option value="FASILITAS">Fasilitas, Laboratorium & Sarana Prasarana</option>
              <option value="DOSEN_TENDIK">Dosen atau Tenaga Kependidikan</option>
              <option value="PERUNDUNGAN_KEKERASAN">
                Perundungan / Kekerasan Seksual (Sensitif & Terlindungi)
              </option>
              <option value="LAINNYA">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="label">Judul Aduan</label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Tuliskan pokok permasalahan secara ringkas..."
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="label">Uraian Lengkap Kejadian / Pengaduan</label>
            <textarea
              rows={5}
              required
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Ceritakan kronologi kejadian, tempat, waktu, dan fakta pendukung secara jelas..."
              className="textarea-field text-xs leading-relaxed"
            />
          </div>

          <FileUploader
            label="Lampiran Bukti (Foto, Dokumen, Tangkapan Layar - Opsional)"
            helperText="Format: JPG, PNG, PDF (Metadata EXIF akan otomatis dibersihkan server)"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/aduan/lacak"
            target="_blank"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <ExternalLink size={14} />
            <span>Sudah Punya Kode Tiket? Lacak Aduan di Sini</span>
          </Link>

          <button type="submit" className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
            <Send size={15} />
            <span>Kirim Aduan Anonim</span>
          </button>
        </div>
      </form>

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


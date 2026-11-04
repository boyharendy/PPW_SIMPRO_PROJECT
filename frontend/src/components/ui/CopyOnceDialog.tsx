'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { copyToClipboard } from '@/lib/utils';
import { Copy, Check, Download, AlertTriangle } from 'lucide-react';

interface CopyOnceDialogProps {
  open: boolean;
  onClose: () => void;
  ticketCode: string;
}

export default function CopyOnceDialog({ open, onClose, ticketCode }: CopyOnceDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(ticketCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([
      `KODE TIKET ADUAN MAHASISWA SIMPRO\n=================================\nKode Tiket : ${ticketCode}\nTanggal    : ${new Date().toLocaleDateString('id-ID')}\n\nPENTING: Simpan kode ini untuk melacak perkembangan aduan Anda secara anonim di portal SIMPRO (Menu: Lacak Tiket Aduan). Jika kode hilang, aduan tidak dapat dilacak kembali demi menjaga privasi Anda.\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `TIKET_ADUAN_${ticketCode}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal open={open} onClose={onClose} title="Aduan Berhasil Dikirim!" size="md">
      <div className="space-y-5 text-center sm:text-left">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-left">
            <strong>Penting:</strong> Demi menjamin kerahasiaan identitas Anda secara anonim, sistem <strong>tidak pernah menyimpan data akun atau email pelapor</strong>. Simpan kode tiket di bawah ini karena hanya ditampilkan satu kali!
          </p>
        </div>

        <div className="bg-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-5 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode Tiket Pelacak Aduan</p>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-wider select-all">
            {ticketCode}
          </div>
          <p className="text-[11px] text-slate-400">Gunakan kode ini di halaman publik Lacak Tiket Aduan</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`btn-primary w-full sm:w-auto justify-center ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Berhasil Disalin!' : 'Salin Kode Tiket'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="btn-secondary w-full sm:w-auto justify-center"
          >
            <Download size={16} />
            <span>Unduh Catatan (.txt)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-2 font-semibold"
          >
            Saya Sudah Menyimpan Kode
          </button>
        </div>
      </div>
    </Modal>
  );
}


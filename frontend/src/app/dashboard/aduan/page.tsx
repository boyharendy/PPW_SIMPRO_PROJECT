'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { complaintService } from '@/lib/api/services/complaint.service';
import MotionCard from '@/components/motion/MotionCard';

const categories = [
  ['AKADEMIK', 'Akademik'], ['LAYANAN_ADMINISTRASI', 'Layanan administrasi'],
  ['KEUANGAN_ADMINISTRASI', 'Keuangan'], ['FASILITAS', 'Fasilitas'], ['DOSEN_TENDIK', 'Dosen dan tenaga kependidikan'],
  ['PERUNDUNGAN_KEKERASAN', 'Perundungan dan kekerasan'], ['LAINNYA', 'Lainnya'],
];

export default function ComplaintPage() {
  const [ticket, setTicket] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError('');
    try {
      const result = await complaintService.create(data);
      setTicket(result.kode_tiket); setCopied(false); form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aduan gagal dikirim.');
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <PageHeader title="Kirim Aduan Anonim" description="Akun mahasiswa digunakan untuk memperoleh izin kirim. Simpan kode tiket untuk membaca tanggapan petugas." />
    <MotionCard index={0} interactive={false} className="card">
      <form className="space-y-4" onSubmit={send}>
        <label className="block">Kategori<select className="input-field" name="kategori">{categories.map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <label className="block">Judul<input className="input-field" name="judul" required /></label>
        <label className="block">Uraian<textarea className="textarea-field" name="isi_aduan" rows={5} required /></label>
        <label className="block">Lampiran opsional<input className="input-field" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" /></label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Mengirim...' : 'Kirim aduan'}</button>
      </form>
    </MotionCard>
    <Link className="btn-secondary" href="/aduan/lacak">Lacak aduan dengan kode tiket</Link>
    <Modal open={Boolean(ticket)} onClose={() => setTicket('')} title="Simpan kode tiket Anda" size="md">
      <div className="space-y-4">
        <p>Kode ini ditampilkan sekali. Anda memerlukannya untuk membaca atau membalas pesan petugas.</p>
        <p className="font-mono break-all select-all">{ticket}</p>
        <button className="btn-secondary" onClick={async () => {
          try { await navigator.clipboard.writeText(ticket); setCopied(true); } catch { setCopied(false); }
        }}>{copied ? 'Tersalin' : 'Salin kode'}</button>
        <button className="btn-primary" onClick={() => setTicket('')}>Saya sudah menyimpan kode</button>
      </div>
    </Modal>
  </div>;
}

'use client';

import { useState, type FormEvent } from 'react';
import PublicShell from '@/components/layout/PublicShell';
import StatusStepper from '@/components/ui/StatusStepper';
import { complaintService, type PublicCase } from '@/lib/api/services/complaint.service';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

const steps = [
  { id: 'DITERIMA', label: 'Diterima' }, { id: 'DIVERIFIKASI', label: 'Diverifikasi' },
  { id: 'DITINDAKLANJUTI', label: 'Ditindaklanjuti' }, { id: 'SELESAI', label: 'Selesai' },
  { id: 'DITUTUP', label: 'Ditutup' },
];

export default function PublicLacakAduanPage() {
  const [input, setInput] = useState('');
  const [ticket, setTicket] = useState('');
  const [record, setRecord] = useState<PublicCase | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, action: 'track' | 'reply' | 'rate') {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = action === 'track' ? input.trim() : ticket;
    setBusy(true);
    setError('');
    if (action === 'track') { setRecord(null); setTicket(''); }
    try {
      if (action === 'reply') {
        data.set('ticket', code);
        await complaintService.reply(data);
        form.reset();
      }
      if (action === 'rate') {
        await complaintService.rate(code, Number(data.get('rating')), String(data.get('komentar') || ''));
      }
      setRecord(await complaintService.track(code));
      setTicket(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permintaan gagal. Silakan coba kembali.');
    } finally { setBusy(false); }
  }

  async function download(id: string) {
    setError('');
    try {
      const { url } = await complaintService.attachment(ticket, id);
      const link = document.createElement('a');
      link.href = new URL(url, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').href;
      link.rel = 'noreferrer noopener'; link.target = '_blank'; link.click();
    } catch { setError('Lampiran belum dapat dibuka.'); }
  }

  return (
    <PublicShell title="Lacak aduan anonim" badgeText="Akses kode tiket">
      <div className="space-y-5">
        <MotionCard index={0} interactive={false} className="card">
          <form className="space-y-3" onSubmit={e => submit(e, 'track')}>
            <label htmlFor="ticket" className="block text-sm font-semibold">Kode tiket rahasia</label>
            <div className="flex gap-2">
              <input id="ticket" className="input-field font-mono" required autoComplete="off" spellCheck={false}
                value={input} disabled={busy} onChange={e => { setInput(e.target.value); setRecord(null); setTicket(''); }} />
              <button className="btn-primary" disabled={busy}>Lacak</button>
            </div>
          </form>
        </MotionCard>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        {record && <>
          <MotionCard as="section" index={0} interactive={false} className="card space-y-3">
            <WordRevealHeading as="h2" text={record.nomor_aduan} className="font-semibold" />
            <p className="text-sm">{record.kategori.replaceAll('_', ' ')} &middot; {record.tanggal_diterima}</p>
            <StatusStepper steps={steps} currentStepId={record.status} />
            {record.lampiran_id && <button className="btn-secondary" onClick={() => download(record.lampiran_id!)}>Buka lampiran awal</button>}
          </MotionCard>
          <MotionCard as="section" index={1} interactive={false} className="card space-y-4">
            <WordRevealHeading as="h2" text="Percakapan dengan petugas" className="font-semibold" />
            {record.messages.length === 0 && <p className="text-sm text-slate-500">Belum ada pesan.</p>}
            {record.messages.map((m, i) => <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
              <strong>{m.pengirim === 'PELAPOR' ? 'Pelapor' : 'Petugas'}</strong> ? {m.tanggal}
              <p className="whitespace-pre-wrap">{m.isi}</p>
              {m.lampiran_id && <button className="btn-secondary" onClick={() => download(m.lampiran_id!)}>Buka lampiran pesan</button>}
            </div>)}
            {record.status !== 'DITUTUP' && <form className="space-y-3" onSubmit={e => submit(e, 'reply')}>
              <label className="block">Balasan<textarea name="pesan" className="textarea-field" required /></label>
              <label className="block text-sm">Lampiran opsional<input className="input-field" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" /></label>
              <button className="btn-primary" disabled={busy}>Kirim balasan</button>
            </form>}
          </MotionCard>
          {['SELESAI','DITUTUP'].includes(record.status) && <MotionCard as="section" index={2} interactive={false} className="card">
            {record.rating_kepuasan ? <p>Penilaian Anda {record.rating_kepuasan}/5</p> :
              <form className="space-y-3" onSubmit={e => submit(e, 'rate')}>
                <label className="block">Nilai penanganan<select name="rating" className="input-field" defaultValue="5">{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></label>
                <label className="block">Komentar opsional<textarea name="komentar" className="textarea-field" /></label>
                <button className="btn-primary" disabled={busy}>Simpan penilaian</button>
              </form>}
          </MotionCard>}
        </>}
      </div>
    </PublicShell>
  );
}

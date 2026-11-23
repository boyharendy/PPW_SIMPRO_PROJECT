'use client';

import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { type CaseRow, useCaseData } from '@/components/aduan/CaseList';
import { apiClient } from '@/lib/api/client';
import { useApp } from '@/lib/context';
import MotionCard from '@/components/motion/MotionCard';
import WordRevealHeading from '@/components/motion/WordRevealHeading';

export default function Page() {
  const { id } = useParams<{id:string}>();
  const { user } = useApp();
  const { data, error, reload } = useCaseData<CaseRow>('/aduan/' + id);
  const [feedback,setFeedback] = useState('');
  const [busy,setBusy] = useState(false);
  const manages = ['PENGELOLA_ADUAN','PETUGAS_KEKERASAN','KAPRODI'].includes(user.activeRole);
  async function act(path: string, body: Record<string,unknown>) {
    if (busy) return;
    setBusy(true); setFeedback('');
    try { await apiClient.post('/aduan/'+id+'/'+path, body); reload(); setFeedback('Perubahan tersimpan.'); }
    catch (e) { setFeedback(e instanceof Error ? e.message : 'Perubahan gagal disimpan.'); }
    finally { setBusy(false); }
  }
  function postForm(e: FormEvent<HTMLFormElement>, path: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fields: Record<string,unknown> = Object.fromEntries(form);
    if (path === 'messages') fields.is_catatan_internal = form.has('internal');
    void act(path,fields);
  }
  async function download(attachment: string) {
    try {
      const response = await apiClient.get<{url:string}>('/attachments/'+attachment+'/url');
      const link=document.createElement('a');
      link.href=new URL(response.data.url,process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').href;
      link.target='_blank';link.rel='noopener noreferrer';link.click();
    } catch { setFeedback('Lampiran tidak dapat dibuka.'); }
  }
  return <div className="space-y-4"><PageHeader title="Detail Aduan" />
    {error ? <p role="alert">{error}</p> : !data ? <p>Memuat aduan...</p> : <>
      <MotionCard as="section" index={0} interactive={false} className="card space-y-2"><WordRevealHeading as="h2" text={data.nomor_aduan} className="font-bold" /><p>{data.kategori} &middot; {data.status}</p>
        {data.judul && <h3>{data.judul}</h3>}<p className="whitespace-pre-wrap">{data.isi_aduan}</p>
        {data.lampiran_url && <button className="btn-secondary" onClick={() => download(data.lampiran_url!)}>Buka lampiran</button>}
      </MotionCard>
      {data.isi_aduan && <MotionCard as="section" index={1} interactive={false} className="card space-y-4"><WordRevealHeading as="h2" text="Penanganan aduan" className="font-semibold" />
        {data.messages?.map(m => <div className="rounded bg-slate-50 p-2" key={m.id}>
          <strong>{m.is_catatan_internal?'Catatan internal':m.sender_type}</strong><p className="whitespace-pre-wrap">{m.pesan}</p>
          {m.lampiran_url && <button className="btn-secondary" onClick={() => download(m.lampiran_url!)}>Lampiran pesan</button>}
        </div>)}
        <fieldset disabled={busy} className="space-y-4">
          <form onSubmit={e=>postForm(e,'messages')} className="space-y-2">
            <label className="block">Pesan<textarea className="textarea-field" name="pesan" required /></label>
            <label className="block"><input type="checkbox" name="internal" defaultChecked /> Catatan internal petugas</label>
            <button className="btn-primary">Kirim pesan</button>
          </form>
          {manages && data.status==='DITERIMA' && <button className="btn-secondary" onClick={()=>act('verify',{})}>Verifikasi aduan</button>}
          {manages && <details><summary>Disposisikan aduan</summary><form onSubmit={e=>postForm(e,'dispositions')} className="space-y-2">
            <label className="block">ID petugas tujuan<input name="kepada_petugas_id" className="input-field" required /></label>
            <label className="block">Tenggat<input name="deadline" type="date" className="input-field" required /></label>
            <label className="block">Catatan<textarea className="textarea-field" name="catatan" required /></label>
            <button className="btn-primary">Simpan disposisi</button>
          </form></details>}
          {manages && data.is_sensitif && <details><summary>Catat penerusan ke Satgas</summary><form onSubmit={e=>postForm(e,'forward-satgas')} className="space-y-2">
            <label className="block">Nomor referensi<input className="input-field" name="nomor_referensi" required /></label>
            <label className="block">Petugas Satgas<input className="input-field" name="petugas_satgas" required /></label>
            <button className="btn-primary">Catat penerusan</button>
          </form></details>}
          {!['SELESAI','DITUTUP'].includes(data.status) && <details><summary>Selesaikan aduan</summary><form onSubmit={e=>postForm(e,'resolve')}>
            <label className="block">Solusi<textarea className="textarea-field" name="solusi" required /></label><button className="btn-primary">Simpan penyelesaian</button>
          </form></details>}
          {manages && data.status==='SELESAI' && <form onSubmit={e=>postForm(e,'close')}>
            <label className="block">Alasan penutupan<input className="input-field" name="alasan" required /></label><button className="btn-secondary">Tutup aduan</button>
          </form>}
        </fieldset>
      </MotionCard>}
    </>}
    {feedback && <p role="status">{feedback}</p>}
  </div>;
}

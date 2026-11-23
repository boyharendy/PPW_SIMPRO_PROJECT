'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import MotionCard from '@/components/motion/MotionCard';

export interface CaseRow {
  id: string; nomor_aduan: string; kategori: string; status: string; is_sensitif: boolean;
  judul?: string; isi_aduan?: string; tanggal_pengaduan: string; lampiran_url?: string;
  messages?: { id: string; pesan: string; sender_type: string; is_catatan_internal: boolean; lampiran_url?: string }[];
}

export function useCaseData<T>(path: string) {
  const [result, setResult] = useState<{ path: string; data?: T; error?: string }>();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    apiClient.get<T>(path, { cache: 'no-store', signal: controller.signal }).then(res => {
      if (active) setResult({ path, data: res.data ?? undefined });
    }).catch(() => { if (active) setResult({ path, error: 'Data tidak tersedia atau akses Anda telah berubah.' }); });
    return () => { active = false; controller.abort(); };
  }, [path, version]);
  return { ...(result?.path === path ? result : {}), reload: () => setVersion(v => v + 1) };
}

export default function CaseList({ assigned = false, sensitive = false }: { assigned?: boolean; sensitive?: boolean }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const query = new URLSearchParams({ page: String(page), limit: '20', status });
  if (sensitive) query.set('is_sensitif', 'true');
  const { data, error } = useCaseData<CaseRow[]>(assigned ? '/aduan/my-dispositions' : '/aduan?' + query);
  const rows = (data || []).filter(row => (!sensitive || row.is_sensitif) && (!status || row.status === status));
  return <MotionCard as="section" index={0} interactive={false} className="card space-y-4">
    <label className="block text-sm">Status<select className="input-field" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
      <option value="">Semua status</option>{['DITERIMA','DIVERIFIKASI','DIDISPOSISIKAN','DITINDAKLANJUTI','SELESAI','DITUTUP'].map(v => <option key={v}>{v}</option>)}
    </select></label>
    {error ? <p role="alert">{error}</p> : !data ? <p>Memuat aduan...</p> : !rows.length ? <p>Tidak ada aduan dalam daftar ini.</p> :
      <ul className="divide-y">{rows.map(c => <li key={c.id} className="py-3">
        <Link href={'/dashboard/kelola/aduan/' + c.id} className="font-semibold text-blue-700">{c.judul || c.nomor_aduan}</Link>
        <p className="text-sm">{c.kategori.replaceAll('_',' ')} &middot; {c.status} &middot; {c.tanggal_pengaduan}</p>
      </li>)}</ul>}
    {!assigned && <div className="flex gap-2">
      <button className="btn-secondary" disabled={page===1} onClick={() => setPage(p => p-1)}>Sebelumnya</button>
      <button className="btn-secondary" disabled={(data?.length || 0)<20} onClick={() => setPage(p => p+1)}>Berikutnya</button>
    </div>}
  </MotionCard>;
}

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type { BusinessTrip } from '@/lib/types';
import { getStatusLabel } from '@/lib/utils';

export default function TripProofList({ proofs }: Pick<BusinessTrip, 'proofs'>) {
  const [error, setError] = useState('');
  if (!proofs?.length) return null;

  async function download(attachmentId: string) {
    setError('');
    try {
      const res = await apiClient.get<{ url: string }>('/attachments/' + encodeURIComponent(attachmentId) + '/url');
      const link = document.createElement('a');
      link.href = new URL(res.data.url, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch {
      setError('Bukti tidak tersedia atau akses ditolak.');
    }
  }

  return <section className="card space-y-2">
    <h2 className="font-semibold">Bukti perjalanan</h2>
    {error && <p role="alert">{error}</p>}
    <ul>{proofs.map(proof => <li key={proof.id} className="flex gap-2">
      <span>{getStatusLabel(proof.kategori)}</span>
      {proof.file_url && <button className="text-blue-700 underline" onClick={() => download(proof.file_url!)}>{proof.file_name}</button>}
    </li>)}</ul>
  </section>;
}

import { apiClient } from '../client';
import type { ApiResponse } from '../../types/api';
import type { ComplaintStatus } from '../../types';

export interface PublicCase {
  nomor_aduan: string;
  kategori: string;
  status: ComplaintStatus;
  tanggal_diterima: string;
  rating_kepuasan?: number;
  lampiran_id?: string;
  messages: { pengirim: string; isi: string; tanggal: string; lampiran_id?: string }[];
}

type Action = 'create' | 'track' | 'messages' | 'rating' | 'attachment';

async function anonymous<T>(action: Action, body: FormData | Record<string, unknown>): Promise<T> {
  const multipart = body instanceof FormData;
  if (multipart && body.get('file') instanceof File && !(body.get('file') as File).name) body.delete('file');
  const response = await fetch('/api/aduan/' + action, {
    method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
    headers: multipart ? undefined : { 'Content-Type': 'application/json' },
    body: multipart ? body : JSON.stringify(body),
  });
  const result: ApiResponse<T> = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Permintaan aduan gagal.');
  return result.data as T;
}

export const complaintService = {
  async create(form: FormData) {
    const permit = await apiClient.post<{ permit_token: string }>('/aduan/permit');
    if (!permit.data?.permit_token) throw new Error('Permit mahasiswa gagal diterbitkan.');
    form.set('permit_token', permit.data.permit_token);
    return anonymous<{ kode_tiket: string }>('create', form);
  },
  track: (ticket: string) => anonymous<PublicCase>('track', { ticket }),
  reply: (form: FormData) => anonymous<void>('messages', form),
  rate: (ticket: string, rating: number, komentar: string) => anonymous<void>('rating', { ticket, rating, komentar }),
  attachment: (ticket: string, id: string) => anonymous<{ url: string }>('attachment', { ticket, id }),
};

export default complaintService;

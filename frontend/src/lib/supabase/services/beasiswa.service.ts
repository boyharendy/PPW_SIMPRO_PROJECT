import { supabase } from '../client';
import type {
  ScholarshipRecipient,
  ScholarshipWorkLog,
  ScholarshipStatus,
  WorkLogStatus,
  WorkLogCategory,
} from '@/lib/types';

// ============================================================
// Helper mapper: Supabase row → ScholarshipRecipient
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPenerima(row: any): ScholarshipRecipient {
  return {
    id: row.id,
    mahasiswa_nim: row.mahasiswa_nim,
    mahasiswa_nama: row.mahasiswa_nama,
    angkatan: row.angkatan,
    program_studi: row.program_studi,
    jenis_beasiswa: row.jenis_beasiswa,
    pemberi_beasiswa: row.pemberi_beasiswa,
    periode: row.periode,
    kewajiban_jam: row.kewajiban_jam,
    jam_terverifikasi: row.jam_terverifikasi ?? 0,
    jam_menunggu: row.jam_menunggu ?? 0,
    status: row.status as ScholarshipStatus,
    dosen_verifikator_id: row.dosen_verifikator_id ?? '',
    dosen_verifikator_nama: row.dosen_verifikator_nama,
    is_berisiko: row.is_berisiko ?? false,
    catatan: row.catatan ?? undefined,
    created_at: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLog(row: any): ScholarshipWorkLog {
  return {
    id: row.id,
    penerima_id: row.penerima_id,
    mahasiswa_nim: row.mahasiswa_nim,
    mahasiswa_nama: row.mahasiswa_nama,
    tanggal_kegiatan: row.tanggal_kegiatan,
    kategori: row.kategori as WorkLogCategory,
    deskripsi_kegiatan: row.deskripsi_kegiatan,
    jumlah_jam: row.jumlah_jam,
    bukti_nama_berkas: row.bukti_nama_berkas ?? undefined,
    status: row.status as WorkLogStatus,
    dosen_verifikator_id: row.dosen_verifikator_id ?? undefined,
    dosen_verifikator_nama: row.dosen_verifikator_nama ?? undefined,
    catatan_verifikator: row.catatan_verifikator ?? undefined,
    diverifikasi_at: row.diverifikasi_at ?? undefined,
    created_at: row.created_at,
  };
}

// ============================================================
// Service — Modul 2: Beasiswa & Jam Karya
// ============================================================
export const supabaseBeasiswa = {

  // --- Penerima Beasiswa ---

  async getPenerimaAll(filters?: {
    status?: string;
    periode?: string;
    jenis?: string;
  }): Promise<ScholarshipRecipient[]> {
    let q = supabase
      .from('beasiswa_penerima')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'ALL') q = q.eq('status', filters.status);
    if (filters?.periode) q = q.eq('periode', filters.periode);
    if (filters?.jenis) q = q.ilike('jenis_beasiswa', `%${filters.jenis}%`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapPenerima);
  },

  async createPenerima(payload: {
    mahasiswa_nim: string;
    mahasiswa_nama: string;
    angkatan: number;
    program_studi?: string;
    jenis_beasiswa: string;
    pemberi_beasiswa: string;
    periode: string;
    kewajiban_jam: number;
    dosen_verifikator_nama: string;
  }): Promise<ScholarshipRecipient> {
    const { data, error } = await supabase
      .from('beasiswa_penerima')
      .insert([{
        ...payload,
        program_studi: payload.program_studi ?? 'Sistem Informasi',
        status: 'AKTIF',
        jam_terverifikasi: 0,
        jam_menunggu: 0,
        is_berisiko: false,
      }])
      .select()
      .single();
    if (error) throw error;
    return mapPenerima(data);
  },

  async updatePenerimaStatus(id: string, status: ScholarshipStatus): Promise<ScholarshipRecipient> {
    const { data, error } = await supabase
      .from('beasiswa_penerima')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapPenerima(data);
  },

  // --- Log Jam Karya ---

  async getLogsAll(filters?: {
    penerima_id?: string;
    status?: string;
    mahasiswa_nim?: string;
  }): Promise<ScholarshipWorkLog[]> {
    let q = supabase
      .from('jam_karya_logs')
      .select('*')
      .order('tanggal_kegiatan', { ascending: false });

    if (filters?.penerima_id) q = q.eq('penerima_id', filters.penerima_id);
    if (filters?.status && filters.status !== 'ALL') q = q.eq('status', filters.status);
    if (filters?.mahasiswa_nim) q = q.eq('mahasiswa_nim', filters.mahasiswa_nim);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapLog);
  },

  async getLogsByPenerima(penerimaId: string): Promise<ScholarshipWorkLog[]> {
    const { data, error } = await supabase
      .from('jam_karya_logs')
      .select('*')
      .eq('penerima_id', penerimaId)
      .order('tanggal_kegiatan', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapLog);
  },

  async getLogsMenunggu(): Promise<ScholarshipWorkLog[]> {
    const { data, error } = await supabase
      .from('jam_karya_logs')
      .select('*')
      .eq('status', 'MENUNGGU')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapLog);
  },

  async createLog(payload: {
    penerima_id: string;
    mahasiswa_nim: string;
    mahasiswa_nama: string;
    tanggal_kegiatan: string;
    kategori: WorkLogCategory;
    deskripsi_kegiatan: string;
    jumlah_jam: number;
    bukti_nama_berkas?: string;
  }): Promise<ScholarshipWorkLog> {
    const { data, error } = await supabase
      .from('jam_karya_logs')
      .insert([{ ...payload, status: 'MENUNGGU' }])
      .select()
      .single();
    if (error) throw error;
    return mapLog(data);
  },

  async verifikasiLog(id: string, action: {
    status: 'TERVERIFIKASI' | 'DITOLAK';
    dosen_verifikator_nama: string;
    catatan_verifikator?: string;
  }): Promise<ScholarshipWorkLog> {
    const { data, error } = await supabase
      .from('jam_karya_logs')
      .update({
        status: action.status,
        dosen_verifikator_nama: action.dosen_verifikator_nama,
        catatan_verifikator: action.catatan_verifikator ?? null,
        diverifikasi_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapLog(data);
  },

  // --- Rekap ringkasan pemenuhan jam ---
  async getRekapPemenuhan(periode?: string): Promise<{
    total: number;
    terpenuhi: number;
    berisiko: number;
    aktif: number;
    avgPemenuhan: number;
  }> {
    let q = supabase
      .from('beasiswa_penerima')
      .select('kewajiban_jam, jam_terverifikasi, status, is_berisiko');
    if (periode) q = q.eq('periode', periode);

    const { data, error } = await q;
    if (error) throw error;
    const rows = data ?? [];
    const total = rows.length;
    const terpenuhi = rows.filter(r => r.status === 'SELESAI').length;
    const berisiko = rows.filter(r => r.is_berisiko).length;
    const aktif = rows.filter(r => r.status === 'AKTIF').length;
    const avgPemenuhan = total > 0
      ? Math.round(
          rows.reduce((acc, r) => acc + Math.min(100, Math.round((r.jam_terverifikasi / r.kewajiban_jam) * 100)), 0)
          / total
        )
      : 0;
    return { total, terpenuhi, berisiko, aktif, avgPemenuhan };
  },
};

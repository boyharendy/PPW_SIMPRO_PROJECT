import { supabase } from '../client';
import type {
  ClassPerwalianReport,
  DosenWaliSessionReport,
  AttentionStudent,
  DosenWaliStudentNote,
  PerwalianStatus,
  PerwalianSessionType,
  Semester,
} from '@/lib/types';

// ============================================================
// Helper mapper: Supabase row → ClassPerwalianReport
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLaporan(row: any): ClassPerwalianReport {
  return {
    id: row.id,
    kelas: row.kelas,
    angkatan: row.angkatan,
    semester: row.semester as Semester,
    tahun_akademik: row.tahun_akademik,
    ketua_kelas_nim: row.ketua_kelas_nim,
    ketua_kelas_nama: row.ketua_kelas_nama,
    dosen_wali_id: row.dosen_wali_id ?? '',
    dosen_wali_nama: row.dosen_wali_nama,
    kondisi_umum: row.kondisi_umum ?? '',
    kendala_akademik: row.kendala_akademik ?? '',
    kendala_non_akademik: row.kendala_non_akademik ?? '',
    aspirasi_mahasiswa: row.aspirasi_mahasiswa ?? '',
    mahasiswa_perhatian: (row.mahasiswa_perhatian ?? []) as AttentionStudent[],
    status: row.status as PerwalianStatus,
    catatan_verifikasi_dosen: row.catatan_verifikasi_dosen ?? undefined,
    diverifikasi_at: row.diverifikasi_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSesi(row: any): DosenWaliSessionReport {
  return {
    id: row.id,
    dosen_wali_id: row.dosen_wali_id ?? '',
    dosen_wali_nama: row.dosen_wali_nama,
    kelas: row.kelas,
    angkatan: row.angkatan,
    semester: row.semester as Semester,
    tahun_akademik: row.tahun_akademik,
    sesi: row.sesi as PerwalianSessionType,
    tanggal_sesi: row.tanggal_sesi,
    total_mahasiswa: row.total_mahasiswa,
    hadir_mahasiswa: row.hadir_mahasiswa,
    topik_bahasan: row.topik_bahasan ?? '',
    catatan_per_mahasiswa: (row.catatan_per_mahasiswa ?? []) as DosenWaliStudentNote[],
    rekomendasi: row.rekomendasi ?? '',
    rencana_tindak_lanjut: row.rencana_tindak_lanjut ?? '',
    status: row.status as 'DRAF' | 'SELESAI',
    created_at: row.created_at,
  };
}

// ============================================================
// Service — Modul 1: Laporan Perwalian
// ============================================================
export const supabasePerwalian = {

  // --- Laporan Ketua Kelas ---

  async getLaporanAll(filters?: {
    tahun_akademik?: string;
    semester?: string;
    angkatan?: string;
    status?: string;
  }): Promise<ClassPerwalianReport[]> {
    let q = supabase
      .from('laporan_perwalian_kelas')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.tahun_akademik) q = q.eq('tahun_akademik', filters.tahun_akademik);
    if (filters?.semester && filters.semester !== 'ALL') q = q.eq('semester', filters.semester);
    if (filters?.angkatan && filters.angkatan !== 'ALL') q = q.eq('angkatan', Number(filters.angkatan));
    if (filters?.status && filters.status !== 'ALL') q = q.eq('status', filters.status);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapLaporan);
  },

  async createLaporan(payload: {
    kelas: string;
    angkatan: number;
    semester: Semester;
    tahun_akademik: string;
    ketua_kelas_nim: string;
    ketua_kelas_nama: string;
    dosen_wali_nama: string;
    kondisi_umum: string;
    kendala_akademik: string;
    kendala_non_akademik: string;
    aspirasi_mahasiswa: string;
    mahasiswa_perhatian: AttentionStudent[];
    status: PerwalianStatus;
  }): Promise<ClassPerwalianReport> {
    const { data, error } = await supabase
      .from('laporan_perwalian_kelas')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return mapLaporan(data);
  },

  async updateLaporanStatus(id: string, updates: {
    status: PerwalianStatus;
    catatan_verifikasi_dosen?: string;
    diverifikasi_at?: string;
  }): Promise<ClassPerwalianReport> {
    const { data, error } = await supabase
      .from('laporan_perwalian_kelas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapLaporan(data);
  },

  // --- Sesi Bimbingan Dosen Wali ---

  async getSesiAll(filters?: {
    tahun_akademik?: string;
    kelas?: string;
    dosen_wali_id?: string;
  }): Promise<DosenWaliSessionReport[]> {
    let q = supabase
      .from('sesi_bimbingan_perwalian')
      .select('*')
      .order('tanggal_sesi', { ascending: false });

    if (filters?.tahun_akademik) q = q.eq('tahun_akademik', filters.tahun_akademik);
    if (filters?.kelas) q = q.eq('kelas', filters.kelas);
    if (filters?.dosen_wali_id) q = q.eq('dosen_wali_id', filters.dosen_wali_id);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapSesi);
  },

  async createSesi(payload: {
    dosen_wali_nama: string;
    dosen_wali_id?: string;
    kelas: string;
    angkatan: number;
    semester: Semester;
    tahun_akademik: string;
    sesi: PerwalianSessionType;
    tanggal_sesi: string;
    total_mahasiswa: number;
    hadir_mahasiswa: number;
    topik_bahasan: string;
    catatan_per_mahasiswa: DosenWaliStudentNote[];
    rekomendasi: string;
    rencana_tindak_lanjut: string;
    status: 'DRAF' | 'SELESAI';
  }): Promise<DosenWaliSessionReport> {
    const { data, error } = await supabase
      .from('sesi_bimbingan_perwalian')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return mapSesi(data);
  },
};

// ============================================================
// SIMPRO — Core Type Definitions (sesuai PRD & SKPL)
// ============================================================

// ----- Enums -----
export type Role =
  | 'KAPRODI'
  | 'GKM'
  | 'KOORD_KP'
  | 'KOORD_TA'
  | 'KOORD_MAGANG'
  | 'HIMPUNAN'
  | 'DOSEN'
  | 'MAHASISWA';

export type Semester = 'GANJIL' | 'GENAP';

export type StudentStatus = 'AKTIF' | 'CUTI' | 'LULUS' | 'KELUAR';

export type PositionType = 'STRUKTURAL' | 'FUNGSIONAL';

export type ArtifactType = 'RPS' | 'BAHAN_AJAR' | 'PRESENSI' | 'SOAL_UJIAN';

export type InspectionStatus =
  | 'BELUM_DIPERIKSA'
  | 'LENGKAP'
  | 'TIDAK_LENGKAP'
  | 'PERLU_REVISI';

export type ActivityType = 'PENELITIAN' | 'PKM' | 'KEGIATAN_TAMBAHAN';

export type AchievementCategory = 'AKADEMIK' | 'NON_AKADEMIK';

export type AchievementLevel = 'LOKAL' | 'NASIONAL' | 'INTERNASIONAL';

export type AchievementStatus = 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';

export type FundingStatus = 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'CAIR';

export type SurveyStatus = 'DRAFT' | 'DIBUKA' | 'DITUTUP';

export type TracerRespondentType = 'LULUSAN' | 'PENGGUNA_LULUSAN';
export type TracerFillStatus = 'BELUM_DIISI' | 'SUDAH_DIISI';
export type FieldMatch =
  | 'SANGAT_SESUAI'
  | 'SESUAI'
  | 'KURANG_SESUAI'
  | 'TIDAK_SESUAI';
export type WorkplaceType =
  | 'PEMERINTAH'
  | 'BUMN_BUMD'
  | 'SWASTA'
  | 'WIRAUSAHA'
  | 'LAINNYA';

export type AssetCategory = 'PERALATAN' | 'PERANGKAT_LUNAK' | 'LAINNYA';
export type AssetStatus = 'BAIK' | 'RUSAK' | 'DALAM_PERBAIKAN' | 'DIHAPUSKAN';

export type PartnerScope = 'DALAM_NEGERI' | 'LUAR_NEGERI';
export type PartnerStatus = 'AKTIF' | 'NONAKTIF';

export type RegistrationStatus =
  | 'DIAJUKAN'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'BERJALAN'
  | 'SELESAI';

export type TAStatus =
  | 'PROPOSAL_DIAJUKAN'
  | 'PROPOSAL_DITOLAK'
  | 'BIMBINGAN'
  | 'SIAP_SIDANG'
  | 'LULUS';

export type DefenseType = 'SEMINAR_PROPOSAL' | 'SEMINAR_TA' | 'SIDANG_TA';
export type DefenseStatus =
  | 'DIJADWALKAN'
  | 'LULUS'
  | 'LULUS_REVISI'
  | 'TIDAK_LULUS'
  | 'DIBATALKAN';
export type ExaminerRole = 'KETUA_PENGUJI' | 'ANGGOTA_PENGUJI';

export type LogbookType = 'KP' | 'MAGANG';
export type VerificationStatus = 'MENUNGGU' | 'DIVERIFIKASI' | 'PERLU_REVISI';

// ----- Entities -----

export interface Profile {
  id: string;
  nama_lengkap: string;
  email: string;
  no_whatsapp?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
}

export interface AcademicPeriod {
  id: string;
  tahun_ajaran: string;
  semester: Semester;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tenggat_unggah_artefak: string;
  is_aktif: boolean;
}

export interface Lecturer {
  id: string;
  user_id: string;
  nidn: string;
  is_dtps: boolean;
  profile?: Profile;
}

export interface Student {
  id: string;
  user_id: string;
  nim: string;
  angkatan: number;
  status: StudentStatus;
  tanggal_lulus?: string;
  profile?: Profile;
}

export interface LecturerPosition {
  id: string;
  dosen_id: string;
  jenis: PositionType;
  nama_jabatan: string;
  nomor_sk: string;
  tmt_mulai: string;
  tmt_selesai?: string;
}

export interface AdmissionRecord {
  id: string;
  periode_id: string;
  jalur_seleksi: string;
  jumlah_pendaftar: number;
  jumlah_lulus_seleksi: number;
  jumlah_daftar_ulang: number;
}

export interface Course {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
}

export interface CourseOffering {
  id: string;
  mata_kuliah_id: string;
  periode_id: string;
  dosen_id: string;
  status_pemeriksaan: InspectionStatus;
  catatan_gkm?: string;
  diperiksa_oleh?: string;
  diperiksa_at?: string;
  course?: Course;
  lecturer?: Lecturer;
}

export interface CourseArtifact {
  id: string;
  penawaran_id: string;
  jenis: ArtifactType;
  file_path: string;
  tanggal_unggah: string;
  is_terverifikasi: boolean;
  diunggah_oleh: string;
}

export interface LecturerActivity {
  id: string;
  dosen_id: string;
  periode_id: string;
  jenis: ActivityType;
  judul: string;
  uraian: string;
  tanggal_kegiatan: string;
  bukti_path?: string;
  lecturer?: Lecturer;
}

export interface ActivityStudentInvolvement {
  id: string;
  kegiatan_id: string;
  mahasiswa_id: string;
  peran: string;
  student?: Student;
}

export interface LearningIntegration {
  id: string;
  kegiatan_id: string;
  mata_kuliah_id: string;
  periode_id: string;
  bentuk_integrasi: string;
  rujukan_rps: string;
  course?: Course;
  activity?: LecturerActivity;
}

export interface StudentAchievement {
  id: string;
  mahasiswa_id: string;
  periode_id: string;
  nama_prestasi: string;
  kategori: AchievementCategory;
  tingkat: AchievementLevel;
  penyelenggara: string;
  tanggal_prestasi: string;
  bukti_path: string;
  diajukan_oleh: string;
  status: AchievementStatus;
  catatan_validasi?: string;
  divalidasi_oleh?: string;
  divalidasi_at?: string;
  student?: Student;
}

export interface FundingRequest {
  id: string;
  mahasiswa_id: string;
  nama_lomba: string;
  tingkat: AchievementLevel;
  tanggal_lomba: string;
  estimasi_biaya: number;
  dokumen_pendukung: string[];
  status: FundingStatus;
  jumlah_disetujui?: number;
  catatan_keputusan?: string;
  diputuskan_oleh?: string;
  diputuskan_at?: string;
  dicairkan_at?: string;
  student?: Student;
  created_at: string;
}

export interface SatisfactionSurvey {
  id: string;
  periode_id: string;
  judul: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  status: SurveyStatus;
  dibuat_oleh: string;
}

export interface SurveyQuestion {
  id: string;
  kuesioner_id: string;
  jenis_layanan: string;
  teks_pertanyaan: string;
  urutan: number;
}

export interface SurveyResponse {
  id: string;
  kuesioner_id: string;
  mahasiswa_id: string;
  submitted_at: string;
}

export interface SurveyAnswer {
  id: string;
  respons_id: string;
  pertanyaan_id: string;
  nilai: number;
}

export interface TracerResponse {
  id: string;
  mahasiswa_id: string;
  jenis_responden: TracerRespondentType;
  token_akses: string;
  kontak_responden?: string;
  status: TracerFillStatus;
  diisi_at?: string;
  waktu_tunggu_bulan?: number;
  kesesuaian_bidang?: FieldMatch;
  nama_tempat_kerja?: string;
  jenis_tempat_kerja?: WorkplaceType;
  lokasi_kerja?: string;
  penilaian_pengguna?: Record<string, unknown>;
  student?: Student;
}

export interface Decree {
  id: string;
  nomor_sk: string;
  judul: string;
  jenis_sk: string;
  tahun: number;
  tanggal_penetapan: string;
  file_path: string;
  diunggah_oleh: string;
}

export interface Asset {
  id: string;
  kode_aset: string;
  nama_aset: string;
  kategori: AssetCategory;
  lokasi: string;
  status: AssetStatus;
  tanggal_perolehan: string;
  keterangan?: string;
  dicatat_oleh: string;
}

export interface PartnerInstitution {
  id: string;
  nama_lembaga: string;
  cakupan: PartnerScope;
  negara: string;
  alamat: string;
  nama_pic: string;
  kontak_pic: string;
  jenis_kerja_sama: string;
  nomor_perjanjian: string;
  tanggal_mulai_berlaku: string;
  tanggal_akhir_berlaku: string;
  status: PartnerStatus;
}

export interface KPRegistration {
  id: string;
  mahasiswa_id: string;
  periode_id: string;
  mitra_id?: string;
  tempat_usulan?: string;
  dosen_pembimbing_id?: string;
  dosen_penguji_id?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: RegistrationStatus;
  catatan_koordinator?: string;
  laporan_akhir_path?: string;
  nilai_pembimbing?: number;
  nilai_penguji?: number;
  nilai_akhir?: number;
  student?: Student;
  partner?: PartnerInstitution;
}

export interface MagangRegistration {
  id: string;
  mahasiswa_id: string;
  periode_id: string;
  mitra_id: string;
  dosen_pembimbing_id?: string;
  nama_pembimbing_lapangan?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: RegistrationStatus;
  catatan_koordinator?: string;
  laporan_akhir_path?: string;
  nilai_lapangan?: number;
  nilai_dosen?: number;
  nilai_akhir?: number;
  student?: Student;
  partner?: PartnerInstitution;
}

export interface FinalProject {
  id: string;
  mahasiswa_id: string;
  periode_id: string;
  judul: string;
  ringkasan_topik: string;
  mitra_id?: string;
  pembimbing_1_id?: string;
  pembimbing_2_id?: string;
  status: TAStatus;
  catatan_koordinator?: string;
  nilai_akhir?: number;
  student?: Student;
}

export interface DefenseSession {
  id: string;
  ta_id: string;
  jenis: DefenseType;
  waktu_mulai: string;
  waktu_selesai: string;
  ruang: string;
  status: DefenseStatus;
  catatan_hasil?: string;
  nilai?: number;
}

export interface DefenseExaminer {
  id: string;
  sesi_id: string;
  dosen_id: string;
  peran: ExaminerRole;
  nilai?: number;
  lecturer?: Lecturer;
}

export interface Logbook {
  id: string;
  jenis: LogbookType;
  kp_id?: string;
  magang_id?: string;
  tanggal: string;
  uraian_kegiatan: string;
  bukti_path?: string;
  status_verifikasi: VerificationStatus;
  catatan_pembimbing?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  aksi: string;
  entitas: string;
  entitas_id: string;
  data_lama?: Record<string, unknown>;
  data_baru?: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  jenis: string;
  judul: string;
  isi: string;
  tautan?: string;
  is_dibaca: boolean;
  dikirim_email_at?: string;
  created_at: string;
}

// ----- Dashboard -----
export interface DashboardStats {
  totalMahasiswa: number;
  totalDosen: number;
  totalMitra: number;
  totalPrestasi: number;
  rasioKeketatan: number;
  persenDaftarUlang: number;
  indeksKepuasan: number;
  waktuTungguRata: number;
  persenKeterlibatan: number;
  persenIntegrasi: number;
  persenPemanfaatanMitra: number;
}

// ----- Navigation -----
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[];
  badge?: number;
}

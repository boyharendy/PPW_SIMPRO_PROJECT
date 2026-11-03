// ============================================================
// SIMPRO — Core Type Definitions (sesuai PRD Modul 7–13 & SKPL)
// ============================================================

// ----- Enums Peran (RBAC - PRD Bab 8.1 & Bab 6.A poin 2) -----
export type Role =
  // 10 Peran Tetap Utama (PRD Bab 8.1)
  | 'KAPRODI'
  | 'GKM'
  | 'ADMIN_PRODI'
  | 'DOSEN'
  | 'KOORDINATOR_KP'
  | 'KOORDINATOR_PSI'
  | 'KOORDINATOR_PDLK'
  | 'PENGELOLA_ADUAN'
  | 'PETUGAS_KEKERASAN'
  | 'MAHASISWA'
  // Peran Kompatibilitas Data Induk (PRD Bab 6.A poin 2)
  | 'PENGURUS_HIMPUNAN'
  | 'DOSEN_WALI'
  | 'DOSEN_PEMBINA'
  | 'KETUA_KELAS';

export type Semester = 'GANJIL' | 'GENAP';
export type StudentStatus = 'AKTIF' | 'CUTI' | 'LULUS' | 'KELUAR';
export type UserType = 'DOSEN' | 'MAHASISWA' | 'TENDIK';

// ----- Modul 7: Kepuasan Mitra -----
export type SurveyProgram = 'KP' | 'PSI' | 'PDLK';
export type SurveyTemplateStatus = 'DRAF' | 'AKTIF' | 'ARSIP';
export type SurveyInvitationStatus = 'DIBUAT' | 'TERKIRIM' | 'DIISI' | 'KEDALUWARSA' | 'DIBATALKAN';
export type SurveySource = 'TAUTAN_MITRA' | 'INPUT_KOORDINATOR';
export type SurveyDeliveryChannel = 'EMAIL' | 'WHATSAPP' | 'MANUAL';

export interface PartnerSurveyTemplate {
  id: string;
  program: SurveyProgram;
  nama: string;
  skala_maks: number;
  status: SurveyTemplateStatus;
  dibuat_oleh: string;
  created_at: string;
  updated_at: string;
  aspek?: PartnerSurveyAspect[];
  total_responden?: number;
}

export interface PartnerSurveyAspect {
  id: string;
  template_id: string;
  nama_aspek: string;
  deskripsi?: string;
  bobot: number;
  urutan: number;
  is_active: boolean;
}

export interface PartnerSurveyInvitation {
  id: string;
  template_id: string;
  placement_id: string;
  token_hash: string;
  token_plain?: string; // Hanya saat pertama kali digenerate
  status: SurveyInvitationStatus;
  dikirim_via?: SurveyDeliveryChannel;
  dikirim_at?: string;
  kedaluwarsa_at: string;
  jumlah_pengingat: number;
  dibuat_oleh: string;
  created_at: string;
  // Relasi
  template?: PartnerSurveyTemplate;
  placement?: StudentPlacement;
}

export interface PartnerSurveyResponse {
  id: string;
  template_id: string;
  placement_id: string;
  invitation_id?: string;
  sumber: SurveySource;
  status: 'TERKIRIM' | 'VOID';
  nama_pengisi: string;
  jabatan_pengisi?: string;
  komentar?: string;
  diinput_oleh?: string;
  submitted_at: string;
  answers?: PartnerSurveyAnswer[];
  placement?: StudentPlacement;
}

export interface PartnerSurveyAnswer {
  id: string;
  response_id: string;
  aspect_id: string;
  skor: number;
  catatan?: string;
  aspect?: PartnerSurveyAspect;
}

// ----- Modul 8: Publikasi -----
export type PublicationType = 'JURNAL' | 'PROSIDING' | 'BUKU' | 'HKI';
export type PublicationRank =
  | 'SINTA_1'
  | 'SINTA_2'
  | 'SINTA_3'
  | 'SINTA_4'
  | 'SINTA_5'
  | 'SINTA_6'
  | 'SCOPUS_Q1'
  | 'SCOPUS_Q2'
  | 'SCOPUS_Q3'
  | 'SCOPUS_Q4'
  | 'WOS'
  | 'NON_PERINGKAT'
  | 'BELUM_DITENTUKAN';

export type PublicationStatus =
  | 'DRAF'
  | 'REVIEW_INTERNAL'
  | 'DIAJUKAN'
  | 'DALAM_REVIEW'
  | 'REVISI'
  | 'DITERIMA'
  | 'TERBIT'
  | 'DITOLAK';

export type VerificationStatus = 'TIDAK_PERLU' | 'MENUNGGU' | 'TERVERIFIKASI' | 'DITOLAK';
export type AuthorType = 'DOSEN' | 'MAHASISWA' | 'EKSTERNAL';
export type AuthorRole = 'PENULIS_PERTAMA' | 'KORESPONDENSI' | 'ANGGOTA' | 'PEMBIMBING';
export type ProofType = 'BUKTI_SUBMIT' | 'LOA' | 'DOI_URL' | 'LAINNYA';

export interface PublicationAuthor {
  id: string;
  publication_id?: string;
  user_id?: string;
  nama_penulis: string;
  afiliasi?: string;
  tipe_penulis: AuthorType;
  peran: AuthorRole;
  urutan: number;
  user?: Profile;
}

export interface PublicationStageLog {
  id: string;
  publication_id: string;
  tahap: PublicationStatus;
  tanggal_tahap: string;
  jenis_bukti?: ProofType;
  tautan_bukti?: string;
  nama_berkas_bukti?: string;
  catatan?: string;
  dicatat_oleh: string;
  status_verifikasi: VerificationStatus;
  diverifikasi_oleh?: string;
  diverifikasi_at?: string;
  catatan_verifikasi?: string;
  created_at: string;
}

export interface PublicationReview {
  id: string;
  publication_id: string;
  reviewer_id: string;
  ditetapkan_oleh: string;
  status: 'DITUGASKAN' | 'SELESAI' | 'DIBATALKAN';
  tenggat_review?: string;
  rekomendasi?: 'LAYAK_DIAJUKAN' | 'PERLU_PERBAIKAN';
  catatan_review?: string;
  ditugaskan_at: string;
  selesai_at?: string;
  reviewer?: Profile;
}

export interface Publication {
  id: string;
  judul: string;
  jenis: PublicationType;
  nama_target: string;
  peringkat: PublicationRank;
  status: PublicationStatus;
  status_verifikasi: VerificationStatus;
  doi?: string;
  url?: string;
  tahun: number;
  dicatat_oleh: string;
  verifikator_id?: string;
  diverifikasi_at?: string;
  catatan_verifikasi?: string;
  created_at: string;
  updated_at: string;
  authors: PublicationAuthor[];
  stage_logs?: PublicationStageLog[];
  reviews?: PublicationReview[];
  pencatat?: Profile;
  verifikator?: Profile;
}

// ----- Modul 9: Perjalanan Dinas -----
export type TripFundingSource = 'RKA_PRODI' | 'FAKULTAS' | 'HIBAH' | 'MANDIRI' | 'LAINNYA';
export type TripStatus =
  | 'DRAF'
  | 'DIAJUKAN'
  | 'PERLU_REVISI'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'DILAPORKAN'
  | 'SELESAI'
  | 'DIBATALKAN';

export type TripCostComponent = 'TRANSPORTASI' | 'AKOMODASI' | 'UANG_HARIAN' | 'LAINNYA';

export interface BusinessTripParticipant {
  id: string;
  trip_id: string;
  user_id: string;
  peran: 'KETUA_ROMBONGAN' | 'ANGGOTA';
  user?: Profile;
}

export interface BusinessTripCost {
  id: string;
  trip_id: string;
  komponen: TripCostComponent;
  keterangan?: string;
  estimasi_biaya: number;
  realisasi_biaya?: number;
  nama_berkas_bukti?: string;
}

export interface BusinessTrip {
  id: string;
  nomor_surat_tugas?: string;
  diajukan_oleh: string;
  tujuan: string;
  maksud_kegiatan: string;
  tanggal_berangkat: string;
  tanggal_kembali: string;
  sumber_dana: TripFundingSource;
  rka_budget_item_id?: string;
  status: TripStatus;
  disetujui_oleh?: string;
  disetujui_at?: string;
  catatan_keputusan?: string;
  batas_laporan?: string;
  laporan_hasil?: string;
  laporan_dikirim_at?: string;
  dikonfirmasi_oleh?: string;
  dikonfirmasi_at?: string;
  catatan_kelengkapan?: string;
  created_at: string;
  updated_at: string;
  // Relasi
  pengaju?: Profile;
  participants: BusinessTripParticipant[];
  costs: BusinessTripCost[];
  budget_item?: RkaBudgetItem;
  // Flags otomatis
  is_terlambat_lapor?: boolean;
  is_belum_lengkap?: boolean;
  is_melebihi_estimasi?: boolean;
}

// ----- Modul 10: RKA Prodi -----
export type RkaDocumentStatus = 'DRAF' | 'AKTIF' | 'DITUTUP';
export type RkaVersionStatus = 'DRAF' | 'DIAJUKAN' | 'PERLU_REVISI' | 'DISETUJUI' | 'DIGANTIKAN' | 'DIBATALKAN';
export type RkaActivityExecutionStatus = 'BELUM_DILAKSANAKAN' | 'BERJALAN' | 'TERLAKSANA' | 'DIBATALKAN';
export type RkaBudgetCategory = 'BELANJA_BARANG' | 'BELANJA_JASA' | 'HONOR' | 'PERJALANAN_DINAS' | 'LAINNYA';
export type RkaBudgetSource = 'DANA_UNIVERSITAS' | 'DANA_FAKULTAS' | 'PNBP' | 'HIBAH' | 'LAINNYA';

export interface RkaBudgetItem {
  id: string;
  activity_id: string;
  kode_pos: string;
  nama_pos: string;
  kategori_pos: RkaBudgetCategory;
  volume: number;
  satuan: string;
  harga_satuan: number;
  nominal_anggaran: number; // volume * harga_satuan
  sumber_dana: RkaBudgetSource;
  is_active: boolean;
  realisasi_total?: number;
  sisa_anggaran?: number;
}

export interface RkaActivity {
  id: string;
  rka_id: string;
  kode_kegiatan: string;
  nama_kegiatan: string;
  indikator_kinerja: string;
  target_indikator: string;
  jadwal_mulai: string;
  jadwal_selesai: string;
  penanggung_jawab_id: string;
  status_pelaksanaan: RkaActivityExecutionStatus;
  tanggal_realisasi_mulai?: string;
  tanggal_realisasi_selesai?: string;
  capaian_indikator?: string;
  is_active: boolean;
  budget_items: RkaBudgetItem[];
  penanggung_jawab?: Profile;
  total_anggaran?: number;
  total_realisasi?: number;
}

export interface RkaVersion {
  id: string;
  rka_id: string;
  nomor_versi: number;
  status: RkaVersionStatus;
  total_anggaran: number;
  draft_payload?: {
    activities: Partial<RkaActivity>[];
  };
  alasan_revisi?: string;
  row_version: number;
  dibuat_oleh: string;
  diajukan_oleh?: string;
  diajukan_at?: string;
  ditinjau_oleh?: string;
  ditinjau_at?: string;
  catatan_peninjauan?: string;
  diterapkan_at?: string;
  created_at: string;
}

export interface RkaDocument {
  id: string;
  tahun_anggaran: number;
  judul: string;
  status: RkaDocumentStatus;
  versi_aktif_id?: string;
  versi_kerja_id?: string;
  total_anggaran: number;
  dibuat_oleh: string;
  ditutup_oleh?: string;
  ditutup_at?: string;
  created_at: string;
  updated_at: string;
  activities?: RkaActivity[];
  versions?: RkaVersion[];
  total_realisasi?: number;
  persentase_serapan?: number;
}

export interface RkaRealization {
  id: string;
  rka_budget_item_id: string;
  tanggal_realisasi: string;
  nominal_realisasi: number;
  uraian: string;
  sumber_pencatatan: 'MANUAL' | 'PERJALANAN_DINAS';
  business_trip_id?: string;
  status: 'AKTIF' | 'DIBATALKAN';
  dicatat_oleh: string;
  created_at: string;
  budget_item?: RkaBudgetItem;
  pencatat?: Profile;
}

// ----- Modul 11: Review RPS -----
export type RpsStatus = 'DRAF' | 'DIAJUKAN' | 'DIREVIEW' | 'PERLU_REVISI' | 'DISETUJUI' | 'DISAHKAN';
export type RpsReviewComponent =
  | 'KESELARASAN_CPL_CPMK'
  | 'BAHAN_KAJIAN'
  | 'METODE_PEMBELAJARAN'
  | 'BENTUK_BOBOT_PENILAIAN'
  | 'REFERENSI';
export type RpsItemResult = 'SESUAI' | 'PERLU_PERBAIKAN' | 'TIDAK_SESUAI';

export interface RpsReviewItem {
  id: string;
  review_id: string;
  komponen: RpsReviewComponent;
  hasil: RpsItemResult;
  catatan?: string;
}

export interface RpsReview {
  id: string;
  version_id: string;
  reviewer_id: string;
  ditetapkan_oleh: string;
  status: 'DITUGASKAN' | 'SELESAI' | 'DIBATALKAN';
  tenggat_review: string;
  rekomendasi?: 'DISETUJUI' | 'PERLU_REVISI';
  catatan_umum?: string;
  ditugaskan_at: string;
  selesai_at?: string;
  reviewer?: Profile;
  items: RpsReviewItem[];
}

export interface RpsVersion {
  id: string;
  submission_id: string;
  nomor_versi: number;
  catatan_perubahan?: string;
  diunggah_oleh: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  created_at: string;
  reviews?: RpsReview[];
}

export interface RpsSubmission {
  id: string;
  course_id: string;
  academic_period_id: string;
  dosen_pengampu_id: string;
  status: RpsStatus;
  versi_terbaru: number;
  diajukan_at?: string;
  disahkan_oleh?: string;
  disahkan_at?: string;
  catatan_pengesahan?: string;
  created_at: string;
  updated_at: string;
  // Relasi
  course?: Course;
  academic_period?: AcademicPeriod;
  dosen_pengampu?: Profile;
  versions: RpsVersion[];
  improvement_plans?: CourseImprovementPlan[];
}

// ----- Modul 12: Post Evaluasi Perkuliahan -----
export type CourseEvaluationStatus = 'DRAF' | 'TERKIRIM' | 'DITINJAU';
export type CoursePlanStatus = 'BARU' | 'DITERUSKAN' | 'DITERAPKAN' | 'TIDAK_DITERAPKAN';
export type PlanCategory = 'CPMK_RPS' | 'METODE_PEMBELAJARAN' | 'PENILAIAN' | 'REFERENSI' | 'LAINNYA';

export interface CourseEvaluationGrade {
  id: string;
  evaluation_id: string;
  nilai_huruf: string; // A, AB, B, BC, C, D, E
  jumlah_mahasiswa: number;
}

export interface CourseEvaluationCpmk {
  id: string;
  evaluation_id: string;
  kode_cpmk: string;
  deskripsi_cpmk: string;
  target_persen: number;
  capaian_persen: number;
  tercapai: boolean; // capaian_persen >= target_persen
  analisis?: string;
}

export interface CourseImprovementPlan {
  id: string;
  evaluation_id: string;
  uraian: string;
  kategori: PlanCategory;
  status: CoursePlanStatus;
  target_rps_submission_id?: string;
  catatan_penerapan?: string;
  ditandai_oleh?: string;
  ditandai_at?: string;
  created_at: string;
}

export interface CourseEvaluation {
  id: string;
  course_class_id: string;
  diisi_oleh: string;
  status: CourseEvaluationStatus;
  kesesuaian_rps: 'SESUAI' | 'SEBAGIAN' | 'TIDAK_SESUAI';
  penjelasan_kesesuaian?: string;
  kendala?: string;
  dikirim_at?: string;
  ditinjau_oleh?: string;
  ditinjau_at?: string;
  catatan_gkm?: string;
  created_at: string;
  updated_at: string;
  // Relasi
  course_class?: CourseClass;
  grades: CourseEvaluationGrade[];
  cpmk_list: CourseEvaluationCpmk[];
  improvement_plans: CourseImprovementPlan[];
  feedback_summary?: CourseFeedbackSummary;
}

export interface CourseFeedbackSummary {
  id: string;
  course_class_id: string;
  jumlah_responden: number;
  skor_rata_rata: number;
  rincian_aspek: Record<string, number>;
  disinkronkan_at: string;
}

export interface CourseClass {
  id: string;
  course_id: string;
  academic_period_id: string;
  kode_kelas: string;
  dosen_pengampu_id: string;
  jumlah_mahasiswa: number;
  course?: Course;
  academic_period?: AcademicPeriod;
  dosen_pengampu?: Profile;
  evaluation?: CourseEvaluation;
}

// ----- Modul 13: Layanan Aduan Mahasiswa Anonim -----
export type ComplaintCategory =
  | 'AKADEMIK'
  | 'LAYANAN_ADMINISTRASI'
  | 'FASILITAS'
  | 'DOSEN_TENDIK'
  | 'PERUNDUNGAN_KEKERASAN'
  | 'LAINNYA';

export type ComplaintStatus = 'DITERIMA' | 'DIVERIFIKASI' | 'DITINDAKLANJUTI' | 'SELESAI' | 'DITUTUP';
export type ComplaintDispositionStatus = 'AKTIF' | 'SELESAI' | 'DIESKALASI' | 'DIBATALKAN';

export interface ComplaintMessage {
  id: string;
  complaint_id: string;
  urutan: number;
  pengirim: 'PELAPOR' | 'PETUGAS';
  sender_user_id?: string;
  sender_name?: string;
  isi: string;
  is_catatan_internal: boolean;
  tanggal: string;
}

export interface ComplaintDisposition {
  id: string;
  complaint_id: string;
  didisposisi_oleh: string;
  penanggung_jawab_id: string;
  tenggat: string;
  catatan?: string;
  status: ComplaintDispositionStatus;
  dieskalasi_ke_id?: string;
  tanggal_eskalasi?: string;
  created_at: string;
  penanggung_jawab?: Profile;
}

export type Disposition = ComplaintDisposition;

export interface Complaint {
  id: string;
  nomor_aduan: string; // ADU-2026-0001
  kode_tiket?: string; // Hanya untuk respons pembuatan pertama / pelacak
  kode_tiket_hash: string;
  kategori: ComplaintCategory;
  judul: string;
  uraian: string;
  is_sensitif: boolean; // true bila PERUNDUNGAN_KEKERASAN
  status: ComplaintStatus;
  tanggal_diterima: string;
  tanggal_selesai?: string;
  alasan_penutupan?: string;
  diteruskan_ke_satgas_tanggal?: string;
  nomor_referensi_satgas?: string;
  rating_kepuasan?: number; // 1-5
  komentar_kepuasan?: string;
  lampiran?: string[];
  messages?: ComplaintMessage[];
  dispositions?: ComplaintDisposition[];
}

// Metadata aduan aman untuk Kaprodi (tanpa isi & lampiran bila sensitif)
export interface ComplaintMetadata {
  id: string;
  nomor_aduan: string;
  kategori: ComplaintCategory;
  is_sensitif: boolean;
  status: ComplaintStatus;
  tanggal_diterima: string;
  tanggal_selesai?: string;
  umur_hari: number;
  tenggat_terakhir?: string;
  status_disposisi?: ComplaintDispositionStatus;
  penanggung_jawab?: string;
}

// ----- Data Induk & Bersama -----
export interface Profile {
  id: string;
  nomor_induk?: string; // NIM / NIDN / NIP
  nama_lengkap: string;
  email: string;
  tipe_pengguna?: UserType;
  angkatan?: number;
  status_akademik?: StudentStatus;
  no_whatsapp?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  berlaku_dari?: string;
  berlaku_sampai?: string;
}

export interface AcademicPeriod {
  id: string;
  tahun_ajaran?: string;
  tahun_akademik?: string;
  semester: Semester;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_selesai_perkuliahan?: string;
  batas_pengisian_evaluasi?: string;
  tenggat_unggah_artefak?: string;
  is_aktif: boolean;
}

export interface Course {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  is_active?: boolean;
}

export interface Partner {
  id: string;
  external_ref_id?: string;
  nama_mitra: string;
  bidang_usaha?: string;
  alamat?: string;
  nama_kontak: string;
  email_kontak?: string;
  telepon_kontak?: string;
  is_active: boolean;
}

export interface StudentPlacement {
  id: string;
  partner_id: string;
  student_id: string;
  academic_period_id: string;
  program: SurveyProgram;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  partner?: Partner;
  student?: Profile;
  academic_period?: AcademicPeriod;
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

export interface AppSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalMahasiswa: number;
  totalDosen: number;
  totalMitra: number;
  indeksKepuasanMitra: number;
  totalPublikasiTahunIni: number;
  publikasiMenungguVerifikasi: number;
  perjalananDinasAktif: number;
  serapanRkaPersen: number;
  rpsTuntasPersen: number;
  evaluasiTerkirimPersen: number;
  aduanTerbuka: number;
}

// ----- Navigasi -----
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[];
  badge?: number;
  category?: string; // Grouping menu di sidebar
}

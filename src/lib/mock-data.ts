// ============================================================
// SIMPRO — Mock Data untuk semua modul (demo frontend)
// ============================================================
import type {
  Profile, AcademicPeriod, Lecturer, Student, AdmissionRecord,
  Course, CourseOffering, CourseArtifact, LecturerActivity,
  ActivityStudentInvolvement, LearningIntegration, StudentAchievement,
  FundingRequest, SatisfactionSurvey, SurveyQuestion, TracerResponse,
  Decree, Asset, PartnerInstitution, KPRegistration, MagangRegistration,
  FinalProject, DefenseSession, Logbook, Notification, LecturerPosition,
  DashboardStats
} from './types';

// ----- Profiles -----
export const mockProfiles: Profile[] = [
  { id: 'u1', nama_lengkap: 'Dr. Ahmad Fauzi, M.T.', email: 'fauzi@univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u2', nama_lengkap: 'Siti Rahmawati, M.Kom.', email: 'siti@univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u3', nama_lengkap: 'Dr. Budi Santoso, M.Si.', email: 'budi@univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u4', nama_lengkap: 'Rina Kartika, M.Kom.', email: 'rina@univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u5', nama_lengkap: 'Muhammad Rizky', email: 'rizky@student.univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u6', nama_lengkap: 'Dewi Anggraini', email: 'dewi@student.univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u7', nama_lengkap: 'Fajar Nugroho', email: 'fajar@student.univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'u8', nama_lengkap: 'Putri Handayani', email: 'putri@student.univ.ac.id', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
];

// ----- Academic Periods -----
export const mockPeriods: AcademicPeriod[] = [
  { id: 'p1', tahun_ajaran: '2024/2025', semester: 'GANJIL', tanggal_mulai: '2024-09-01', tanggal_selesai: '2025-01-31', tenggat_unggah_artefak: '2024-10-15', is_aktif: false },
  { id: 'p2', tahun_ajaran: '2024/2025', semester: 'GENAP', tanggal_mulai: '2025-02-01', tanggal_selesai: '2025-07-31', tenggat_unggah_artefak: '2025-03-15', is_aktif: false },
  { id: 'p3', tahun_ajaran: '2025/2026', semester: 'GANJIL', tanggal_mulai: '2025-09-01', tanggal_selesai: '2026-01-31', tenggat_unggah_artefak: '2025-10-15', is_aktif: true },
];

// ----- Lecturers -----
export const mockLecturers: Lecturer[] = [
  { id: 'l1', user_id: 'u1', nidn: '0001018501', is_dtps: true, profile: mockProfiles[0] },
  { id: 'l2', user_id: 'u2', nidn: '0002028802', is_dtps: true, profile: mockProfiles[1] },
  { id: 'l3', user_id: 'u3', nidn: '0003038003', is_dtps: true, profile: mockProfiles[2] },
  { id: 'l4', user_id: 'u4', nidn: '0004049004', is_dtps: false, profile: mockProfiles[3] },
];

// ----- Students -----
export const mockStudents: Student[] = [
  { id: 's1', user_id: 'u5', nim: '20210001', angkatan: 2021, status: 'AKTIF', profile: mockProfiles[4] },
  { id: 's2', user_id: 'u6', nim: '20210002', angkatan: 2021, status: 'AKTIF', profile: mockProfiles[5] },
  { id: 's3', user_id: 'u7', nim: '20220001', angkatan: 2022, status: 'AKTIF', profile: mockProfiles[6] },
  { id: 's4', user_id: 'u8', nim: '20220002', angkatan: 2022, status: 'LULUS', tanggal_lulus: '2025-08-15', profile: mockProfiles[7] },
];

// ----- Lecturer Positions -----
export const mockPositions: LecturerPosition[] = [
  { id: 'lp1', dosen_id: 'l1', jenis: 'STRUKTURAL', nama_jabatan: 'Kaprodi', nomor_sk: 'SK/001/2023', tmt_mulai: '2023-01-01' },
  { id: 'lp2', dosen_id: 'l1', jenis: 'FUNGSIONAL', nama_jabatan: 'Lektor Kepala', nomor_sk: 'SK/002/2022', tmt_mulai: '2022-06-01' },
  { id: 'lp3', dosen_id: 'l2', jenis: 'FUNGSIONAL', nama_jabatan: 'Lektor', nomor_sk: 'SK/003/2023', tmt_mulai: '2023-03-01' },
  { id: 'lp4', dosen_id: 'l3', jenis: 'FUNGSIONAL', nama_jabatan: 'Asisten Ahli', nomor_sk: 'SK/004/2024', tmt_mulai: '2024-01-01' },
];

// ----- Admission Records -----
export const mockAdmissions: AdmissionRecord[] = [
  { id: 'ar1', periode_id: 'p1', jalur_seleksi: 'SNBP', jumlah_pendaftar: 450, jumlah_lulus_seleksi: 120, jumlah_daftar_ulang: 95 },
  { id: 'ar2', periode_id: 'p1', jalur_seleksi: 'SNBT', jumlah_pendaftar: 800, jumlah_lulus_seleksi: 150, jumlah_daftar_ulang: 130 },
  { id: 'ar3', periode_id: 'p1', jalur_seleksi: 'Mandiri', jumlah_pendaftar: 300, jumlah_lulus_seleksi: 80, jumlah_daftar_ulang: 70 },
  { id: 'ar4', periode_id: 'p2', jalur_seleksi: 'SNBP', jumlah_pendaftar: 500, jumlah_lulus_seleksi: 130, jumlah_daftar_ulang: 110 },
  { id: 'ar5', periode_id: 'p2', jalur_seleksi: 'SNBT', jumlah_pendaftar: 900, jumlah_lulus_seleksi: 160, jumlah_daftar_ulang: 140 },
  { id: 'ar6', periode_id: 'p2', jalur_seleksi: 'Mandiri', jumlah_pendaftar: 350, jumlah_lulus_seleksi: 90, jumlah_daftar_ulang: 75 },
  { id: 'ar7', periode_id: 'p3', jalur_seleksi: 'SNBP', jumlah_pendaftar: 520, jumlah_lulus_seleksi: 140, jumlah_daftar_ulang: 120 },
  { id: 'ar8', periode_id: 'p3', jalur_seleksi: 'SNBT', jumlah_pendaftar: 950, jumlah_lulus_seleksi: 170, jumlah_daftar_ulang: 155 },
  { id: 'ar9', periode_id: 'p3', jalur_seleksi: 'Mandiri', jumlah_pendaftar: 380, jumlah_lulus_seleksi: 100, jumlah_daftar_ulang: 85 },
];

// ----- Courses -----
export const mockCourses: Course[] = [
  { id: 'c1', kode_mk: 'SI101', nama_mk: 'Pengantar Sistem Informasi', sks: 3 },
  { id: 'c2', kode_mk: 'SI201', nama_mk: 'Basis Data', sks: 4 },
  { id: 'c3', kode_mk: 'SI301', nama_mk: 'Analisis dan Perancangan Sistem', sks: 3 },
  { id: 'c4', kode_mk: 'SI401', nama_mk: 'Manajemen Proyek TI', sks: 3 },
  { id: 'c5', kode_mk: 'SI202', nama_mk: 'Pemrograman Web', sks: 4 },
];

// ----- Course Offerings -----
export const mockOfferings: CourseOffering[] = [
  { id: 'co1', mata_kuliah_id: 'c1', periode_id: 'p3', dosen_id: 'l1', status_pemeriksaan: 'LENGKAP', catatan_gkm: 'Semua artefak lengkap', course: mockCourses[0], lecturer: mockLecturers[0] },
  { id: 'co2', mata_kuliah_id: 'c2', periode_id: 'p3', dosen_id: 'l2', status_pemeriksaan: 'PERLU_REVISI', catatan_gkm: 'RPS perlu diperbaiki', course: mockCourses[1], lecturer: mockLecturers[1] },
  { id: 'co3', mata_kuliah_id: 'c3', periode_id: 'p3', dosen_id: 'l3', status_pemeriksaan: 'BELUM_DIPERIKSA', course: mockCourses[2], lecturer: mockLecturers[2] },
  { id: 'co4', mata_kuliah_id: 'c4', periode_id: 'p3', dosen_id: 'l4', status_pemeriksaan: 'TIDAK_LENGKAP', catatan_gkm: 'Soal ujian belum diunggah', course: mockCourses[3], lecturer: mockLecturers[3] },
  { id: 'co5', mata_kuliah_id: 'c5', periode_id: 'p3', dosen_id: 'l1', status_pemeriksaan: 'LENGKAP', course: mockCourses[4], lecturer: mockLecturers[0] },
];

// ----- Course Artifacts -----
export const mockArtifacts: CourseArtifact[] = [
  { id: 'ca1', penawaran_id: 'co1', jenis: 'RPS', file_path: '/docs/rps_si101.pdf', tanggal_unggah: '2025-09-20', is_terverifikasi: true, diunggah_oleh: 'u1' },
  { id: 'ca2', penawaran_id: 'co1', jenis: 'BAHAN_AJAR', file_path: '/docs/ajar_si101.pdf', tanggal_unggah: '2025-09-21', is_terverifikasi: true, diunggah_oleh: 'u1' },
  { id: 'ca3', penawaran_id: 'co1', jenis: 'PRESENSI', file_path: '/docs/presensi_si101.xlsx', tanggal_unggah: '2025-09-22', is_terverifikasi: true, diunggah_oleh: 'u1' },
  { id: 'ca4', penawaran_id: 'co1', jenis: 'SOAL_UJIAN', file_path: '/docs/soal_si101.pdf', tanggal_unggah: '2025-09-25', is_terverifikasi: true, diunggah_oleh: 'u1' },
  { id: 'ca5', penawaran_id: 'co2', jenis: 'RPS', file_path: '/docs/rps_si201.pdf', tanggal_unggah: '2025-09-18', is_terverifikasi: false, diunggah_oleh: 'u2' },
];

// ----- Lecturer Activities -----
export const mockActivities: LecturerActivity[] = [
  { id: 'la1', dosen_id: 'l1', periode_id: 'p3', jenis: 'PENELITIAN', judul: 'Implementasi Machine Learning untuk Prediksi Kelulusan', uraian: 'Penelitian kolaboratif tentang ML', tanggal_kegiatan: '2025-09-15', lecturer: mockLecturers[0] },
  { id: 'la2', dosen_id: 'l2', periode_id: 'p3', jenis: 'PKM', judul: 'Pelatihan Digital Literacy untuk UMKM', uraian: 'PkM pelatihan literasi digital', tanggal_kegiatan: '2025-10-01', lecturer: mockLecturers[1] },
  { id: 'la3', dosen_id: 'l3', periode_id: 'p3', jenis: 'KEGIATAN_TAMBAHAN', judul: 'Narasumber Seminar Nasional IT', uraian: 'Narasumber di SNIT 2025', tanggal_kegiatan: '2025-11-05', lecturer: mockLecturers[2] },
  { id: 'la4', dosen_id: 'l1', periode_id: 'p2', jenis: 'PENELITIAN', judul: 'Analisis Sentimen Media Sosial dengan NLP', uraian: 'Penelitian NLP', tanggal_kegiatan: '2025-04-10', lecturer: mockLecturers[0] },
];

// ----- Student Involvements -----
export const mockInvolvements: ActivityStudentInvolvement[] = [
  { id: 'asi1', kegiatan_id: 'la1', mahasiswa_id: 's1', peran: 'Anggota Peneliti', student: mockStudents[0] },
  { id: 'asi2', kegiatan_id: 'la1', mahasiswa_id: 's2', peran: 'Asisten Lapangan', student: mockStudents[1] },
  { id: 'asi3', kegiatan_id: 'la2', mahasiswa_id: 's3', peran: 'Asisten Fasilitator', student: mockStudents[2] },
];

// ----- Learning Integrations -----
export const mockIntegrations: LearningIntegration[] = [
  { id: 'li1', kegiatan_id: 'la1', mata_kuliah_id: 'c2', periode_id: 'p3', bentuk_integrasi: 'Studi Kasus', rujukan_rps: 'Pertemuan 10-12', course: mockCourses[1], activity: mockActivities[0] },
  { id: 'li2', kegiatan_id: 'la2', mata_kuliah_id: 'c1', periode_id: 'p3', bentuk_integrasi: 'Materi Ajar', rujukan_rps: 'Pertemuan 5', course: mockCourses[0], activity: mockActivities[1] },
];

// ----- Achievements -----
export const mockAchievements: StudentAchievement[] = [
  { id: 'sa1', mahasiswa_id: 's1', periode_id: 'p3', nama_prestasi: 'Juara 1 Hackathon Nasional', kategori: 'AKADEMIK', tingkat: 'NASIONAL', penyelenggara: 'Kemendikbud', tanggal_prestasi: '2025-10-20', bukti_path: '/bukti/sertifikat1.pdf', diajukan_oleh: 'u5', status: 'DISETUJUI', student: mockStudents[0] },
  { id: 'sa2', mahasiswa_id: 's2', periode_id: 'p3', nama_prestasi: 'Best Paper ICIST 2025', kategori: 'AKADEMIK', tingkat: 'INTERNASIONAL', penyelenggara: 'IEEE', tanggal_prestasi: '2025-11-15', bukti_path: '/bukti/sertifikat2.pdf', diajukan_oleh: 'u6', status: 'DIAJUKAN', student: mockStudents[1] },
  { id: 'sa3', mahasiswa_id: 's3', periode_id: 'p3', nama_prestasi: 'Juara 2 Lomba UI/UX', kategori: 'NON_AKADEMIK', tingkat: 'LOKAL', penyelenggara: 'Universitas XYZ', tanggal_prestasi: '2025-09-05', bukti_path: '/bukti/sertifikat3.pdf', diajukan_oleh: 'u7', status: 'DISETUJUI', student: mockStudents[2] },
];

// ----- Funding Requests -----
export const mockFunding: FundingRequest[] = [
  { id: 'fr1', mahasiswa_id: 's1', nama_lomba: 'Gemastik XVII', tingkat: 'NASIONAL', tanggal_lomba: '2025-12-01', estimasi_biaya: 5000000, dokumen_pendukung: ['/doc/rab1.pdf', '/doc/pengumuman1.pdf'], status: 'DISETUJUI', jumlah_disetujui: 4500000, catatan_keputusan: 'Disetujui sesuai RAB yang direvisi', diputuskan_oleh: 'u1', diputuskan_at: '2025-11-10', student: mockStudents[0], created_at: '2025-11-01' },
  { id: 'fr2', mahasiswa_id: 's2', nama_lomba: 'ICPC Regional Asia', tingkat: 'INTERNASIONAL', tanggal_lomba: '2026-01-15', estimasi_biaya: 15000000, dokumen_pendukung: ['/doc/rab2.pdf'], status: 'DIAJUKAN', student: mockStudents[1], created_at: '2025-11-20' },
  { id: 'fr3', mahasiswa_id: 's3', nama_lomba: 'Lomba Poster Ilmiah', tingkat: 'LOKAL', tanggal_lomba: '2025-12-20', estimasi_biaya: 500000, dokumen_pendukung: ['/doc/rab3.pdf'], status: 'CAIR', jumlah_disetujui: 500000, catatan_keputusan: 'Disetujui penuh', diputuskan_oleh: 'u1', diputuskan_at: '2025-12-05', dicairkan_at: '2025-12-10', student: mockStudents[2], created_at: '2025-12-01' },
];

// ----- Satisfaction Surveys -----
export const mockSurveys: SatisfactionSurvey[] = [
  { id: 'ss1', periode_id: 'p1', judul: 'Kepuasan Layanan Semester Ganjil 2024/2025', tanggal_buka: '2025-01-05', tanggal_tutup: '2025-01-20', status: 'DITUTUP', dibuat_oleh: 'u2' },
  { id: 'ss2', periode_id: 'p2', judul: 'Kepuasan Layanan Semester Genap 2024/2025', tanggal_buka: '2025-07-01', tanggal_tutup: '2025-07-15', status: 'DITUTUP', dibuat_oleh: 'u2' },
  { id: 'ss3', periode_id: 'p3', judul: 'Kepuasan Layanan Semester Ganjil 2025/2026', tanggal_buka: '2025-12-01', tanggal_tutup: '2025-12-31', status: 'DIBUKA', dibuat_oleh: 'u2' },
];

// ----- Survey Questions -----
export const mockSurveyQuestions: SurveyQuestion[] = [
  { id: 'sq1', kuesioner_id: 'ss3', jenis_layanan: 'Akademik', teks_pertanyaan: 'Bagaimana kepuasan Anda terhadap kualitas pengajaran?', urutan: 1 },
  { id: 'sq2', kuesioner_id: 'ss3', jenis_layanan: 'Akademik', teks_pertanyaan: 'Bagaimana kepuasan Anda terhadap materi perkuliahan?', urutan: 2 },
  { id: 'sq3', kuesioner_id: 'ss3', jenis_layanan: 'Administrasi', teks_pertanyaan: 'Bagaimana kepuasan Anda terhadap pelayanan TU?', urutan: 3 },
  { id: 'sq4', kuesioner_id: 'ss3', jenis_layanan: 'Fasilitas', teks_pertanyaan: 'Bagaimana kepuasan Anda terhadap fasilitas laboratorium?', urutan: 4 },
  { id: 'sq5', kuesioner_id: 'ss3', jenis_layanan: 'Kemahasiswaan', teks_pertanyaan: 'Bagaimana kepuasan Anda terhadap kegiatan kemahasiswaan?', urutan: 5 },
];

// ----- Tracer Responses -----
export const mockTracerResponses: TracerResponse[] = [
  { id: 'tr1', mahasiswa_id: 's4', jenis_responden: 'LULUSAN', token_akses: 'tok-abc123', status: 'SUDAH_DIISI', diisi_at: '2025-11-01', waktu_tunggu_bulan: 3, kesesuaian_bidang: 'SANGAT_SESUAI', nama_tempat_kerja: 'PT Teknologi Nusantara', jenis_tempat_kerja: 'SWASTA', lokasi_kerja: 'Jakarta', student: mockStudents[3] },
  { id: 'tr2', mahasiswa_id: 's4', jenis_responden: 'PENGGUNA_LULUSAN', token_akses: 'tok-def456', kontak_responden: 'hr@teknologi.com', status: 'SUDAH_DIISI', diisi_at: '2025-11-05', student: mockStudents[3], penilaian_pengguna: { etika: 4, keahlian: 5, komunikasi: 4, kerjasama: 5 } },
  { id: 'tr3', mahasiswa_id: 's4', jenis_responden: 'LULUSAN', token_akses: 'tok-ghi789', status: 'BELUM_DIISI', student: mockStudents[3] },
];

// ----- Decrees -----
export const mockDecrees: Decree[] = [
  { id: 'dk1', nomor_sk: 'SK/PRODI/001/2025', judul: 'Penetapan Kurikulum 2025', jenis_sk: 'Kurikulum', tahun: 2025, tanggal_penetapan: '2025-02-01', file_path: '/sk/kurikulum2025.pdf', diunggah_oleh: 'u1' },
  { id: 'dk2', nomor_sk: 'SK/PRODI/002/2025', judul: 'Penetapan Pembimbing TA Ganjil', jenis_sk: 'Pembimbing', tahun: 2025, tanggal_penetapan: '2025-09-15', file_path: '/sk/pembimbing_ta.pdf', diunggah_oleh: 'u1' },
  { id: 'dk3', nomor_sk: 'SK/PRODI/003/2025', judul: 'Kepanitiaan Dies Natalis', jenis_sk: 'Kepanitiaan', tahun: 2025, tanggal_penetapan: '2025-08-20', file_path: '/sk/panitia_dies.pdf', diunggah_oleh: 'u1' },
];

// ----- Assets -----
export const mockAssets: Asset[] = [
  { id: 'as1', kode_aset: 'LAB-PC-001', nama_aset: 'PC Lab Pemrograman #1', kategori: 'PERALATAN', lokasi: 'Lab SI-01', status: 'BAIK', tanggal_perolehan: '2023-03-01', dicatat_oleh: 'u1' },
  { id: 'as2', kode_aset: 'LAB-PC-002', nama_aset: 'PC Lab Pemrograman #2', kategori: 'PERALATAN', lokasi: 'Lab SI-01', status: 'RUSAK', tanggal_perolehan: '2023-03-01', keterangan: 'Monitor mati', dicatat_oleh: 'u1' },
  { id: 'as3', kode_aset: 'SW-FIGMA-001', nama_aset: 'Lisensi Figma Education', kategori: 'PERANGKAT_LUNAK', lokasi: 'Cloud', status: 'BAIK', tanggal_perolehan: '2024-01-01', dicatat_oleh: 'u1' },
  { id: 'as4', kode_aset: 'LAB-PROJ-001', nama_aset: 'Proyektor Ruang 301', kategori: 'PERALATAN', lokasi: 'R. 301', status: 'DALAM_PERBAIKAN', tanggal_perolehan: '2022-06-15', keterangan: 'Lamp diganti', dicatat_oleh: 'u1' },
];

// ----- Partner Institutions -----
export const mockPartners: PartnerInstitution[] = [
  { id: 'pi1', nama_lembaga: 'PT Telkom Indonesia', cakupan: 'DALAM_NEGERI', negara: 'Indonesia', alamat: 'Bandung, Jawa Barat', nama_pic: 'Agus Hermawan', kontak_pic: '08123456789', jenis_kerja_sama: 'MoU', nomor_perjanjian: 'MoU/01/2024', tanggal_mulai_berlaku: '2024-01-01', tanggal_akhir_berlaku: '2027-01-01', status: 'AKTIF' },
  { id: 'pi2', nama_lembaga: 'Tokopedia', cakupan: 'DALAM_NEGERI', negara: 'Indonesia', alamat: 'Jakarta Selatan', nama_pic: 'Diana Putri', kontak_pic: '08129876543', jenis_kerja_sama: 'PKS', nomor_perjanjian: 'PKS/02/2024', tanggal_mulai_berlaku: '2024-06-01', tanggal_akhir_berlaku: '2026-06-01', status: 'AKTIF' },
  { id: 'pi3', nama_lembaga: 'NUS Singapore', cakupan: 'LUAR_NEGERI', negara: 'Singapura', alamat: '21 Lower Kent Ridge Rd', nama_pic: 'Prof. Lee Wei', kontak_pic: 'lee@nus.edu.sg', jenis_kerja_sama: 'MoU', nomor_perjanjian: 'MoU/03/2023', tanggal_mulai_berlaku: '2023-01-01', tanggal_akhir_berlaku: '2026-01-01', status: 'AKTIF' },
  { id: 'pi4', nama_lembaga: 'CV Maju Bersama', cakupan: 'DALAM_NEGERI', negara: 'Indonesia', alamat: 'Surabaya', nama_pic: 'Hendra', kontak_pic: '08111222333', jenis_kerja_sama: 'PKS', nomor_perjanjian: 'PKS/04/2022', tanggal_mulai_berlaku: '2022-01-01', tanggal_akhir_berlaku: '2024-12-31', status: 'NONAKTIF' },
];

// ----- KP Registrations -----
export const mockKP: KPRegistration[] = [
  { id: 'kp1', mahasiswa_id: 's1', periode_id: 'p3', mitra_id: 'pi1', dosen_pembimbing_id: 'l1', dosen_penguji_id: 'l2', tanggal_mulai: '2025-09-01', tanggal_selesai: '2025-12-01', status: 'BERJALAN', catatan_koordinator: 'Diterima di divisi IT', student: mockStudents[0], partner: mockPartners[0] },
  { id: 'kp2', mahasiswa_id: 's2', periode_id: 'p3', tempat_usulan: 'Startup ABC', tanggal_mulai: '2025-10-01', tanggal_selesai: '2026-01-01', status: 'DIAJUKAN', student: mockStudents[1] },
];

// ----- Magang Registrations -----
export const mockMagang: MagangRegistration[] = [
  { id: 'mg1', mahasiswa_id: 's3', periode_id: 'p3', mitra_id: 'pi2', dosen_pembimbing_id: 'l3', nama_pembimbing_lapangan: 'Andi Pratama', tanggal_mulai: '2025-09-15', tanggal_selesai: '2026-03-15', status: 'BERJALAN', student: mockStudents[2], partner: mockPartners[1] },
];

// ----- Final Projects -----
export const mockTA: FinalProject[] = [
  { id: 'ta1', mahasiswa_id: 's1', periode_id: 'p3', judul: 'Rancang Bangun Sistem Prediksi Kelulusan Menggunakan Random Forest', ringkasan_topik: 'Menggunakan algoritma Random Forest untuk memprediksi kelulusan mahasiswa berdasarkan data akademik.', pembimbing_1_id: 'l1', pembimbing_2_id: 'l2', status: 'BIMBINGAN', student: mockStudents[0] },
  { id: 'ta2', mahasiswa_id: 's2', periode_id: 'p3', judul: 'Analisis Sentimen Ulasan Produk E-commerce dengan BERT', ringkasan_topik: 'Menggunakan model BERT untuk menganalisis sentimen ulasan produk.', status: 'PROPOSAL_DIAJUKAN', student: mockStudents[1] },
];

// ----- Defense Sessions -----
export const mockDefenses: DefenseSession[] = [
  { id: 'ds1', ta_id: 'ta1', jenis: 'SEMINAR_PROPOSAL', waktu_mulai: '2025-10-15T09:00:00', waktu_selesai: '2025-10-15T10:30:00', ruang: 'R. Sidang 1', status: 'LULUS', catatan_hasil: 'Proposal diterima dengan revisi minor', nilai: 82 },
];

// ----- Logbooks -----
export const mockLogbooks: Logbook[] = [
  { id: 'lb1', jenis: 'KP', kp_id: 'kp1', tanggal: '2025-09-02', uraian_kegiatan: 'Orientasi dan perkenalan tim', status_verifikasi: 'DIVERIFIKASI', catatan_pembimbing: 'OK' },
  { id: 'lb2', jenis: 'KP', kp_id: 'kp1', tanggal: '2025-09-03', uraian_kegiatan: 'Mempelajari arsitektur sistem perusahaan', status_verifikasi: 'DIVERIFIKASI' },
  { id: 'lb3', jenis: 'KP', kp_id: 'kp1', tanggal: '2025-09-04', uraian_kegiatan: 'Setup development environment', status_verifikasi: 'MENUNGGU' },
  { id: 'lb4', jenis: 'MAGANG', magang_id: 'mg1', tanggal: '2025-09-16', uraian_kegiatan: 'Onboarding dan pengenalan proyek', status_verifikasi: 'DIVERIFIKASI' },
];

// ----- Notifications -----
export const mockNotifications: Notification[] = [
  { id: 'n1', user_id: 'u1', jenis: 'STATUS_PENGAJUAN', judul: 'Pengajuan Pendanaan Baru', isi: 'Muhammad Rizky mengajukan pendanaan lomba Gemastik XVII', tautan: '/dashboard/pendanaan', is_dibaca: false, created_at: '2025-11-01T08:00:00' },
  { id: 'n2', user_id: 'u5', jenis: 'STATUS_PENGAJUAN', judul: 'Pendanaan Disetujui', isi: 'Pengajuan pendanaan Gemastik XVII telah disetujui', tautan: '/dashboard/pendanaan', is_dibaca: true, created_at: '2025-11-10T14:00:00' },
  { id: 'n3', user_id: 'u2', jenis: 'PENGINGAT_ARTEFAK', judul: 'Tenggat Artefak H-7', isi: 'Tenggat unggah artefak perkuliahan tinggal 7 hari', tautan: '/dashboard/artefak', is_dibaca: false, created_at: '2025-10-08T08:00:00' },
  { id: 'n4', user_id: 'u1', jenis: 'TUGAS_BARU', judul: 'Proposal TA Baru', isi: 'Dewi Anggraini mengajukan proposal TA', tautan: '/dashboard/ta', is_dibaca: false, created_at: '2025-11-15T10:00:00' },
];

// ----- Dashboard Stats -----
export const mockDashboardStats: DashboardStats = {
  totalMahasiswa: 245,
  totalDosen: 18,
  totalMitra: 12,
  totalPrestasi: 47,
  rasioKeketatan: 4.6,
  persenDaftarUlang: 85.7,
  indeksKepuasan: 4.12,
  waktuTungguRata: 3.5,
  persenKeterlibatan: 62.5,
  persenIntegrasi: 55.0,
  persenPemanfaatanMitra: 75.0,
};

// ----- Kepuasan per layanan (agregat) -----
export const mockKepuasanPerLayanan = [
  { layanan: 'Akademik', indeks: 4.25, prev: 4.10 },
  { layanan: 'Administrasi', indeks: 3.85, prev: 3.70 },
  { layanan: 'Fasilitas', indeks: 3.95, prev: 4.05 },
  { layanan: 'Kemahasiswaan', indeks: 4.30, prev: 4.15 },
];

// ----- Tren PMB -----
export const mockTrenPMB = [
  { tahun: '2022/2023', pendaftar: 1200, lulus: 300, daftar_ulang: 250 },
  { tahun: '2023/2024', tahun_label: '23/24', pendaftar: 1400, lulus: 330, daftar_ulang: 275 },
  { tahun: '2024/2025', tahun_label: '24/25', pendaftar: 1550, lulus: 350, daftar_ulang: 295 },
  { tahun: '2025/2026', tahun_label: '25/26', pendaftar: 1850, lulus: 410, daftar_ulang: 360 },
];
